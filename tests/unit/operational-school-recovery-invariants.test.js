'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createController: createRefresh } = require('../../src/integration/operational-context-refresh.js');
const { createController: createRealtime } = require('../../src/integration/operational-realtime-invalidation.js');

const settle = () => new Promise(resolve => setImmediate(resolve));

function harness(t) {
    let now = 100000, id = 0, broadcast, status;
    const timers = new Map();
    t.mock.method(Date, 'now', () => now);
    const root = {
        RadarAuthContext: { user: { id: 'u' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-09' }) },
        RadarNavigationHistory: { currentRoute: () => ({ view: 'prontuario', param: 'S' }) },
        RadarTask9PendencyPage: { requestedHistoryStatuses: () => [] },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        document: { querySelectorAll: () => [], activeElement: null, getElementById: () => null },
        console: { warn() {} },
        setTimeout(fn, delay) { timers.set(++id, { fn, at: now + delay }); return id; },
        clearTimeout(key) { timers.delete(key); }
    };
    const calls = [];
    const service = {
        async loadOperationalContext() { calls.push('global'); return { stale: false }; },
        async loadSchoolOperationalContext(school) { calls.push(school); return { stale: false, applied: true }; }
    };
    const refresh = createRefresh(root, service, { minIntervalMs: 30000 });
    const realtime = createRealtime(root, { refreshController: refresh, debounceMs: 2000, client: {
        realtime: { async setAuth() {} },
        channel() { return { on(_type, _filter, cb) { broadcast = cb; return this; },
            subscribe(cb) { status = cb; return this; } }; }
    } });
    return { root, service, calls, refresh, realtime, timers,
        emit(payload) { broadcast({ payload }); }, status(value) { status(value); },
        async advance(ms) {
            const until = now + ms;
            while (true) {
                const next = [...timers].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
                if (!next) break;
                now = next[1].at; timers.delete(next[0]); next[1].fn(); await settle();
            }
            now = until; await settle();
        }
    };
}

test('falha escolar seguida de 30 gestos respeita o mesmo cooldown da leitura global', async t => {
    const h = harness(t);
    h.service.loadSchoolOperationalContext = async () => { h.calls.push('S'); throw new Error('timeout'); };
    await h.refresh.refreshSchool('S', 'realtime-school', { force: true });
    for (let index = 0; index < 30; index += 1) await h.refresh.flushPending('realtime-click');
    assert.equal(h.calls.length, 1, 'gestos não adquirem autoridade para repetir RPC com falha');
    assert.equal(h.refresh.hasPendingRefresh(), true);
    assert.equal(h.timers.size, 1, 'uma única drenagem futura do cooldown');
});

test('retry escolar final stale recupera sozinho depois do cooldown', async t => {
    const h = harness(t);
    h.service.loadSchoolOperationalContext = async () => {
        h.calls.push('S'); return h.calls.length === 1 ? { stale: true, applied: false } : { stale: false, applied: true };
    };
    await h.refresh.refreshSchool('S', 'realtime-school-retry', { force: true });
    await h.advance(30100);
    assert.deepEqual(h.calls, ['S', 'S']);
    assert.equal(h.refresh.hasPendingRefresh(), false);
});

test('evento escolar no debounce não substitui invalidação global por contato', async t => {
    const h = harness(t);
    await h.realtime.start();
    h.emit({ entity: 'pendency_contacts', schoolId: 'S', operation: 'UPDATE' });
    h.emit({ entity: 'verifications', schoolId: 'S', operation: 'UPDATE' });
    await h.advance(2100);
    assert.deepEqual(h.calls, ['global']);
});

test('evento escolar no debounce não apaga recuperação global da reconexão', async t => {
    const h = harness(t);
    await h.realtime.start();
    h.status('SUBSCRIBED'); h.status('SUBSCRIBED');
    h.emit({ entity: 'assets', schoolId: 'S', operation: 'UPDATE' });
    await h.advance(2100);
    assert.deepEqual(h.calls, ['global']);
});

test('escolar que termina enquanto há pendência global não consome o escopo global', async t => {
    const h = harness(t);
    let resolveFirst;
    h.service.loadSchoolOperationalContext = async () => {
        h.calls.push('S');
        if (h.calls.length === 1) await new Promise(resolve => { resolveFirst = resolve; });
        return { stale: false, applied: true };
    };
    const first = h.refresh.refreshSchool('S', 'realtime-school', { force: true });
    await settle();
    const school = h.refresh.refreshSchool('S', 'realtime-school', { force: true });
    const global = h.refresh.refresh('realtime-reconnect', { force: true });
    resolveFirst();
    await Promise.all([first, school, global]);
    assert.deepEqual(h.calls, ['S', 'global']);
});

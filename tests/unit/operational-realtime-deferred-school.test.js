'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { TOPIC, EVENT, createController } = require('../../src/integration/operational-realtime-invalidation.js');

function createHarness({ debounceMs = 0, schoolRefresh } = {}) {
    let route = { view: 'prontuario', param: 'school-a' };
    let broadcastHandler = null;
    const listeners = new Map();
    const globalRefreshes = [];
    const schoolRefreshes = [];
    const channel = {
        on(type, filter, callback) {
            assert.equal(type, 'broadcast');
            assert.deepEqual(filter, { event: EVENT });
            broadcastHandler = callback;
            return this;
        },
        subscribe() { return this; }
    };
    const root = {
        RadarAuthContext: { user: { id: 'u-1' } },
        RadarNavigationHistory: { currentRoute: () => ({ ...route }) },
        addEventListener(type, callback) {
            const current = listeners.get(type) || [];
            current.push(callback);
            listeners.set(type, current);
        },
        removeEventListener(type, callback) {
            const current = listeners.get(type) || [];
            listeners.set(type, current.filter(item => item !== callback));
        },
        setTimeout(callback, milliseconds) { return setTimeout(callback, milliseconds); },
        clearTimeout(handle) { clearTimeout(handle); },
        console: { warn() {} }
    };
    const refreshController = {
        async refresh(reason, options) {
            globalRefreshes.push({ reason, options });
            return { stale: false };
        },
        async refreshSchool(schoolId, reason, options) {
            schoolRefreshes.push({ schoolId, reason, options });
            if (typeof schoolRefresh === 'function') {
                return schoolRefresh({ schoolId, reason, options, call: schoolRefreshes.length });
            }
            return { stale: false, applied: true };
        }
    };
    const client = {
        realtime: { async setAuth() {} },
        channel(topic) {
            assert.equal(topic, TOPIC);
            return channel;
        }
    };
    const controller = createController(root, { client, refreshController, debounceMs });
    return {
        controller,
        globalRefreshes,
        schoolRefreshes,
        emitBroadcast(payload) { broadcastHandler?.({ payload }); },
        navigate(nextRoute) {
            route = { ...nextRoute };
            for (const callback of listeners.get('radar:navigation-committed') || []) {
                callback({ detail: { route: { ...route } } });
            }
        }
    };
}

const waitTimers = () => new Promise(resolve => setTimeout(resolve, 12));

test('mudança de outra escola é adiada sem releitura global da tela atual', async () => {
    const harness = createHarness();
    await harness.controller.start();

    harness.emitBroadcast({ entity: 'verifications', operation: 'UPDATE', schoolId: 'school-b' });
    await waitTimers();

    assert.equal(harness.globalRefreshes.length, 0);
    assert.equal(harness.schoolRefreshes.length, 0);
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, ['school-b']);
});

test('navegar depois para escola suja reconcilia automaticamente só aquela escola', async () => {
    const harness = createHarness();
    await harness.controller.start();
    harness.emitBroadcast({ entity: 'assets', operation: 'UPDATE', schoolId: 'school-b' });
    await waitTimers();

    harness.navigate({ view: 'prontuario', param: 'school-b' });
    await waitTimers();

    assert.equal(harness.globalRefreshes.length, 0);
    assert.deepEqual(harness.schoolRefreshes, [{
        schoolId: 'school-b',
        reason: 'realtime-deferred-navigation',
        options: { force: true }
    }]);
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, []);
});

test('entrar em visão global reconcilia globalmente escolas diferidas', async () => {
    const harness = createHarness();
    await harness.controller.start();
    harness.emitBroadcast({ entity: 'pendencies', operation: 'UPDATE', schoolId: 'school-b' });
    await waitTimers();

    harness.navigate({ view: 'dashboard', param: null });
    await waitTimers();

    assert.equal(harness.schoolRefreshes.length, 0);
    assert.equal(harness.globalRefreshes.length, 1);
    assert.equal(harness.globalRefreshes[0].reason, 'realtime-deferred-navigation');
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, []);
});

test('eco de navegação durante reconciliação não cria segunda leitura da mesma geração', async () => {
    let resolveSchool;
    const schoolBarrier = new Promise(resolve => { resolveSchool = resolve; });
    const harness = createHarness({
        schoolRefresh: async () => schoolBarrier
    });
    await harness.controller.start();
    harness.emitBroadcast({ entity: 'registered_invoices', operation: 'UPDATE', schoolId: 'school-b' });
    await waitTimers();

    harness.navigate({ view: 'prontuario', param: 'school-b' });
    await waitTimers();
    assert.equal(harness.schoolRefreshes.length, 1);

    harness.navigate({ view: 'prontuario', param: 'school-b' });
    await waitTimers();
    assert.equal(harness.schoolRefreshes.length, 1, 'o rerender não pode reabrir a mesma reconciliação');

    resolveSchool({ stale: false, applied: true });
    await waitTimers();
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, []);
});

test('várias escolas diferidas são reconciliadas independentemente', async () => {
    const harness = createHarness();
    await harness.controller.start();
    harness.emitBroadcast({ entity: 'assets', operation: 'UPDATE', schoolId: 'school-b' });
    harness.emitBroadcast({ entity: 'assets', operation: 'UPDATE', schoolId: 'school-c' });
    await waitTimers();

    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, ['school-b', 'school-c']);
    harness.navigate({ view: 'prontuario', param: 'school-b' });
    await waitTimers();
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, ['school-c']);

    harness.navigate({ view: 'prontuario', param: 'school-c' });
    await waitTimers();
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, []);
    assert.deepEqual(harness.schoolRefreshes.map(item => item.schoolId), ['school-b', 'school-c']);
});

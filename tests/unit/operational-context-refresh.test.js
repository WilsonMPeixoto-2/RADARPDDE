'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.join(__dirname, '../../src/integration/operational-context-refresh.js'),
    'utf8'
);

test('sessão remota atualiza somente a competência ativa ao voltar para a aba', () => {
    assert.match(source, /visibilitychange/);
    assert.match(source, /focus/);
    assert.match(source, /loadOperationalContext\(competenceKey/);
    assert.doesNotMatch(source, /setInterval\s*\(/);
    assert.doesNotMatch(source, /administrativeLogs/);
});

test('atualização contextual é limitada por janela mínima e rerenderiza somente após confirmação', () => {
    assert.match(source, /MIN_REFRESH_INTERVAL_MS/);
    assert.match(source, /await\s+service\.loadOperationalContext[\s\S]*refreshCurrentView/);
    assert.match(source, /refreshPromise/);
    assert.match(source, /durationMs/);
});

const { createController } = require('../../src/integration/operational-context-refresh.js');

test('retomada usa a visão canônica, preserva formulários e descarta sessão encerrada durante a consulta', async () => {
    let editing = true, resolveQuery, shouldApply;
    const renders = [], calls = [];
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-09' }) },
        RadarGlobalCompetenceSelector: { refreshCurrentView: () => renders.push('prontuario-school-1') },
        document: { querySelector: () => editing ? {} : null },
        console: { warn() {} }
    };
    const service = { loadOperationalContext(key, options) {
        calls.push(key); shouldApply = options.shouldApply;
        return new Promise(resolve => { resolveQuery = resolve; });
    } };
    const controller = createController(root, service, { minIntervalMs: 0 });
    const skipped = await controller.refresh();
    assert.equal(skipped.reason, 'editing');
    assert.equal(skipped.pending, true);
    assert.equal(controller.hasPendingRefresh(), true);
    assert.equal(calls.length, 0);

    editing = false;
    const pending = controller.flushPending();
    await Promise.resolve();
    assert.equal(shouldApply(), true);
    root.RadarAuthContext = null;
    assert.equal(shouldApply(), false);
    resolveQuery({ stale: true });
    await pending;
    assert.equal(renders.length, 0);

    root.RadarAuthContext = {};
    const next = controller.refresh();
    await Promise.resolve();
    resolveQuery({ stale: false });
    await next;
    assert.deepEqual(renders, ['prontuario-school-1']);
});

test('refresh adiado é retomado após a edição e só atualiza o relógio depois de sucesso confirmado', async () => {
    let editing = true;
    const renders = [];
    const events = [];
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        RadarGlobalCompetenceSelector: { refreshCurrentView: () => renders.push('dashboard') },
        document: { querySelector: () => editing ? {} : null },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent(event) { events.push(event); },
        console: { warn() {} }
    };
    const service = {
        async loadOperationalContext() {
            return { stale: false };
        }
    };
    const controller = createController(root, service, { minIntervalMs: 30000 });

    assert.equal(controller.getLastRefreshAt(), 0);
    await controller.refresh('focus');
    assert.equal(controller.hasPendingRefresh(), true);
    assert.equal(controller.getLastRefreshAt(), 0);

    editing = false;
    const result = await controller.flushPending('form-finished');
    assert.equal(result.stale, false);
    assert.equal(controller.hasPendingRefresh(), false);
    assert.ok(controller.getLastRefreshAt() > 0);
    assert.deepEqual(renders, ['dashboard']);
    assert.equal(events.at(-1).type, 'radar:operational-context-refreshed');
    assert.equal(events.at(-1).detail.competenceKey, '2026-08');
    assert.equal(typeof events.at(-1).detail.durationMs, 'number');
    assert.match(events.at(-1).detail.refreshedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('falha de refresh não avança lastRefreshAt nem apaga a necessidade de nova tentativa adiada', async () => {
    let editing = true;
    const root = {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        document: { querySelector: () => editing ? {} : null },
        console: { warn() {} }
    };
    const service = {
        async loadOperationalContext() {
            throw new Error('network');
        }
    };
    const controller = createController(root, service, { minIntervalMs: 30000 });

    await controller.refresh('focus');
    editing = false;
    const result = await controller.flushPending('form-finished');

    assert.equal(result.ok, false);
    assert.equal(controller.getLastRefreshAt(), 0);
    assert.equal(controller.hasPendingRefresh(), true);
});

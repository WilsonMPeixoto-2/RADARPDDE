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
    assert.equal((await controller.refresh()).reason, 'editing');
    assert.equal(calls.length, 0);
    editing = false;
    const pending = controller.refresh();
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

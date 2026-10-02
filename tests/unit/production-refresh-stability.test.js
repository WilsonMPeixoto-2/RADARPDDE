'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createController: createRefreshController
} = require('../../src/integration/operational-context-refresh.js');
const {
    DEFAULT_DEBOUNCE_MS
} = require('../../src/integration/operational-realtime-invalidation.js');

function stableRoot() {
    return {
        RadarAuthContext: { user: { id: 'user-1' } },
        RadarCompetenceContext: { getState: () => ({ activeKey: '2026-08' }) },
        document: {
            querySelectorAll: () => [],
            activeElement: null,
            getElementById: () => null
        },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        console: { warn() {} }
    };
}

test('falha recente de contexto impede que clique/focusout force nova RPC imediatamente', async () => {
    let calls = 0;
    const service = {
        async loadOperationalContext() {
            calls += 1;
            throw new Error('statement timeout');
        }
    };
    const controller = createRefreshController(stableRoot(), service, {
        minIntervalMs: 30000
    });

    const failed = await controller.refresh('realtime', { force: true });
    assert.equal(failed.ok, false);
    assert.equal(calls, 1);
    assert.equal(controller.hasPendingRefresh(), true);

    const resumed = await controller.flushPending('click');

    assert.equal(calls, 1, 'a interação do usuário não deve repetir a RPC dentro do cooldown');
    assert.equal(resumed.skipped, true);
    assert.equal(resumed.reason, 'throttled');
    assert.equal(controller.hasPendingRefresh(), true);
});

test('invalidação recebida durante leitura bem-sucedida ainda drena uma segunda leitura dentro do cooldown', async () => {
    let calls = 0;
    let releaseFirst;
    const firstBarrier = new Promise(resolve => { releaseFirst = resolve; });
    const service = {
        async loadOperationalContext() {
            calls += 1;
            if (calls === 1) await firstBarrier;
            return { stale: false, revision: calls };
        }
    };
    const controller = createRefreshController(stableRoot(), service, {
        minIntervalMs: 30000
    });

    const first = controller.refresh('focus', { force: true });
    await new Promise(resolve => setImmediate(resolve));
    const invalidation = controller.refresh('realtime', { force: true });

    releaseFirst();
    const [firstResult, invalidationResult] = await Promise.all([first, invalidation]);

    assert.equal(firstResult.stale, false);
    assert.equal(invalidationResult.stale, false);
    assert.equal(calls, 2, 'a invalidação em voo precisa ser drenada após a leitura anterior');
    assert.equal(controller.hasPendingRefresh(), false);
});

test('Realtime agrega rajadas por pelo menos dois segundos antes de reler o contexto pesado', () => {
    assert.ok(
        DEFAULT_DEBOUNCE_MS >= 2000,
        `debounce atual de ${DEFAULT_DEBOUNCE_MS}ms ainda permite tempestade de releituras`
    );
});

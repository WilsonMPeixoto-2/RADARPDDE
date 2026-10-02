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

test('Realtime agrega rajadas por pelo menos dois segundos antes de reler o contexto pesado', () => {
    assert.ok(
        DEFAULT_DEBOUNCE_MS >= 2000,
        `debounce atual de ${DEFAULT_DEBOUNCE_MS}ms ainda permite tempestade de releituras`
    );
});

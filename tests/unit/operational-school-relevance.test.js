'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createController,
    EVENT
} = require('../../src/integration/operational-realtime-invalidation.js');

function createHarness({ route = { view: 'prontuario', param: 'SCHOOL-A' } } = {}) {
    const refreshes = [];
    const listeners = new Map();
    let broadcastHandler = null;
    let statusHandler = null;
    let currentRoute = { ...route };

    const channel = {
        on(type, filter, callback) {
            assert.equal(type, 'broadcast');
            assert.deepEqual(filter, { event: EVENT });
            broadcastHandler = callback;
            return this;
        },
        subscribe(callback) {
            statusHandler = callback;
            return this;
        }
    };
    const root = {
        RadarAuthContext: { user: { id: 'controller-a' }, authorization: { role: 'controller' } },
        RadarNavigationHistory: {
            currentRoute() { return { ...currentRoute }; }
        },
        addEventListener(type, callback) {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(callback);
        },
        removeEventListener(type, callback) {
            listeners.set(type, (listeners.get(type) || []).filter(item => item !== callback));
        },
        setTimeout(callback, milliseconds) { return setTimeout(callback, milliseconds); },
        clearTimeout(handle) { clearTimeout(handle); },
        console: { warn() {} }
    };
    const client = {
        realtime: { async setAuth() {} },
        channel() { return channel; },
        async removeChannel() {}
    };
    const refreshController = {
        async refresh(reason, options) {
            refreshes.push({ reason, options });
            return { stale: false };
        }
    };
    const controller = createController(root, {
        client,
        refreshController,
        debounceMs: 0
    });

    return {
        controller,
        refreshes,
        async start() {
            assert.equal(await controller.start(), true);
            statusHandler?.('SUBSCRIBED');
        },
        broadcast(payload) {
            broadcastHandler?.({ payload });
        },
        navigate(nextRoute) {
            currentRoute = { ...nextRoute };
            for (const callback of listeners.get('radar:navigation-committed') || []) {
                callback({ detail: { route: { ...currentRoute } } });
            }
        }
    };
}

async function settle(milliseconds = 12) {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
}

test('alteração em outra escola não baixa contexto completo enquanto o usuário permanece no próprio Prontuário', async () => {
    const harness = createHarness();
    await harness.start();

    harness.broadcast({ entity: 'verifications', schoolId: 'SCHOOL-B' });
    await settle();

    assert.equal(harness.refreshes.length, 0,
        'trabalho na escola A não deve ser interrompido por uma mudança conhecida somente da escola B');
});

test('ao navegar depois para a escola alterada o RADAR reconcilia automaticamente sem Ctrl+F5', async () => {
    const harness = createHarness();
    await harness.start();

    harness.broadcast({ entity: 'verifications', schoolId: 'SCHOOL-B' });
    await settle();
    assert.equal(harness.refreshes.length, 0);

    harness.navigate({ view: 'prontuario', param: 'SCHOOL-B' });
    await settle();

    assert.equal(harness.refreshes.length, 1);
    assert.match(harness.refreshes[0].reason, /deferred|dirty|navigation/);
});

test('alteração na mesma escola continua chegando rapidamente', async () => {
    const harness = createHarness();
    await harness.start();

    harness.broadcast({ entity: 'verifications', schoolId: 'SCHOOL-A' });
    await settle();

    assert.equal(harness.refreshes.length, 1);
    assert.equal(harness.refreshes[0].reason, 'realtime');
});

test('tela global continua reconciliando mudança escolar porque pode depender de várias escolas', async () => {
    const harness = createHarness({ route: { view: 'dashboard', param: null } });
    await harness.start();

    harness.broadcast({ entity: 'verifications', schoolId: 'SCHOOL-B' });
    await settle();

    assert.equal(harness.refreshes.length, 1);
});

test('Broadcast sem escola conhecida mantém o caminho conservador e não perde atualização', async () => {
    const harness = createHarness();
    await harness.start();

    harness.broadcast({ entity: 'pendencies' });
    await settle();

    assert.equal(harness.refreshes.length, 1);
});

test('pico acelerado de seis escolas não transforma alterações alheias em releituras completas de todas as sessões', async () => {
    const schools = Array.from({ length: 6 }, (_, index) => `SCHOOL-${index + 1}`);
    const harnesses = schools.map(schoolId => createHarness({
        route: { view: 'prontuario', param: schoolId }
    }));
    await Promise.all(harnesses.map(harness => harness.start()));

    // 120 rodadas x 6 escolas = 720 invalidações entregues a cada sessão.
    // Cada sessão deve reagir somente às mudanças da própria escola; as outras
    // cinco não podem multiplicar leituras completas do contexto.
    for (let round = 0; round < 120; round += 1) {
        for (const changedSchool of schools) {
            for (const harness of harnesses) {
                harness.broadcast({ entity: 'verifications', schoolId: changedSchool });
            }
        }
    }
    await settle(25);

    for (const [index, harness] of harnesses.entries()) {
        assert.equal(
            harness.refreshes.length,
            1,
            `sessão da ${schools[index]} deve coalescer a própria rajada e ignorar releituras completas das outras cinco escolas`
        );
        assert.equal(harness.refreshes[0].reason, 'realtime');
        const metrics = harness.controller.getMetrics();
        assert.equal(metrics.broadcastsReceived, 720);
        assert.equal(metrics.deferredSchoolInvalidations, 600);
        assert.deepEqual(
            metrics.dirtySchoolIds,
            [],
            'a única leitura completa da própria sessão também reconcilia as escolas que estavam marcadas como alteradas'
        );
    }
});
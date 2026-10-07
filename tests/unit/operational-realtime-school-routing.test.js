'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    TOPIC,
    EVENT,
    createController
} = require('../../src/integration/operational-realtime-invalidation.js');

function createHarness({ route = { view: 'prontuario', param: 'school-a' } } = {}) {
    let broadcastHandler = null;
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
        RadarNavigationHistory: {
            currentRoute() { return { ...route }; }
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
    const controller = createController(root, { client, refreshController, debounceMs: 0 });
    return {
        controller,
        globalRefreshes,
        schoolRefreshes,
        emit(payload) { broadcastHandler?.({ payload }); }
    };
}

test('Broadcast da escola aberta usa refresh escolar e não releitura global', async () => {
    const harness = createHarness();
    await harness.controller.start();

    harness.emit({ entity: 'verifications', operation: 'UPDATE', schoolId: 'school-a' });
    await new Promise(resolve => setTimeout(resolve, 10));

    assert.equal(harness.globalRefreshes.length, 0);
    assert.deepEqual(harness.schoolRefreshes, [{
        schoolId: 'school-a',
        reason: 'realtime-school',
        options: { force: true }
    }]);
});

test('contato da escola aberta continua no refresh global conservador', async () => {
    const harness = createHarness();
    await harness.controller.start();

    harness.emit({ entity: 'pendency_contacts', operation: 'UPDATE', schoolId: 'school-a' });
    await new Promise(resolve => setTimeout(resolve, 10));

    assert.equal(harness.schoolRefreshes.length, 0);
    assert.deepEqual(harness.globalRefreshes, [{
        reason: 'realtime',
        options: { force: true }
    }]);
});

for (const view of ['dashboard', 'escolas', 'competencias']) {
    test(`${view} encaminha Broadcast escolar à aplicação existente da fatia`, async () => {
        const harness = createHarness({ route: { view, param: null } });
        await harness.controller.start();
        harness.emit({ entity: 'assets', operation: 'INSERT', schoolId: 'school-a' });
        await new Promise(resolve => setTimeout(resolve, 10));
        assert.equal(harness.globalRefreshes.length, 0);
        assert.deepEqual(harness.schoolRefreshes, [{
            schoolId: 'school-a', reason: 'realtime-school', options: { force: true }
        }]);
    });
}

test('outra escola é adiada sem refresh da tela atual', async () => {
    const harness = createHarness({ route: { view: 'prontuario', param: 'school-a' } });
    await harness.controller.start();

    harness.emit({ entity: 'pendencies', operation: 'UPDATE', schoolId: 'school-b' });
    await new Promise(resolve => setTimeout(resolve, 10));

    assert.equal(harness.schoolRefreshes.length, 0);
    assert.equal(harness.globalRefreshes.length, 0);
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, ['school-b']);
});

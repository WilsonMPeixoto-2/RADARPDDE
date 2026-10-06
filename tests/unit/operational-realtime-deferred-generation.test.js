'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { TOPIC, EVENT, createController } = require('../../src/integration/operational-realtime-invalidation.js');

function createHarness({ schoolBehavior, globalBehavior } = {}) {
    let route = { view: 'prontuario', param: 'school-a' };
    let broadcastHandler = null;
    const listeners = new Map();
    const schoolCalls = [];
    const globalCalls = [];
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
        setTimeout,
        clearTimeout,
        console: { warn() {} }
    };
    const refreshController = {
        async refresh(reason, options) {
            globalCalls.push({ reason, options });
            return typeof globalBehavior === 'function'
                ? globalBehavior({ reason, options, call: globalCalls.length })
                : { stale: false };
        },
        async refreshSchool(schoolId, reason, options) {
            schoolCalls.push({ schoolId, reason, options });
            return typeof schoolBehavior === 'function'
                ? schoolBehavior({ schoolId, reason, options, call: schoolCalls.length })
                : { stale: false, applied: true };
        }
    };
    const controller = createController(root, {
        client: {
            realtime: { async setAuth() {} },
            channel(topic) {
                assert.equal(topic, TOPIC);
                return channel;
            }
        },
        refreshController,
        debounceMs: 0
    });
    return {
        controller,
        schoolCalls,
        globalCalls,
        emit(payload) { broadcastHandler?.({ payload }); },
        navigate(nextRoute) {
            route = { ...nextRoute };
            for (const callback of listeners.get('radar:navigation-committed') || []) {
                callback({ detail: { route: { ...route } } });
            }
        }
    };
}

const wait = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));

test('retry escolar stale só limpa a escola depois de resposta autoritativa', async () => {
    const harness = createHarness({
        schoolBehavior: ({ call }) => call === 1
            ? { stale: true, applied: false }
            : { stale: false, applied: true }
    });
    await harness.controller.start();
    harness.emit({ entity: 'assets', operation: 'UPDATE', schoolId: 'school-b' });
    await wait();
    harness.navigate({ view: 'prontuario', param: 'school-b' });
    await wait(40);

    assert.equal(harness.schoolCalls.length, 2);
    assert.equal(harness.schoolCalls[0].reason, 'realtime-deferred-navigation');
    assert.equal(harness.schoolCalls[1].reason, 'realtime-school-retry');
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, []);
});

test('duas respostas stale não apagam a escola ainda não reconciliada', async () => {
    const harness = createHarness({
        schoolBehavior: () => ({ stale: true, applied: false })
    });
    await harness.controller.start();
    harness.emit({ entity: 'assets', operation: 'UPDATE', schoolId: 'school-b' });
    await wait();
    harness.navigate({ view: 'prontuario', param: 'school-b' });
    await wait(40);

    assert.equal(harness.schoolCalls.length, 2, 'o retry permanece limitado a uma tentativa adicional');
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, ['school-b']);
});

test('geração nova não é apagada pelo término da reconciliação anterior', async () => {
    let resolveFirst;
    const firstBarrier = new Promise(resolve => { resolveFirst = resolve; });
    const harness = createHarness({
        schoolBehavior: ({ call }) => call === 1
            ? firstBarrier
            : { stale: false, applied: true }
    });
    await harness.controller.start();

    harness.emit({ entity: 'verifications', operation: 'UPDATE', schoolId: 'school-b' });
    await wait();
    harness.navigate({ view: 'prontuario', param: 'school-b' });
    await wait();
    assert.equal(harness.schoolCalls.length, 1);

    harness.navigate({ view: 'prontuario', param: 'school-a' });
    harness.emit({ entity: 'verifications', operation: 'UPDATE', schoolId: 'school-b' });
    await wait();
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, ['school-b']);

    resolveFirst({ stale: false, applied: true });
    await wait();
    assert.deepEqual(
        harness.controller.getMetrics().dirtySchoolIds,
        ['school-b'],
        'a conclusão da geração antiga não pode apagar a invalidação mais nova'
    );

    harness.navigate({ view: 'prontuario', param: 'school-b' });
    await wait();
    assert.equal(harness.schoolCalls.length, 2);
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, []);
});

test('refresh global autoritativo cobre e limpa escolas diferidas anteriores', async () => {
    const harness = createHarness();
    await harness.controller.start();
    harness.emit({ entity: 'assets', operation: 'UPDATE', schoolId: 'school-b' });
    await wait();
    harness.emit({ entity: 'pendency_contacts', operation: 'UPDATE', schoolId: 'school-a' });
    await wait();

    assert.equal(harness.globalCalls.length, 1);
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, []);
});

test('refresh global pulado não finge ter reconciliado escola diferida', async () => {
    const harness = createHarness({
        globalBehavior: () => ({ skipped: true, reason: 'editing', pending: true })
    });
    await harness.controller.start();
    harness.emit({ entity: 'assets', operation: 'UPDATE', schoolId: 'school-b' });
    await wait();
    harness.emit({ entity: 'pendency_contacts', operation: 'UPDATE', schoolId: 'school-a' });
    await wait();

    assert.equal(harness.globalCalls.length, 1);
    assert.deepEqual(harness.controller.getMetrics().dirtySchoolIds, ['school-b']);
});

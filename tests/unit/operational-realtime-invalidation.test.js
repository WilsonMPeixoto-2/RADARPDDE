'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    TOPIC,
    EVENT,
    createController,
    install
} = require('../../src/integration/operational-realtime-invalidation.js');

function createHarness({ debounceMs = 0 } = {}) {
    const refreshes = [];
    const statuses = [];
    const warnings = [];
    let broadcastHandler = null;
    let statusHandler = null;
    let removedChannel = null;
    let setAuthCalls = 0;

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
    const client = {
        realtime: {
            async setAuth() { setAuthCalls += 1; }
        },
        channel(topic, options) {
            assert.equal(topic, TOPIC);
            assert.equal(options.config.private, true);
            assert.equal(options.config.broadcast.self, false);
            return channel;
        },
        async removeChannel(value) {
            removedChannel = value;
        }
    };
    const refreshController = {
        async refresh(reason, options) {
            refreshes.push({ reason, options });
            return { stale: false };
        }
    };
    const root = {
        RadarAuthContext: { user: { id: 'u-1' }, authorization: { role: 'controller' } },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent(event) { statuses.push(event); },
        setTimeout(callback, milliseconds) {
            return setTimeout(callback, milliseconds);
        },
        clearTimeout(handle) {
            clearTimeout(handle);
        },
        console: { warn(...args) { warnings.push(args); } }
    };
    const controller = createController(root, {
        client,
        refreshController,
        debounceMs
    });
    return {
        root, client, channel, controller, refreshes, statuses, warnings,
        emitBroadcast(payload = {}) { broadcastHandler?.(payload); },
        emitStatus(status, error = null) { statusHandler?.(status, error); },
        getRemovedChannel: () => removedChannel,
        getSetAuthCalls: () => setAuthCalls
    };
}

test('assina canal privado canônico sem publicar mensagens pelo cliente', async () => {
    const harness = createHarness();
    assert.equal(await harness.controller.start(), true);
    assert.equal(harness.getSetAuthCalls(), 1);
    assert.equal(harness.controller.getChannel(), harness.channel);
});

test('primeira assinatura não recarrega; reconexão força uma releitura canônica', async () => {
    const harness = createHarness();
    await harness.controller.start();

    harness.emitStatus('SUBSCRIBED');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(harness.refreshes.length, 0);

    harness.emitStatus('CHANNEL_ERROR', new Error('socket'));
    harness.emitStatus('SUBSCRIBED');
    await new Promise(resolve => setTimeout(resolve, 5));

    assert.deepEqual(harness.refreshes, [{
        reason: 'realtime-reconnect',
        options: { force: true }
    }]);
    assert.equal(harness.statuses.at(-1).detail.status, 'SUBSCRIBED');
});

test('rajada de Broadcast é coalescida e força somente um refresh', async () => {
    const harness = createHarness();
    await harness.controller.start();
    harness.emitStatus('SUBSCRIBED');

    harness.emitBroadcast({ entity: 'pendencies' });
    harness.emitBroadcast({ entity: 'verifications' });
    harness.emitBroadcast({ entity: 'assets' });
    await new Promise(resolve => setImmediate(resolve));

    assert.deepEqual(harness.refreshes, [{
        reason: 'realtime',
        options: { force: true }
    }]);
});

test('stop remove o canal e impede novas atualizações agendadas', async () => {
    const harness = createHarness();
    await harness.controller.start();
    harness.emitStatus('SUBSCRIBED');

    await harness.controller.stop();
    assert.equal(harness.getRemovedChannel(), harness.channel);
    assert.equal(harness.controller.scheduleRefresh('after-stop'), false);
});

test('install reutiliza cliente autenticado e controlador de refresh existentes', async () => {
    let started = false;
    const channel = {
        on() { return this; },
        subscribe() { started = true; return this; }
    };
    const root = {
        document: {},
        RadarAuthContext: { user: { id: 'u-1' } },
        RadarSessionContext: {
            service: {
                client: {
                    realtime: { async setAuth() {} },
                    channel() { return channel; }
                }
            }
        },
        RadarOperationalContextRefreshController: {
            async refresh() { return { stale: false }; }
        },
        setTimeout,
        clearTimeout,
        console: { warn() {} }
    };

    assert.equal(install(root), true);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(started, true);
    assert.equal(root.__radarOperationalRealtimeInvalidationInstalled, true);
});

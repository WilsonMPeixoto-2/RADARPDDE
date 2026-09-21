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
    await new Promise(resolve => setTimeout(resolve, 5));

    assert.deepEqual(harness.refreshes, [{
        reason: 'realtime',
        options: { force: true }
    }]);

    const metrics = harness.controller.getMetrics();
    assert.equal(metrics.broadcastsReceived, 3);
    assert.equal(metrics.coalescedBroadcasts, 2);
    assert.equal(metrics.refreshAttempts, 1);
    assert.equal(metrics.refreshSucceeded, 1);
    assert.equal(metrics.refreshFailed, 0);
    assert.deepEqual(
        { ...metrics.byEntity },
        { pendencies: 1, verifications: 1, assets: 1 }
    );
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


test('falha da releitura disparada por Broadcast não perde a invalidação e faz uma nova tentativa controlada', async () => {
    let attempts = 0;
    const harness = createHarness();
    const originalRefresh = harness.refreshes;
    // O harness registra chamadas; substituímos apenas o comportamento da fronteira.
    const refreshController = {
        async refresh(reason, options) {
            originalRefresh.push({ reason, options });
            attempts += 1;
            if (attempts === 1) return { ok: false, error: new Error('network') };
            return { stale: false };
        }
    };
    const { createController } = require('../../src/integration/operational-realtime-invalidation.js');
    const controller = createController(harness.root, {
        client: harness.client,
        refreshController,
        debounceMs: 0
    });

    assert.equal(await controller.start(), true);
    harness.emitStatus('SUBSCRIBED');
    // O callback do primeiro controller não é usado; emitimos pelo canal compartilhado já configurado.
    harness.emitBroadcast({ entity: 'verifications' });
    await new Promise(resolve => setTimeout(resolve, 15));

    assert.equal(attempts, 2);
    assert.equal(originalRefresh[0].reason, 'realtime');
    assert.equal(originalRefresh[1].reason, 'realtime-retry');
    await controller.stop();
});


test('nova falha no retry Realtime não cria loop de tentativas', async () => {
    let attempts = 0;
    const harness = createHarness();
    const refreshController = {
        async refresh() {
            attempts += 1;
            return { ok: false, error: new Error('offline') };
        }
    };
    const controller = createController(harness.root, {
        client: harness.client,
        refreshController,
        debounceMs: 0
    });

    assert.equal(await controller.start(), true);
    harness.emitStatus('SUBSCRIBED');
    harness.emitBroadcast({ entity: 'pendencies' });
    await new Promise(resolve => setTimeout(resolve, 20));

    assert.equal(attempts, 2);
    await controller.stop();
});


test('resultado stale do refresh Realtime recebe uma única segunda tentativa controlada', async () => {
    let attempts = 0;
    const harness = createHarness();
    const reasons = [];
    const refreshController = {
        async refresh(reason) {
            reasons.push(reason);
            attempts += 1;
            if (attempts === 1) return { stale: true, aborted: true };
            return { stale: false };
        }
    };
    const controller = createController(harness.root, {
        client: harness.client,
        refreshController,
        debounceMs: 0
    });

    assert.equal(await controller.start(), true);
    harness.emitStatus('SUBSCRIBED');
    harness.emitBroadcast({ entity: 'verifications' });
    await new Promise(resolve => setTimeout(resolve, 20));

    assert.equal(attempts, 2);
    assert.deepEqual(reasons, ['realtime', 'realtime-retry']);
    await controller.stop();
});


test('install publica estado UNAVAILABLE quando o canal privado não pode ser criado', async () => {
    const statuses = [];
    const root = {
        document: {},
        RadarAuthContext: { user: { id: 'u-1' }, authorization: { role: 'controller' } },
        RadarSessionContext: {
            service: {
                client: {
                    realtime: { async setAuth() {} },
                    channel() { return null; }
                }
            }
        },
        RadarOperationalContextRefreshController: {
            async refresh() { return { stale: false }; }
        },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent(event) {
            statuses.push(event);
        },
        setTimeout,
        clearTimeout,
        console: { warn() {} }
    };

    assert.equal(install(root), true);
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(statuses.at(-1).type, 'radar:realtime-sync-status');
    assert.equal(statuses.at(-1).detail.status, 'UNAVAILABLE');
    assert.equal(
        root.RadarOperationalRealtimeInvalidationController.getStatus(),
        'UNAVAILABLE',
        'o estado degradado precisa permanecer consultável se o consumidor visual carregar depois do evento'
    );
});


test('falha de setAuth persiste CHANNEL_ERROR e não simula assinatura saudável', async () => {
    const statuses = [];
    const root = {
        RadarAuthContext: { user: { id: 'u-1' }, authorization: { role: 'controller' } },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent(event) { statuses.push(event); },
        setTimeout,
        clearTimeout,
        console: { warn() {} }
    };
    let channelCalls = 0;
    const client = {
        realtime: {
            async setAuth() {
                throw new Error('auth-realtime-failure');
            }
        },
        channel() {
            channelCalls += 1;
            return null;
        }
    };
    const controller = createController(root, {
        client,
        refreshController: {
            async refresh() { return { stale: false }; }
        },
        debounceMs: 0
    });

    await assert.rejects(
        controller.start(),
        /auth-realtime-failure/
    );
    assert.equal(channelCalls, 0);
    assert.equal(controller.getStatus(), 'CHANNEL_ERROR');
    assert.equal(statuses.at(-1).detail.status, 'CHANNEL_ERROR');
    assert.match(statuses.at(-1).detail.error, /auth-realtime-failure/);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createController: createRealtimeController
} = require('../../src/integration/operational-realtime-invalidation.js');

function createSession({ userId, clientInstanceId }) {
    let broadcastHandler = null;
    let statusHandler = null;
    let refreshes = 0;
    const channel = {
        on(_type, _filter, callback) {
            broadcastHandler = callback;
            return this;
        },
        subscribe(callback) {
            statusHandler = callback;
            return this;
        }
    };
    const client = {
        realtime: { async setAuth() {} },
        channel() { return channel; },
        async removeChannel() {}
    };
    const root = {
        RadarAuthContext: { user: { id: userId }, authorization: { role: 'controller' } },
        RadarOperationalClientInstanceId: clientInstanceId,
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent() {},
        setTimeout,
        clearTimeout,
        console: { warn() {} }
    };
    const refreshController = {
        async refresh() {
            refreshes += 1;
            return { stale: false };
        }
    };
    const controller = createRealtimeController(root, {
        client,
        refreshController,
        debounceMs: 0
    });
    return {
        controller,
        emitStatus(status) { statusHandler?.(status); },
        emit(payload) { broadcastHandler?.({ payload }); },
        refreshes: () => refreshes
    };
}

async function settle() {
    await new Promise(resolve => setTimeout(resolve, 4));
}

test('sessão que grava continuamente não relê o contexto por causa do eco do próprio Broadcast', async () => {
    const writer = createSession({ userId: 'controller-a', clientInstanceId: 'tab-a' });
    const observer = createSession({ userId: 'controller-b', clientInstanceId: 'tab-b' });
    await writer.controller.start();
    await observer.controller.start();
    writer.emitStatus('SUBSCRIBED');
    observer.emitStatus('SUBSCRIBED');

    for (let index = 0; index < 12; index += 1) {
        const invalidation = {
            entity: 'verifications',
            operation: 'update',
            originUserId: 'controller-a',
            originClientInstanceId: 'tab-a'
        };
        writer.emit(invalidation);
        observer.emit(invalidation);
        await settle();
    }

    assert.equal(
        writer.refreshes(),
        0,
        'a própria aba já recebeu o resultado autoritativo da gravação e não deve reler ~1 MB por eco Realtime'
    );
    assert.equal(
        observer.refreshes(),
        12,
        'outra sessão continua convergindo normalmente durante a atividade do controlador'
    );
    assert.equal(writer.controller.getMetrics().ownBroadcastsIgnored, 12);
    assert.equal(observer.controller.getMetrics().ownBroadcastsIgnored, 0);

    await writer.controller.stop();
    await observer.controller.stop();
});

test('outra aba do mesmo usuário não é confundida com a instância que originou a gravação', async () => {
    const originTab = createSession({ userId: 'controller-a', clientInstanceId: 'tab-a' });
    const siblingTab = createSession({ userId: 'controller-a', clientInstanceId: 'tab-b' });
    await originTab.controller.start();
    await siblingTab.controller.start();
    originTab.emitStatus('SUBSCRIBED');
    siblingTab.emitStatus('SUBSCRIBED');

    const invalidation = {
        entity: 'registered_invoices',
        operation: 'update',
        originUserId: 'controller-a',
        originClientInstanceId: 'tab-a'
    };
    originTab.emit(invalidation);
    siblingTab.emit(invalidation);
    await settle();

    assert.equal(originTab.refreshes(), 0);
    assert.equal(siblingTab.refreshes(), 1, 'a segunda aba precisa continuar recebendo a alteração');

    await originTab.controller.stop();
    await siblingTab.controller.stop();
});

test('Broadcast legado ou sem proveniência continua provocando reconciliação', async () => {
    const session = createSession({ userId: 'controller-a', clientInstanceId: 'tab-a' });
    await session.controller.start();
    session.emitStatus('SUBSCRIBED');

    session.emit({ entity: 'pendencies', operation: 'update' });
    await settle();

    assert.equal(session.refreshes(), 1);
    assert.equal(session.controller.getMetrics().ownBroadcastsIgnored, 0);
    await session.controller.stop();
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createController: createRealtimeController
} = require('../../src/integration/operational-realtime-invalidation.js');

function createSession({
    userId,
    clientInstanceId,
    ownReconcileMs = 30000,
    debounceMs = 0,
    remoteMinIntervalMs = 0
}) {
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
        debounceMs,
        ownReconcileMs,
        remoteMinIntervalMs
    });
    return {
        controller,
        emitStatus(status) { statusHandler?.(status); },
        emit(payload) { broadcastHandler?.({ payload }); },
        refreshes: () => refreshes
    };
}

async function settle(ms = 4) {
    await new Promise(resolve => setTimeout(resolve, ms));
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
        'sem rate-limit explícito neste cenário-base, outra sessão continua convergindo a cada invalidação'
    );
    assert.equal(writer.controller.getMetrics().ownBroadcastsIgnored, 12);
    assert.equal(observer.controller.getMetrics().ownBroadcastsIgnored, 0);

    await writer.controller.stop();
    await observer.controller.stop();
});

test('ecos da própria escrita convergem em uma única reconciliação após a atividade cessar', async () => {
    const writer = createSession({
        userId: 'controller-a',
        clientInstanceId: 'tab-a',
        ownReconcileMs: 12
    });
    await writer.controller.start();
    writer.emitStatus('SUBSCRIBED');

    for (let index = 0; index < 6; index += 1) {
        writer.emit({
            entity: 'verifications',
            operation: 'update',
            originUserId: 'controller-a',
            originClientInstanceId: 'tab-a'
        });
        await settle(2);
    }

    assert.equal(writer.refreshes(), 0, 'durante a rajada o estado autoritativo local evita releituras redundantes');
    await settle(18);
    assert.equal(writer.refreshes(), 1, 'após a quietude uma única leitura confirma convergência eventual');
    const metrics = writer.controller.getMetrics();
    assert.equal(metrics.ownReconciliationsScheduled, 6);
    assert.equal(metrics.ownReconciliationsCoalesced, 5);

    await writer.controller.stop();
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

test('atividade remota contínua mantém convergência sem transformar cada gravação alheia em leitura completa', async () => {
    const observer = createSession({
        userId: 'controller-observer',
        clientInstanceId: 'tab-observer',
        debounceMs: 1,
        remoteMinIntervalMs: 15
    });
    await observer.controller.start();
    observer.emitStatus('SUBSCRIBED');

    const workload = [
        ['verifications', 'update'],
        ['registered_invoices', 'insert'],
        ['registered_invoices', 'update'],
        ['registered_invoices', 'delete'],
        ['pendencies', 'insert'],
        ['pendencies', 'update'],
        ['pendency_attempts', 'insert'],
        ['pendency_contacts', 'insert'],
        ['assets', 'insert'],
        ['assets', 'update'],
        ['assets', 'delete']
    ];

    for (let index = 0; index < 33; index += 1) {
        const [entity, operation] = workload[index % workload.length];
        observer.emit({
            entity,
            operation,
            originUserId: `controller-${index % 3}`,
            originClientInstanceId: `tab-${index % 3}`
        });
        // Maior que o debounce, menor que a janela mínima desejada. Sem um
        // rate-limit real, cada gravação remota vira uma leitura contextual.
        await settle(3);
    }
    await settle(20);

    assert.ok(
        observer.refreshes() <= 10,
        `33 gravações/correções/exclusões remotas provocaram ${observer.refreshes()} leituras completas`
    );
    assert.ok(observer.refreshes() >= 2, 'a sessão observadora precisa continuar convergindo durante a atividade');
    assert.ok(
        observer.controller.getMetrics().remoteRefreshesRateLimited > 0,
        'o gate precisa provar que invalidações remotas contínuas foram agrupadas pela janela operacional'
    );

    await observer.controller.stop();
});

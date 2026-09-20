'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');
const {
    createController: createRefreshController
} = require('../../src/integration/operational-context-refresh.js');
const {
    EVENT,
    TOPIC,
    createController: createRealtimeController
} = require('../../src/integration/operational-realtime-invalidation.js');

function snapshot(entities = {}) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'realtime-write-abort-interleaving',
        exportedAt: '2026-09-20T04:35:00.000Z'
    });
}

function operationalEntities() {
    return {
        verifications: [],
        registeredInvoices: [],
        pendencies: [],
        pendencyAttempts: [],
        pendencyContacts: [],
        assets: []
    };
}

test('Broadcast cuja leitura é abortada por gravação converge com nova releitura após o commit', async () => {
    let firstReadStarted;
    const firstStarted = new Promise(resolve => { firstReadStarted = resolve; });
    let queryCalls = 0;
    let applyCalls = 0;

    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        load: async () => [],
        save: async () => [],
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async () => snapshot({}),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true, mode: 'supabase' }),
        queryOperationalContext({ competenceId, signal }) {
            queryCalls += 1;
            if (queryCalls === 1) {
                firstReadStarted();
                return new Promise((resolve, reject) => {
                    signal.addEventListener('abort', () => {
                        const error = new Error('aborted by write');
                        error.name = 'AbortError';
                        reject(error);
                    }, { once: true });
                });
            }
            return Promise.resolve({
                competenceId,
                entities: operationalEntities()
            });
        }
    };

    const statePort = {
        capture: async () => snapshot({}),
        exportCanonical: async () => snapshot({}),
        applyCanonical: async () => undefined,
        restore: async () => undefined,
        applyEntities: async () => { applyCalls += 1; }
    };

    const dataService = new DataService({ repository, statePort });
    dataService.executeCommand = async () => ({ ok: true, committed: true });

    const timers = new Map();
    let timerSequence = 0;
    function schedule(callback) {
        timerSequence += 1;
        timers.set(timerSequence, callback);
        return timerSequence;
    }
    function clearTimer(handle) {
        timers.delete(handle);
    }
    function runNextTimer() {
        const next = timers.entries().next();
        assert.equal(next.done, false, 'deveria existir atualização agendada');
        const [handle, callback] = next.value;
        timers.delete(handle);
        callback();
    }

    let broadcastHandler = null;
    let statusHandler = null;
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
        realtime: { async setAuth() {} },
        channel(topic, options) {
            assert.equal(topic, TOPIC);
            assert.equal(options.config.private, true);
            return channel;
        },
        async removeChannel() {}
    };

    const root = {
        RadarAuthContext: {
            user: { id: 'user-1' },
            authorization: { role: 'controller' }
        },
        RadarCompetenceContext: {
            getState: () => ({ activeKey: '2026-08' })
        },
        document: {
            querySelectorAll: () => [],
            querySelector: () => null,
            activeElement: null,
            getElementById: () => null
        },
        RadarGlobalCompetenceSelector: { refreshCurrentView() {} },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent() {},
        setTimeout: schedule,
        clearTimeout: clearTimer,
        console: { warn() {} }
    };

    const refreshController = createRefreshController(root, dataService, { minIntervalMs: 0 });
    const realtimeController = createRealtimeController(root, {
        client,
        refreshController,
        debounceMs: 0
    });

    assert.equal(await realtimeController.start(), true);
    statusHandler('SUBSCRIBED');

    broadcastHandler({ payload: { entity: 'verifications' } });
    assert.equal(timers.size, 1);
    runNextTimer();

    await firstStarted;
    assert.equal(queryCalls, 1);

    await dataService.execute({ name: 'test:write-aborts-realtime-read' });
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(
        timers.size,
        1,
        'stale/aborted provocado por escrita deve agendar uma releitura após o commit'
    );

    runNextTimer();
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(queryCalls, 2);
    assert.equal(applyCalls, 1);
    assert.equal(refreshController.hasPendingRefresh(), false);

    await realtimeController.stop();
});

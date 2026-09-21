'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createController
} = require('../../src/integration/operational-realtime-invalidation.js');
const feedback = require('../../src/integration/operational-write-feedback.js');

function createRoot() {
    const listeners = new Map();
    const elements = new Map();
    const document = {
        getElementById(id) {
            return elements.get(id) || null;
        },
        createElement() {
            return {
                id: '',
                className: '',
                hidden: false,
                textContent: '',
                dataset: {},
                attributes: new Map(),
                setAttribute(name, value) {
                    this.attributes.set(name, String(value));
                }
            };
        },
        body: {
            appendChild(node) {
                elements.set(node.id, node);
                return node;
            }
        }
    };
    const root = {
        document,
        RadarAuthContext: {
            user: { id: 'u-1' },
            authorization: { role: 'controller' }
        },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        addEventListener(type, callback) {
            const current = listeners.get(type) || [];
            current.push(callback);
            listeners.set(type, current);
        },
        dispatchEvent(event) {
            for (const callback of listeners.get(event.type) || []) callback(event);
        },
        setTimeout,
        clearTimeout,
        console: { warn() {} }
    };
    return { root, elements };
}

test('status real do controlador governa aviso visual e reconexão canônica ponta a ponta', async () => {
    const { root, elements } = createRoot();
    let statusHandler = null;
    let refreshes = 0;

    const channel = {
        on() { return this; },
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
    const refreshController = {
        async refresh(reason, options) {
            refreshes += 1;
            assert.equal(reason, 'realtime-reconnect');
            assert.deepEqual(options, { force: true });
            return { stale: false };
        }
    };

    const controller = createController(root, {
        client,
        refreshController,
        debounceMs: 0
    });
    root.RadarOperationalRealtimeInvalidationController = controller;

    assert.equal(feedback.installRealtimeStatusFeedback(root), true);
    assert.equal(await controller.start(), true);

    statusHandler('SUBSCRIBED');
    const status = elements.get(feedback.REALTIME_STATUS_ID);
    assert.ok(status);
    assert.equal(status.hidden, true);

    statusHandler('CHANNEL_ERROR', new Error('socket-down'));
    assert.equal(controller.getStatus(), 'CHANNEL_ERROR');
    assert.equal(status.hidden, false);
    assert.equal(status.textContent, feedback.REALTIME_SYNC_WARNING_MESSAGE);
    assert.equal(status.dataset.radarRealtimeStatus, 'channel_error');

    statusHandler('SUBSCRIBED');
    await new Promise(resolve => setTimeout(resolve, 5));

    assert.equal(controller.getStatus(), 'SUBSCRIBED');
    assert.equal(status.hidden, true);
    assert.equal(status.textContent, '');
    assert.equal(status.dataset.radarRealtimeStatus, 'subscribed');
    assert.equal(refreshes, 1);
    assert.equal(controller.getMetrics().reconnectRefreshes, 1);

    await controller.stop();
});

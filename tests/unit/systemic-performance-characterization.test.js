'use strict';

// Diagnostic characterization only. These tests describe the current behavior,
// not a desired future contract for responsiveness or read scope.
// The runtime must not be changed to make this diagnostic pass.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createController } = require('../../src/integration/operational-realtime-invalidation.js');

function controlledClock() {
    let now = 0;
    let nextId = 0;
    const scheduled = new Map();
    return {
        now: () => now,
        setTimeout(callback, delay = 0) {
            const id = ++nextId;
            scheduled.set(id, { due: now + delay, callback });
            return id;
        },
        clearTimeout(id) { scheduled.delete(id); },
        async advance(ms) {
            const until = now + ms;
            while (true) {
                const ready = [...scheduled.entries()]
                    .filter(([, item]) => item.due <= until)
                    .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
                if (!ready) break;
                const [id, item] = ready;
                scheduled.delete(id);
                now = item.due;
                item.callback();
            }
            now = until;
            // Allow the controller's async refresh/result/acknowledge chain to settle.
            await new Promise(resolve => setImmediate(resolve));
        }
    };
}

async function harness() {
    const clock = controlledClock();
    let onBroadcast;
    const invocations = [];
    const root = {
        RadarAuthContext: { user: { id: 'synthetic-controller' } },
        RadarNavigationHistory: {
            currentRoute: () => ({ view: 'dashboard', param: null })
        },
        setTimeout: clock.setTimeout.bind(clock),
        clearTimeout: clock.clearTimeout.bind(clock),
        console: { warn() {} }
    };
    const channel = {
        on(type, filter, callback) {
            assert.equal(type, 'broadcast');
            onBroadcast = callback;
            return this;
        },
        subscribe() { return this; }
    };
    const client = {
        realtime: { async setAuth() {} },
        channel() { return channel; }
    };
    const refreshController = {
        async refresh(reason) {
            invocations.push({ scope: 'global', reason, at: clock.now() });
            return { stale: false, applied: true };
        },
        async refreshSchool(schoolId, reason) {
            invocations.push({ scope: 'school', schoolId, reason, at: clock.now() });
            return { stale: false, applied: true };
        }
    };
    const controller = createController(root, { client, refreshController, debounceMs: 2000 });
    assert.equal(await controller.start(), true);
    return {
        clock,
        invocations,
        metrics: () => controller.getMetrics(),
        emit(schoolId) {
            onBroadcast({ payload: { entity: 'verifications', operation: 'UPDATE', schoolId } });
        }
    };
}

test('diagnóstico: dois avisos da mesma escola fazem uma leitura escolar', async () => {
    const h = await harness();
    h.emit('S1');
    await h.clock.advance(1000);
    h.emit('S1');
    await h.clock.advance(1999);
    assert.equal(h.invocations.length, 0);
    await h.clock.advance(1);
    assert.deepEqual(h.invocations, [
        { scope: 'school', schoolId: 'S1', reason: 'realtime-school', at: 3000 }
    ]);
    assert.equal(h.metrics().broadcastsReceived, 2);
});

test('diagnóstico: escolas diferentes na mesma janela promovem releitura global', async () => {
    const h = await harness();
    h.emit('S1');
    await h.clock.advance(1000);
    h.emit('S2');
    await h.clock.advance(2000);
    assert.deepEqual(h.invocations, [
        { scope: 'global', reason: 'realtime-school', at: 3000 }
    ]);
    assert.equal(h.metrics().broadcastsReceived, 2);
});

test('diagnóstico: avisos contínuos podem adiar toda atualização até acabar a rajada', async () => {
    const h = await harness();
    h.emit('S1'); // t=0
    for (let i = 0; i < 4; i++) {
        await h.clock.advance(1000);
        h.emit('S1'); // t=1000,2000,3000,4000
    }
    await h.clock.advance(1999);
    assert.equal(h.invocations.length, 0,
        'o gesto inicial ainda não gerou refresh após quase seis segundos');
    await h.clock.advance(1);
    assert.deepEqual(h.invocations, [
        { scope: 'school', schoolId: 'S1', reason: 'realtime-school', at: 6000 }
    ]);
    assert.equal(h.metrics().broadcastsReceived, 5);
});

// These tests do NOT prove slow perceived UI nor Production frequency.
// They provide an executable, deterministic characterization of the scheduler.

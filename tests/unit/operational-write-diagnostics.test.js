'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const diagnostics = require('../../src/integration/operational-write-diagnostics.js');

test('mede clique, feedback, RPC, aplicação e estabilização sem telemetria externa', () => {
    let now = 0;
    const probe = diagnostics.createProbe({ now: () => now, limit: 10 });
    const id = probe.begin('toggleBonif');
    now = 4;
    probe.mark(id, 'feedback');
    now = 6;
    probe.mark(id, 'rpcStart');
    now = 46;
    probe.mark(id, 'rpcEnd');
    now = 47;
    probe.mark(id, 'applyStart');
    now = 51;
    probe.mark(id, 'applyEnd');
    now = 55;
    probe.mark(id, 'stable');

    assert.deepEqual(probe.snapshot()[0].durations, {
        clickToFeedback: 4,
        rpc: 40,
        apply: 4,
        clickToStable: 55
    });
    assert.deepEqual(probe.summary(), {
        sampleCount: 1,
        clickToFeedback: { p50: 4, p95: 4 },
        rpc: { p50: 40, p95: 40 },
        apply: { p50: 4, p95: 4 },
        clickToStable: { p50: 55, p95: 55 }
    });
});

test('calcula p50 e p95 deterministicamente para séries repetíveis', () => {
    const values = Array.from({ length: 20 }, (_, index) => index + 1);
    assert.equal(diagnostics.percentile(values, 0.50), 10);
    assert.equal(diagnostics.percentile(values, 0.95), 19);
});

test('limita a janela de amostras para não acumular memória em diagnósticos longos', () => {
    let now = 0;
    const probe = diagnostics.createProbe({ now: () => now, limit: 2 });
    for (let index = 0; index < 3; index += 1) {
        const id = probe.begin(`write-${index}`);
        now += 1;
        probe.mark(id, 'stable');
        now += 1;
    }
    const snapshot = probe.snapshot();
    assert.equal(snapshot.length, 2);
    assert.equal(snapshot[0].label, 'write-1');
    assert.equal(snapshot[1].label, 'write-2');
});

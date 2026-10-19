'use strict';

// Cross-layer diagnostic. No production credentials or DB are used.
// Real DataService + UnitOfWork + StatePort + state-bridge; fake only repository I/O.
// This characterizes the current cost; it must NOT become an acceptance budget.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { DataService } = require('../../src/application/data-service.js');
const { createStatePort } = require('../../src/application/state-port.js');
const bridge = require('../../src/data/state-bridge.js');

function storage() {
    const values = new Map();
    return {
        get length() { return values.size; },
        key(i) { return [...values.keys()][i] ?? null; },
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

function createHarness(count) {
    const verifications = {};
    for (let i = 1; i <= count; i++) {
        const school = 'S' + i;
        verifications[school] = {
            '2026-08_BASIC': {
                bonificacao: { extCC: 'Não' },
                analise: { extCC: 'Não analisado' },
                resultadoBonif: '',
                rowVersion: 1
            }
        };
    }
    const memory = { verifications, logs: [] };
    const originals = {
        target: structuredClone(verifications.S1),
        another: count > 1 ? structuredClone(verifications['S' + count]) : null
    };
    const phases = [];
    const counters = { repositoryLoads: 0, persistCalls: 0 };
    const real = createStatePort({
        storage: storage(),
        bridge,
        readMemory: () => memory,
        readMemoryEntities: async keys => Object.fromEntries(
            keys.filter(k => Object.hasOwn(memory, k)).map(k => [k, memory[k]])
        ),
        patchMemory: async patch => { Object.assign(memory, patch); }
    });

    function measurePhase(name, fn) {
        return async (...args) => {
            const start = performance.now();
            try { return await fn(...args); }
            finally { phases.push({ name, ms: performance.now() - start }); }
        };
    }
    const port = {
        ...real,
        captureEntities: measurePhase('captureEntities', real.captureEntities),
        exportCanonicalEntities: measurePhase('exportCanonicalEntities', real.exportCanonicalEntities),
        applyEntities: measurePhase('applyEntities', real.applyEntities),
        restoreEntities: measurePhase('restoreEntities', real.restoreEntities)
    };
    const repository = {
        capabilities: () => ({ remote: true, mode: 'supabase' }),
        load: async () => { counters.repositoryLoads++; throw Error('Unexpected global reload'); },
        exportSnapshot: async () => { throw Error('Unexpected remote export'); },
        save: async () => { throw Error('Unexpected generic save'); },
        remove: async () => { throw Error('Unexpected generic remove'); },
        restoreSnapshot: async () => { throw Error('Unexpected remote restore'); },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
    return { service: new DataService({ repository, statePort: port }),
        memory, counters, phases, originals };
}

async function measureOne(rowCount, shouldReject = false) {
    const h = createHarness(rowCount);
    const before = performance.now();
    let persistedRowCount = null;
    let threw = false;
    let result = null;
    try {
        result = await h.service.execute({
            name: shouldReject ? 'diagnostic:local-rollback' : 'diagnostic:authoritative-write',
            changedEntities: ['verifications', 'administrativeLogs'],
            remoteCommitIsAuthoritative: true,
            mutate: () => {
                h.memory.verifications.S1['2026-08_BASIC'].bonificacao.extCC = 'Sim';
                h.memory.logs.push({
                    id: 'synthetic-log', school_id: 'S1', action: 'Bonificação Alterada',
                    details: { key: 'extCC' }, event_at: '2026-08-21T12:00:00Z'
                });
                return { changed: 'S1' };
            },
            persist: async ({ snapshot }) => {
                h.counters.persistCalls++;
                persistedRowCount = snapshot.entities.verifications.length;
                assert.equal(persistedRowCount, rowCount);
                if (shouldReject) throw new Error('synthetic rejection before database commit');
                const changed = snapshot.entities.verifications.find(v => v.school_id === 'S1');
                assert.equal(changed?.bonification?.extCC, 'Sim');
                return {
                    verification: { ...changed, row_version: 2 },
                    remoteCommitConfirmed: true
                };
            }
        });
    } catch (error) {
        if (!shouldReject) throw error;
        assert.match(String(error.message), /synthetic rejection/);
        threw = true;
    }
    const elapsedMs = performance.now() - before;
    if (shouldReject) {
        assert.equal(threw, true);
        assert.deepEqual(h.memory.verifications.S1, h.originals.target);
        assert.equal(h.memory.logs.length, 0);
    } else {
        assert.equal(result?.ok, true);
        assert.equal(result?.stateSync?.status, 'applied');
        assert.equal(result?.refreshPending, false);
        assert.equal(h.memory.verifications.S1['2026-08_BASIC'].bonificacao.extCC, 'Sim');
        assert.equal(h.memory.verifications.S1['2026-08_BASIC'].rowVersion, 2);
        assert.equal(h.memory.logs.length, 1);
    }
    if (rowCount > 1) {
        assert.deepEqual(h.memory.verifications['S' + rowCount], h.originals.another);
    }
    assert.equal(h.counters.persistCalls, 1);
    assert.equal(h.counters.repositoryLoads, 0);
    return {
        rows: rowCount, changedRows: 1, rollback: shouldReject,
        elapsedMs: Math.round(elapsedMs * 1000) / 1000,
        phases: h.phases.map(p => ({ name: p.name, ms: Math.round(p.ms * 1000) / 1000 })),
        snapshotRowCount: persistedRowCount,
        outcome: shouldReject ? 'restored-before-remote-commit' : 'remote-commit-and-local-apply',
        unrelatedSchoolsPreserved: true
    };
}

test('diagnóstico integrado: tempo de gravação por tamanho da coleção e rollback seguro', async () => {
    const groups = [];
    for (const n of [1, 163, 1630]) {
        await measureOne(n);
        const samples = [];
        for (let i = 0; i < 5; i++) samples.push(await measureOne(n));
        const sorted = samples.map(s => s.elapsedMs).sort((a, b) => a - b);
        groups.push({ verificationRows: n, samples, medianMs: sorted[2],
            phaseMediansMs: Object.fromEntries(
                [...new Set(samples.flatMap(s => s.phases.map(p => p.name)))].map(phase => {
                    const times = samples.map(s => s.phases.find(p => p.name === phase)?.ms || 0)
                        .sort((a, b) => a - b);
                    return [phase, times[2]];
                })
            ) });
    }
    const rollback = await measureOne(163, true);
    const report = {
        schemaVersion: 1, kind: 'cross-layer-write-pipeline-characterization',
        code: 'real DataService + UnitOfWork + StatePort + state-bridge; fake repository boundary',
        groups, rollback,
        limitations: [
            'Synthetic memory and isolated Node.js, not a logged-in Production journey.',
            'The logged school count is not the set concurrently resident in real browsers.',
            'No real Supabase, network, RLS, triggers, DOM or Realtime; only one command.',
            'Timings depend on runner GC/JIT. No performance budget or speed claim.',
            'Rollback validated only for explicit failure before remote commit; not ambiguous ACK.'
        ]
    };
    fs.mkdirSync(path.join('test-results', 'performance-diagnostics'), { recursive: true });
    fs.writeFileSync(path.join('test-results','performance-diagnostics',
        'write-pipeline-characterization.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('[systemic-write-pipeline]', JSON.stringify({
        groups: groups.map(g => ({ verificationRows: g.verificationRows,
            medianMs: g.medianMs, phaseMediansMs: g.phaseMediansMs })),
        rollback: rollback.outcome
    }));
});

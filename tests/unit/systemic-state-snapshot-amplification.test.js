'use strict';

// Diagnostic characterization: one remote write, varying *unrelated* school
// verifications. Never use timings as acceptance thresholds and never treat
// entity-wide copies as a future contract.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createStatePort } = require('../../src/application/state-port.js');
const { UnitOfWork } = require('../../src/application/unit-of-work.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function makeStatePort(rowCount) {
    const memory = {
        verifications: Array.from({ length: rowCount }, (_, index) => ({
            id: 'S' + (index + 1) + '::2026-08::BASIC',
            school_id: 'S' + (index + 1),
            competence_id: '2026-08',
            program_id: 'BASIC',
            bonification: { extCC: 'Não' },
            analysis: { extCC: 'Não analisado' },
            bonus_result: null,
            row_version: 1,
            payload: { comment: 'somente dados sintéticos' }
        })),
        logs: []
    };
    const storage = {
        length: 0,
        key: () => null,
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined
    };
    const bridge = {
        LEGACY_STORAGE_MAP: {
            verifications: { key: 'radar_pdde_verifications' },
            logs: { key: 'radar_pdde_logs' }
        },
        BRIDGE_METADATA_STORAGE_KEY: 'radar_pdde_bridge_metadata',
        exportLegacySnapshot(stage, options) {
            return {
                snapshot: createSnapshotEnvelope({
                    verifications: JSON.parse(stage.getItem('radar_pdde_verifications') || '[]'),
                    administrativeLogs: JSON.parse(stage.getItem('radar_pdde_logs') || '[]')
                }, options)
            };
        },
        restoreCanonicalSnapshotToLegacyStorage() {
            throw new Error('O caminho remoto não deve restaurar tudo no localStorage.');
        }
    };
    return {
        memory,
        port: createStatePort({
            storage,
            bridge,
            readMemory: () => memory,
            readMemoryEntities: async keys => Object.fromEntries(
                keys.map(key => [key, memory[key]])
            ),
            patchMemory: async patch => Object.assign(memory, patch)
        })
    };
}

async function characterize(rowCount) {
    const { memory, port } = makeStatePort(rowCount);
    const unitOfWork = new UnitOfWork({ statePort: port });
    const nativeClone = globalThis.structuredClone;
    const copied = { snapshots: 0, arrays: 0, records: 0 };
    // Records copied are counted without modifying objects or changing
    // persistence semantics. Restore the global in finally.
    globalThis.structuredClone = function diagnosticClone(input, ...rest) {
        const records = Array.isArray(input) && input[0]?.competence_id
            ? input
            : (Array.isArray(input?.entities?.verifications)
                ? input.entities.verifications : null);
        if (records?.length) {
            copied.records += records.length;
            if (Array.isArray(input)) copied.arrays += 1;
            else copied.snapshots += 1;
        }
        return nativeClone.call(this, input, ...rest);
    };
    let observed;
    const started = process.hrtime.bigint();
    try {
        const result = await unitOfWork.run({
            name: 'diagnostic:school-row-entity-wide-write',
            remotePersistence: true,
            deferLocalCommit: true,
            changedEntities: ['verifications', 'administrativeLogs'],
            mutate: () => {
                memory.verifications[0].bonification.extCC = 'Sim';
                memory.logs.push({ id: 'diagnostic-log', school_id: 'S1', action: 'BONUS' });
                return { ok: true };
            },
            persist: async ({ snapshot }) => {
                observed = {
                    verificationRowsInSnapshot: snapshot.entities.verifications.length,
                    changedTargetRecords: snapshot.entities.verifications.filter(
                        row => row.bonification.extCC === 'Sim'
                    ).length,
                    logRows: snapshot.entities.administrativeLogs.length
                };
                return { remoteCommitConfirmed: true };
            }
        });
        assert.equal(result.remoteCommitConfirmed, true);
    } finally {
        globalThis.structuredClone = nativeClone;
    }
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    assert.deepEqual(observed, {
        verificationRowsInSnapshot: rowCount,
        changedTargetRecords: 1,
        logRows: 1
    });
    return {
        unrelatedVerifications: rowCount - 1,
        mutatedRows: 1,
        snapshotRows: observed.verificationRowsInSnapshot,
        copiesOfSnapshotOrVerificationArray: copied.snapshots + copied.arrays,
        cumulativelyCopiedVerificationRows: copied.records,
        elapsedMs: Math.round(elapsedMs * 100) / 100
    };
}

test('diagnóstico: gravação escolar ainda percorre coleções inteiras de verificações', async () => {
    const results = [];
    for (const rowCount of [1, 163, 1630]) {
        results.push(await characterize(rowCount));
    }
    assert.deepEqual(results.map(row => row.mutatedRows), [1, 1, 1]);
    console.log('[state-clone-characterization]', JSON.stringify({
        caveat: 'Resultado de código sintético e Node.js local; tempos não medem produção.',
        results
    }));
});

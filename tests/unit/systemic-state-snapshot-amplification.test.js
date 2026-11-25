'use strict';

// Diagnostic characterization: one remote write, varying *unrelated* school
// verifications. Never use timings as acceptance thresholds and never treat
// entity-wide copies as a future contract.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
    const copied = { snapshots: 0, arrays: 0, records: 0, memoryCopies: 0 };
    // Records copied are counted without modifying objects or changing
    // persistence semantics. Restore the global in finally.
    globalThis.structuredClone = function diagnosticClone(input, ...rest) {
        const direct = Array.isArray(input) && input[0]?.competence_id;
        const snapshot = Array.isArray(input?.entities?.verifications);
        const memory = Array.isArray(input?.verifications);
        const records = direct ? input
            : (snapshot ? input.entities.verifications
                : (memory ? input.verifications : null));
        if (records?.length) {
            copied.records += records.length;
            if (Array.isArray(input)) copied.arrays += 1;
            else if (memory) copied.memoryCopies += 1;
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
        memoryCopies: copied.memoryCopies,
        cumulativelyCopiedVerificationRows: copied.records,
        elapsedMs: Math.round(elapsedMs * 100) / 100
    };
}

test('diagnóstico: custo por gravação cresce com registros de outras escolas', async () => {
    const volumes = [1, 163, 1630, 16300];
    // Aquecimento não entra no tempo publicado. Vários ensaios delimitam
    // variação de JIT/GC sem criar um gate baseado em milissegundos.
    const report = [];
    for (const rowCount of volumes) {
        await characterize(rowCount);
        const attempts = [];
        for (let run = 0; run < 5; run += 1) {
            attempts.push(await characterize(rowCount));
        }
        const sorted = attempts.map(x => x.elapsedMs).sort((a, b) => a - b);
        const first = attempts[0];
        assert(attempts.every(x => x.mutatedRows === 1));
        assert(attempts.every(x => x.snapshotRows === rowCount));
        assert(attempts.every(x => x.cumulativelyCopiedVerificationRows > 0));
        report.push({
            totalVerificationRows: rowCount,
            changedRows: 1,
            unrelatedRows: rowCount - 1,
            samplesMs: attempts.map(x => x.elapsedMs),
            medianMs: sorted[2],
            minMs: sorted[0],
            maxMs: sorted[4],
            clonedRecordOccurrences: first.cumulativelyCopiedVerificationRows,
            cloneOperations: first.copiesOfSnapshotOrVerificationArray + first.memoryCopies,
            recordsCopiedPerChangedRow: first.cumulativelyCopiedVerificationRows,
            note: 'Registros clonados são ocorrências com repetição, não IDs únicos.'
        });
    }
    const evidence = {
        schemaVersion: 1,
        kind: 'isolated-state-port-unit-of-work-clone-volume',
        baseline: 'StatePort + UnitOfWork do PR de testes; escrita remota sintética',
        runtime: { node: process.version, platform: process.platform },
        volumeFactors: '1, 163, 1630, 16300 linhas de verificações',
        caveats: [
            'Amostras do runner GitHub Actions, não latências de usuário em Production.',
            'A prova mede somente o processamento local; RPC, DOM, auditoria e RLS não participam.',
            'Memória instrumentada envolve global structuredClone do processo de teste.',
            'Nenhum orçamento de tempo máximo é imposto: medir não é exigir rapidez arbitrária.',
            'Preservar rollback, concorrência e estado autoritativo antes de qualquer otimização.'
        ],
        groups: report
    };
    const directory = path.join('test-results', 'performance-diagnostics');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'state-clone-amplification.json'),
        JSON.stringify(evidence, null, 2) + '\n');
    console.log('[state-clone-volume]', JSON.stringify(report));
});

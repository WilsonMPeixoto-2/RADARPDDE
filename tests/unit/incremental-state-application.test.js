'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createStatePort } = require('../../src/application/state-port.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshot(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'incremental-state-test',
        exportedAt: '2026-08-22T04:00:00.000Z'
    });
}

function clone(value) {
    return structuredClone(value);
}

test('StatePort aplica somente verificações e logs no retorno remoto incremental', async () => {
    let memory = {
        schools: [{ id: '04.10.001', denominação: 'Escola preservada' }],
        verifications: {
            '04.10.001': {
                '2026-08_BASIC': {
                    bonificacao: { extCC: 'Não' },
                    analise: { extCC: 'Não analisado' },
                    rowVersion: 1
                }
            }
        },
        logs: [{ id: 'log-antigo' }]
    };
    const patches = [];
    const storage = {
        length: 0,
        key: () => null,
        getItem: () => null,
        setItem: () => {
            throw new Error('applyEntities remoto não deve persistir localStorage');
        },
        removeItem: () => undefined
    };
    const bridge = {
        LEGACY_STORAGE_MAP: {},
        BRIDGE_METADATA_STORAGE_KEY: 'radar_pdde_bridge_metadata',
        exportLegacySnapshot: () => ({ snapshot: snapshot({}) }),
        restoreCanonicalSnapshotToLegacyStorage: () => {
            throw new Error('applyEntities não deve reconstruir o snapshot legado completo');
        },
        canonicalEntitiesToLegacyState: entities => ({
            verifications: (entities.verifications || []).reduce((result, record) => {
                if (!result[record.school_id]) result[record.school_id] = {};
                result[record.school_id][`${record.competence_id}_${record.program_id}`] = {
                    bonificacao: clone(record.bonification || {}),
                    analise: clone(record.analysis || {}),
                    rowVersion: record.row_version
                };
                return result;
            }, {}),
            logs: (entities.administrativeLogs || []).map(record => ({ id: record.id }))
        })
    };
    const port = createStatePort({
        storage,
        bridge,
        readMemory: () => memory,
        writeMemory: next => {
            memory = clone(next);
        },
        patchMemory: patch => {
            patches.push(clone(patch));
            memory = { ...memory, ...clone(patch) };
        }
    });
    const next = snapshot({
        verifications: [{
            id: '04.10.001::2026-08::BASIC',
            school_id: '04.10.001',
            competence_id: '2026-08',
            program_id: 'BASIC',
            bonification: { extCC: 'Sim' },
            analysis: { extCC: 'Correto' },
            payload: {},
            row_version: 2
        }],
        administrativeLogs: [{
            id: 'log-novo',
            school_id: '04.10.001',
            action: 'Bonificação Alterada',
            user_identifier: 'controlador',
            profile_name: 'Controlador',
            details: {},
            event_at: '2026-08-22T04:00:01.000Z'
        }]
    });

    await port.applyEntities(next, ['verifications', 'administrativeLogs'], {
        persistStorage: false,
        source: 'remote-result-incremental'
    });

    assert.equal(patches.length, 1);
    assert.deepEqual(memory.schools, [{ id: '04.10.001', denominação: 'Escola preservada' }]);
    assert.equal(memory.verifications['04.10.001']['2026-08_BASIC'].bonificacao.extCC, 'Sim');
    assert.equal(memory.verifications['04.10.001']['2026-08_BASIC'].rowVersion, 2);
    assert.deepEqual(memory.logs, [{ id: 'log-novo' }]);
});

test('DataService usa aplicação incremental quando o retorno remoto cobre as entidades declaradas', async () => {
    const { DataService } = require('../../src/application/data-service.js');
    const before = snapshot({
        verifications: [{
            id: '04.10.001::2026-08::BASIC', school_id: '04.10.001', competence_id: '2026-08',
            program_id: 'BASIC', bonification: { extCC: 'Não' }, analysis: {}, payload: {}, row_version: 1
        }],
        administrativeLogs: []
    });
    let current = clone(before);
    let applyCanonicalCalls = 0;
    let applyEntitiesCalls = 0;
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        load: async () => {
            throw new Error('resultado autoritativo completo não deve exigir refresh');
        },
        save: async () => [],
        remove: async () => ({ removedId: null }),
        exportSnapshot: async () => clone(before),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true })
    };
    const statePort = {
        capture: async () => clone(current),
        exportCanonical: async () => clone(current),
        commitCurrent: () => undefined,
        applyCanonical: async next => {
            applyCanonicalCalls += 1;
            current = clone(next);
        },
        applyEntities: async next => {
            applyEntitiesCalls += 1;
            current = clone(next);
        },
        restore: async captured => {
            current = clone(captured);
        }
    };
    const service = new DataService({ repository, statePort });
    const persistedVerification = {
        ...before.entities.verifications[0],
        bonification: { extCC: 'Sim' },
        row_version: 2
    };
    const persistedLog = {
        id: 'log-1', school_id: '04.10.001', action: 'Bonificação Alterada',
        user_identifier: 'controlador', profile_name: 'Controlador', details: {},
        event_at: '2026-08-22T04:00:01.000Z'
    };

    await service.execute({
        name: 'verification:set-bonification',
        changedEntities: ['verifications', 'administrativeLogs'],
        incrementalStateEntities: ['verifications', 'administrativeLogs'],
        remoteResultIsAuthoritative: true,
        mutate: () => {
            current.entities.verifications[0].bonification.extCC = 'Sim';
            return { ok: true };
        },
        persist: async () => ({
            verification: clone(persistedVerification),
            administrative_log: clone(persistedLog)
        })
    });

    assert.equal(applyEntitiesCalls, 1);
    assert.equal(applyCanonicalCalls, 0);
});

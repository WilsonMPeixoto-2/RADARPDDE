'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshot(verification, log) {
    return createSnapshotEnvelope({
        verifications: verification ? [verification] : [],
        administrativeLogs: log ? [log] : []
    }, {
        version: '1',
        importId: 'authoritative-result-test',
        exportedAt: '2026-08-21T21:00:00.000Z'
    });
}

test('resultado remoto autoritativo evita reler tabelas completas antes e depois da RPC', async () => {
    const beforeVerification = {
        id: '04.10.001::2026-08::BASIC',
        school_id: '04.10.001',
        competence_id: '2026-08',
        program_id: 'BASIC',
        bonification: { extCC: '' },
        analysis: { extCC: 'Não analisado' },
        bonus_result: null,
        payload: {},
        row_version: 7
    };
    const savedVerification = {
        ...beforeVerification,
        bonification: { extCC: 'Sim' },
        row_version: 8
    };
    const savedLog = {
        id: 'log-authoritative-1',
        school_id: '04.10.001',
        actor_user_id: '00000000-0000-0000-0000-000000000001',
        user_identifier: 'Controlador Teste',
        profile_name: 'Controlador',
        action: 'Bonificação Alterada',
        details: { documentKey: 'extCC', value: 'Sim' },
        event_at: '2026-08-21T21:00:00.000Z'
    };

    let memorySnapshot = snapshot(beforeVerification, null);
    let loadCalls = 0;
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load: async () => {
            loadCalls += 1;
            throw new Error('O caminho autoritativo não deve reler a tabela inteira.');
        },
        exportSnapshot: async () => { throw new Error('Não deve exportar snapshot remoto.'); },
        save: async () => { throw new Error('Não deve usar persistência genérica.'); },
        remove: async () => { throw new Error('Não deve remover registros.'); },
        restoreSnapshot: async () => { throw new Error('Não deve restaurar snapshot remoto.'); },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
    const statePort = {
        capture: async () => ({ memory: structuredClone(memorySnapshot), storage: {} }),
        exportCanonical: async () => structuredClone(memorySnapshot),
        applyCanonical: async next => { memorySnapshot = structuredClone(next); },
        restore: async captured => { memorySnapshot = structuredClone(captured.memory); }
    };

    const service = new DataService({ repository, statePort });
    const result = await service.execute({
        name: 'verification:set-bonification',
        changedEntities: ['verifications', 'administrativeLogs'],
        remoteResultIsAuthoritative: true,
        mutate: () => ({ value: 'Sim' }),
        persist: async () => ({
            verification: savedVerification,
            administrative_log: savedLog
        })
    });

    assert.equal(loadCalls, 0);
    assert.equal(result.refreshPending, false);
    assert.equal(result.snapshot.entities.verifications[0].row_version, 8);
    assert.equal(result.snapshot.entities.verifications[0].bonification.extCC, 'Sim');
    assert.equal(result.snapshot.entities.administrativeLogs[0].id, 'log-authoritative-1');
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function makeSnapshot(verification, logs = []) {
    return createSnapshotEnvelope({
        verifications: verification ? [verification] : [],
        administrativeLogs: logs
    }, {
        version: '1',
        importId: 'authoritative-commit-test',
        exportedAt: '2026-08-21T23:00:00.000Z'
    });
}

function makeStatePort(initialSnapshot) {
    let memorySnapshot = structuredClone(initialSnapshot);
    return {
        port: {
            capture: async () => ({ memory: structuredClone(memorySnapshot), storage: {} }),
            exportCanonical: async () => structuredClone(memorySnapshot),
            applyCanonical: async next => { memorySnapshot = structuredClone(next); },
            restore: async captured => { memorySnapshot = structuredClone(captured.memory); }
        },
        get: () => memorySnapshot,
        mutate: callback => callback(memorySnapshot)
    };
}

test('commit remoto atômico usa snapshot local + linhas devolvidas sem reler coleções completas', async () => {
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
    const localLog = {
        id: 'log-local-1',
        school_id: '04.10.001',
        actor_user_id: null,
        user_identifier: 'Controlador Teste',
        profile_name: 'Controlador',
        action: 'Bonificação Alterada',
        details: { documentKey: 'extCC', value: 'Sim' },
        event_at: '2026-08-21T23:00:00.000Z'
    };

    const state = makeStatePort(makeSnapshot(beforeVerification));
    let loadCalls = 0;
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load: async () => {
            loadCalls += 1;
            throw new Error('Commit remoto atômico não deve reler coleções completas.');
        },
        exportSnapshot: async () => { throw new Error('Não deve exportar snapshot remoto.'); },
        save: async () => { throw new Error('Não deve usar persistência genérica.'); },
        remove: async () => { throw new Error('Não deve remover registros.'); },
        restoreSnapshot: async () => { throw new Error('Não deve restaurar snapshot remoto.'); },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };

    const service = new DataService({ repository, statePort: state.port });
    const result = await service.execute({
        name: 'operational:atomic-write',
        changedEntities: ['verifications', 'administrativeLogs'],
        remoteCommitIsAuthoritative: true,
        mutate: () => {
            state.mutate(snapshot => {
                snapshot.entities.verifications[0].bonification.extCC = 'Sim';
                snapshot.entities.administrativeLogs.push(structuredClone(localLog));
            });
            return { value: 'Sim' };
        },
        persist: async () => ({ verification: savedVerification })
    });

    assert.equal(loadCalls, 0);
    assert.equal(result.refreshPending, false);
    assert.equal(result.snapshot.entities.verifications[0].row_version, 8);
    assert.equal(result.snapshot.entities.verifications[0].bonification.extCC, 'Sim');
    assert.equal(result.snapshot.entities.administrativeLogs[0].id, 'log-local-1');
});

test('persistência remota customizada adia baseline e faz no máximo o refresh posterior necessário', async () => {
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
    const state = makeStatePort(makeSnapshot(beforeVerification));
    const loads = [];
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load: async entity => {
            loads.push(entity);
            if (entity === 'verifications') return [structuredClone(beforeVerification)];
            if (entity === 'administrativeLogs') return [];
            return [];
        },
        exportSnapshot: async () => { throw new Error('Não deve exportar snapshot remoto.'); },
        save: async () => { throw new Error('Não deve usar persistência genérica.'); },
        remove: async () => { throw new Error('Não deve remover registros.'); },
        restoreSnapshot: async () => { throw new Error('Não deve restaurar snapshot remoto.'); },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };

    const service = new DataService({ repository, statePort: state.port });
    await service.execute({
        name: 'operational:custom-write',
        changedEntities: ['verifications', 'administrativeLogs'],
        mutate: () => ({ ok: true }),
        persist: async () => ({})
    });

    assert.deepEqual(loads, ['verifications', 'administrativeLogs']);
});

test('RPC customizada que devolve as entidades mutáveis completas não relê apenas para reconciliar log append-only', async () => {
    const beforeVerification = {
        id: '04.10.001::2026-08::BASIC',
        school_id: '04.10.001',
        competence_id: '2026-08',
        program_id: 'BASIC',
        bonification: { extCC: '' },
        analysis: { extCC: 'Não analisado' },
        bonus_result: null,
        payload: {},
        row_version: 3
    };
    const savedVerification = {
        ...beforeVerification,
        analysis: { extCC: 'Correto' },
        row_version: 4
    };
    const localLog = {
        id: 'log-local-2',
        school_id: '04.10.001',
        actor_user_id: null,
        user_identifier: 'Controlador Teste',
        profile_name: 'Controlador',
        action: 'Análise Técnica Alterada',
        details: { documentKey: 'extCC', value: 'Correto' },
        event_at: '2026-08-21T23:05:00.000Z'
    };
    const state = makeStatePort(makeSnapshot(beforeVerification));
    let loadCalls = 0;
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load: async () => {
            loadCalls += 1;
            throw new Error('Não deve reler coleções quando apenas o log append-only não retorna.');
        },
        exportSnapshot: async () => { throw new Error('Não deve exportar snapshot remoto.'); },
        save: async () => { throw new Error('Não deve usar persistência genérica.'); },
        remove: async () => { throw new Error('Não deve remover registros.'); },
        restoreSnapshot: async () => { throw new Error('Não deve restaurar snapshot remoto.'); },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };

    const service = new DataService({ repository, statePort: state.port });
    const result = await service.execute({
        name: 'operational:rpc-with-audit',
        changedEntities: ['verifications', 'administrativeLogs'],
        mutate: () => {
            state.mutate(snapshot => {
                snapshot.entities.verifications[0].analysis.extCC = 'Correto';
                snapshot.entities.administrativeLogs.push(structuredClone(localLog));
            });
            return { value: 'Correto' };
        },
        persist: async () => ({ verification: savedVerification })
    });

    assert.equal(loadCalls, 0);
    assert.equal(result.refreshPending, false);
    assert.equal(result.snapshot.entities.verifications[0].row_version, 4);
    assert.equal(result.snapshot.entities.administrativeLogs[0].id, 'log-local-2');
});

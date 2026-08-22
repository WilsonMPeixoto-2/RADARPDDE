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

test('refresh remoto dispara leituras independentes em paralelo', async () => {
    const beforeVerification = {
        id: '04.10.001::2026-08::BASIC',
        school_id: '04.10.001',
        competence_id: '2026-08',
        program_id: 'BASIC',
        bonification: { extCC: '' },
        analysis: { extCC: 'Não analisado' },
        bonus_result: null,
        payload: {},
        row_version: 1
    };
    const initial = makeSnapshot(beforeVerification);
    const state = makeStatePort(initial);
    const started = [];
    const pending = new Map();
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load: entity => {
            started.push(entity);
            return new Promise(resolve => pending.set(entity, resolve));
        },
        exportSnapshot: async () => structuredClone(initial),
        save: async () => [],
        remove: async () => ({ removedId: null }),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
    const service = new DataService({ repository, statePort: state.port });

    const refresh = service.refreshRemoteEntities(
        initial,
        ['verifications', 'administrativeLogs']
    );
    await Promise.resolve();

    assert.deepEqual(
        started,
        ['verifications', 'administrativeLogs'],
        'Todas as leituras devem iniciar antes de qualquer uma precisar terminar.'
    );

    pending.get('verifications')([beforeVerification]);
    pending.get('administrativeLogs')([]);
    const refreshed = await refresh;
    assert.equal(refreshed.entities.verifications.length, 1);
});

test('refresh remoto pode preservar entidade append-only já confirmada pela RPC', async () => {
    const beforeVerification = {
        id: '04.10.001::2026-08::BASIC',
        school_id: '04.10.001',
        competence_id: '2026-08',
        program_id: 'BASIC',
        bonification: { extCC: '' },
        analysis: { extCC: 'Não analisado' },
        bonus_result: null,
        payload: {},
        row_version: 1
    };
    const localLog = {
        id: 'log-preserved-1',
        school_id: '04.10.001',
        actor_user_id: null,
        user_identifier: 'Controlador Teste',
        profile_name: 'Controlador',
        action: 'Operação composta',
        details: {},
        event_at: '2026-08-21T23:10:00.000Z'
    };
    const state = makeStatePort(makeSnapshot(beforeVerification));
    const loads = [];
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load: async entity => {
            loads.push(entity);
            if (entity === 'verifications') {
                return [{ ...beforeVerification, row_version: 2 }];
            }
            throw new Error(`Entidade ${entity} não deveria ser relida.`);
        },
        exportSnapshot: async () => { throw new Error('Não deve exportar snapshot remoto.'); },
        save: async () => { throw new Error('Não deve usar persistência genérica.'); },
        remove: async () => { throw new Error('Não deve remover registros.'); },
        restoreSnapshot: async () => { throw new Error('Não deve restaurar snapshot remoto.'); },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };

    const service = new DataService({ repository, statePort: state.port });
    const result = await service.execute({
        name: 'operational:composite-write',
        changedEntities: ['verifications', 'administrativeLogs'],
        remoteRefreshExemptEntities: ['administrativeLogs'],
        mutate: () => {
            state.mutate(snapshot => {
                snapshot.entities.administrativeLogs.push(structuredClone(localLog));
            });
            return { ok: true };
        },
        persist: async () => ({})
    });

    assert.deepEqual(loads, ['verifications']);
    assert.equal(result.snapshot.entities.verifications[0].row_version, 2);
    assert.equal(result.snapshot.entities.administrativeLogs[0].id, 'log-preserved-1');
});

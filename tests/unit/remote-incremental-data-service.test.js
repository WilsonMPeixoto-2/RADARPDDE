'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function verification(version = 1, delivery = '') {
    return {
        id: '04.10.001::2026-08::BASIC',
        school_id: '04.10.001',
        competence_id: '2026-08',
        program_id: 'BASIC',
        bonification: { extCC: delivery },
        analysis: { extCC: 'Não analisado' },
        bonus_result: null,
        payload: {},
        row_version: version
    };
}

function log(id = 'log-1') {
    return {
        id,
        school_id: '04.10.001',
        actor_user_id: null,
        user_identifier: 'Controlador Teste',
        profile_name: 'Controlador',
        action: 'Bonificação Alterada',
        details: { documentKey: 'extCC' },
        event_at: '2026-09-13T03:40:00.000Z'
    };
}

function snapshot(v = verification(), logs = []) {
    return createSnapshotEnvelope({
        verifications: [v],
        administrativeLogs: logs
    }, {
        version: '1',
        importId: 'incremental-data-service',
        exportedAt: '2026-09-13T03:40:00.000Z'
    });
}

function stateHarness(initial) {
    let memory = structuredClone(initial);
    const calls = { canonical: [], entities: [] };
    return {
        port: {
            capture: async () => ({ memory: structuredClone(memory), storage: {} }),
            exportCanonical: async () => structuredClone(memory),
            applyCanonical: async (next, options) => {
                calls.canonical.push({ next: structuredClone(next), options });
                memory = structuredClone(next);
            },
            applyEntities: async (next, entities, options) => {
                calls.entities.push({ next: structuredClone(next), entities: [...entities], options });
                memory = structuredClone(next);
            },
            restore: async captured => { memory = structuredClone(captured.memory); }
        },
        calls,
        mutate(callback) { callback(memory); }
    };
}

function repository(load = async () => []) {
    return {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load,
        exportSnapshot: async () => { throw new Error('Não deve exportar snapshot remoto.'); },
        save: async () => { throw new Error('Não deve usar persistência genérica.'); },
        remove: async () => { throw new Error('Não deve remover por caminho genérico.'); },
        restoreSnapshot: async () => { throw new Error('Não deve restaurar snapshot remoto.'); },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
}

test('resultado remoto autoritativo atualiza apenas as projeções alteradas mesmo sem declaração manual', async () => {
    const state = stateHarness(snapshot());
    const service = new DataService({ repository: repository(), statePort: state.port });
    const savedVerification = verification(2, 'Sim');
    const savedLog = log('log-authoritative');

    await service.execute({
        name: 'verification:implicit-incremental',
        changedEntities: ['verifications', 'administrativeLogs'],
        remoteResultIsAuthoritative: true,
        mutate: () => {
            state.mutate(current => {
                current.entities.verifications[0].bonification.extCC = 'Sim';
                current.entities.administrativeLogs.push(structuredClone(savedLog));
            });
            return { ok: true };
        },
        persist: async () => ({
            verification: savedVerification,
            administrative_log: savedLog
        })
    });

    assert.equal(state.calls.canonical.length, 0, 'gravação pequena não deve reconstruir todo o estado do navegador');
    assert.equal(state.calls.entities.length, 1);
    assert.deepEqual(
        state.calls.entities[0].entities,
        ['verifications', 'administrativeLogs']
    );
    assert.equal(state.calls.entities[0].options.persistStorage, false);
});

test('reconciliação remota atualiza somente as entidades efetivamente relidas', async () => {
    const state = stateHarness(snapshot());
    const loads = [];
    const service = new DataService({
        repository: repository(async entity => {
            loads.push(entity);
            if (entity === 'verifications') return [verification(2, 'Sim')];
            throw new Error(`Leitura inesperada: ${entity}`);
        }),
        statePort: state.port
    });

    await service.execute({
        name: 'verification:corrective-incremental',
        changedEntities: ['verifications', 'administrativeLogs'],
        mutate: () => ({ ok: true }),
        persist: async () => ({})
    });

    assert.deepEqual(loads, ['verifications']);
    assert.equal(state.calls.canonical.length, 0);
    assert.equal(state.calls.entities.length, 1);
    assert.deepEqual(state.calls.entities[0].entities, ['verifications']);
    assert.equal(state.calls.entities[0].options.persistStorage, false);
});

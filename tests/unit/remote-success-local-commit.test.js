'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshot(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'remote-success-local-commit-test',
        exportedAt: '2026-07-22T17:30:00.000Z'
    });
}

function clone(value) {
    return structuredClone(value);
}

test('sucesso no Supabase não vira falha quando a confirmação local lança erro', async () => {
    let current = snapshot({
        verifications: [],
        administrativeLogs: []
    });
    const repositoryState = {
        verifications: [],
        administrativeLogs: []
    };
    let restoreCalls = 0;

    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        load: async entity => clone(repositoryState[entity] || []),
        save: async (entity, records) => {
            repositoryState[entity] = clone(records);
            return clone(records);
        },
        insertOnly: async (entity, records) => {
            repositoryState[entity] = [...(repositoryState[entity] || []), ...clone(records)];
            return clone(records);
        },
        remove: async () => ({ removedId: null }),
        exportSnapshot: async () => snapshot(clone(repositoryState)),
        restoreSnapshot: async () => {
            restoreCalls += 1;
        },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };

    const statePort = {
        capture: async () => clone(current),
        exportCanonical: async () => clone(current),
        applyCanonical: async next => {
            current = clone(next);
        },
        commitCurrent: () => {
            const error = new Error('The quota has been exceeded.');
            error.name = 'QuotaExceededError';
            throw error;
        },
        restore: async capture => {
            current = clone(capture);
        }
    };

    const service = new DataService({ repository, statePort });

    await assert.doesNotReject(service.execute({
        name: 'verification:set-bonification',
        changedEntities: ['verifications', 'administrativeLogs'],
        mutate: () => {
            current.entities.verifications.push({
                id: '04.10.001::2026-05::BASIC',
                school_id: '04.10.001',
                competence_id: '2026-05',
                program_id: 'BASIC',
                bonification: { extCC: 'Sim' },
                analysis: { extCC: 'Não analisado' },
                bonus_result: null,
                payload: {}
            });
            current.entities.administrativeLogs.push({
                id: 'log-success',
                school_id: '04.10.001',
                user_identifier: 'controlador',
                profile_name: 'Controlador',
                action: 'Bonificação Alterada',
                details: { document: 'extCC', value: 'Sim' },
                event_at: '2026-07-22T17:30:00.000Z'
            });
            return { verificationId: '04.10.001::2026-05::BASIC' };
        }
    }));

    assert.equal(repositoryState.verifications[0].bonification.extCC, 'Sim');
    assert.equal(repositoryState.administrativeLogs.length, 1);
    assert.equal(current.entities.verifications[0].bonification.extCC, 'Sim');
    assert.equal(restoreCalls, 0);
});

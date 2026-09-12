'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService, REMOTE_REFRESH_EXEMPT_ENTITIES } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshot() {
    return createSnapshotEnvelope({
        pendencies: [{
            id: 'P-1',
            school_id: '04.10.001',
            competence_origin: '2026-09',
            status: 'Aberta',
            payload: {},
            row_version: 1
        }],
        administrativeLogs: [{
            id: 'LOG-LOCAL',
            school_id: '04.10.001',
            action: 'Pendência Retificada',
            event_at: '2026-09-12T00:00:00.000Z'
        }]
    }, {
        version: '1',
        importId: 'append-only-refresh-policy',
        exportedAt: '2026-09-12T00:00:00.000Z'
    });
}

test('históricos append-only são isentos de releitura corretiva mesmo quando o comando esquece de declarar a isenção', async () => {
    const current = snapshot();
    const loadCalls = [];
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load: async entity => {
            loadCalls.push(entity);
            if (entity === 'pendencies') {
                return [{
                    id: 'P-1',
                    school_id: '04.10.001',
                    competence_origin: '2026-09',
                    status: 'Aberta',
                    payload: {},
                    row_version: 2
                }];
            }
            if (entity === 'administrativeLogs') {
                throw new Error('Histórico append-only não pode ser relido integralmente após uma gravação.');
            }
            return [];
        },
        save: async () => [],
        remove: async () => ({}),
        exportSnapshot: async () => structuredClone(current),
        restoreSnapshot: async () => {},
        healthCheck: async () => ({ ok: true })
    };
    let applied = null;
    const statePort = {
        exportCanonical: async () => structuredClone(current),
        applyCanonical: async next => { applied = structuredClone(next); }
    };
    const unitOfWork = {
        run: async command => {
            const persisted = await command.persist({ snapshot: structuredClone(current) });
            return {
                snapshot: structuredClone(current),
                persisted,
                value: { ok: true },
                incidentId: 'append-only-test',
                remoteCommitConfirmed: true
            };
        }
    };

    const service = new DataService({ repository, statePort, unitOfWork });
    const result = await service.execute({
        name: 'pendency:legacy-command-without-refresh-hint',
        changedEntities: ['pendencies', 'administrativeLogs'],
        mutate: () => ({ ok: true }),
        persist: async () => ({})
    });

    assert.ok(REMOTE_REFRESH_EXEMPT_ENTITIES.includes('administrativeLogs'));
    assert.deepEqual(loadCalls, ['pendencies']);
    assert.equal(result.refreshPending, false);
    assert.equal(applied.entities.pendencies[0].row_version, 2);
});

test('entidade mutável continua sujeita à reconciliação remota quando o retorno não é autoritativo', async () => {
    const current = snapshot();
    const loadCalls = [];
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true }),
        load: async entity => {
            loadCalls.push(entity);
            return entity === 'pendencies'
                ? [{ ...current.entities.pendencies[0], row_version: 2 }]
                : [];
        },
        save: async () => [],
        remove: async () => ({}),
        exportSnapshot: async () => structuredClone(current),
        restoreSnapshot: async () => {},
        healthCheck: async () => ({ ok: true })
    };
    const statePort = {
        exportCanonical: async () => structuredClone(current),
        applyCanonical: async () => {}
    };
    const unitOfWork = {
        run: async command => ({
            snapshot: structuredClone(current),
            persisted: await command.persist({ snapshot: structuredClone(current) }),
            value: {},
            incidentId: 'mutable-refresh-test',
            remoteCommitConfirmed: true
        })
    };

    const service = new DataService({ repository, statePort, unitOfWork });
    await service.execute({
        name: 'pendency:non-authoritative',
        changedEntities: ['pendencies'],
        mutate: () => ({}),
        persist: async () => ({})
    });

    assert.deepEqual(loadCalls, ['pendencies']);
});
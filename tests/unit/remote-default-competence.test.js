'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function envelope(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'remote-default-competence',
        exportedAt: '2026-09-14T12:00:00.000Z'
    });
}

test('bootstrap remoto inicia no mês anterior quando setembro está disponível', async () => {
    const queries = [];
    const structural = envelope({
        appConfig: [{ id: 'global', exercises: ['2026'], closing_competence: '2026-12', settings: {} }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        controllers: [],
        inventoryTeamMembers: [],
        schools: [{ id: '04.31.001', designation: '04.31.001', denomination: 'Escola' }],
        schoolPrograms: [{ id: '04.31.001::BASIC', school_id: '04.31.001', program_id: 'BASIC' }],
        competences: [
            { id: '2026-08', exercise: '2026', month: 8, label: 'Agosto 2026' },
            { id: '2026-09', exercise: '2026', month: 9, label: 'Setembro 2026' },
            { id: '2026-12', exercise: '2026', month: 12, label: 'Dezembro 2026' }
        ]
    });
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        exportSnapshot: async () => structural,
        queryOperationalContext: async ({ competenceId }) => {
            queries.push(competenceId);
            return { competenceId, entities: {
                verifications: [], pendencies: [], pendencyAttempts: [], pendencyContacts: [], assets: [], registeredInvoices: []
            } };
        },
        load: async () => [], save: async () => [], remove: async () => ({}),
        restoreSnapshot: async () => undefined, healthCheck: async () => ({ ok: true })
    };
    const statePort = {
        exportCanonical: async () => envelope({}),
        applyCanonical: async () => undefined,
        applyEntities: async () => undefined
    };
    const service = new DataService({ repository, statePort });

    const result = await service.bootstrap();

    assert.equal(result.operationalCompetence, '2026-08');
    assert.deepEqual(queries, ['2026-08']);
});

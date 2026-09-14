'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function envelope(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'remote-bootstrap-concurrency',
        exportedAt: '2026-09-14T13:10:00.000Z'
    });
}

function structuralSnapshot() {
    return envelope({
        appConfig: [{ id: 'global', exercises: ['2026'], closing_competence: '2026-12', settings: {} }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        controllers: [],
        inventoryTeamMembers: [],
        schools: [{ id: '04.31.001', designation: '04.31.001', denomination: 'Escola' }],
        schoolPrograms: [{ id: '04.31.001::BASIC', school_id: '04.31.001', program_id: 'BASIC' }],
        competences: [
            { id: '2026-08', exercise: '2026', month: 8, label: 'Agosto 2026' },
            { id: '2026-09', exercise: '2026', month: 9, label: 'Setembro 2026' }
        ]
    });
}

function operationalContext(competenceId) {
    return {
        competenceId,
        entities: {
            verifications: [], pendencies: [], pendencyAttempts: [], pendencyContacts: [], assets: [], registeredInvoices: []
        }
    };
}

function statePort() {
    return {
        capture: async () => ({ memory: {}, storage: {} }),
        exportCanonical: async () => envelope({}),
        applyCanonical: async () => undefined,
        applyEntities: async () => undefined,
        restore: async () => undefined
    };
}

test('bootstrap remoto inicia contexto explícito sem esperar a leitura estrutural terminar', async () => {
    const events = [];
    let releaseStructure;
    const structureGate = new Promise(resolve => { releaseStructure = resolve; });
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        exportSnapshot: async () => {
            events.push('structure:start');
            await structureGate;
            events.push('structure:end');
            return structuralSnapshot();
        },
        queryOperationalContext: async ({ competenceId }) => {
            events.push(`context:${competenceId}`);
            return operationalContext(competenceId);
        },
        load: async () => [], save: async () => [], remove: async () => ({}),
        restoreSnapshot: async () => undefined, healthCheck: async () => ({ ok: true })
    };
    const service = new DataService({ repository, statePort: statePort() });

    const boot = service.bootstrap({ competenceId: '2026-08' });
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(events.includes('structure:start'), true);
    assert.equal(events.includes('context:2026-08'), true);
    assert.equal(events.includes('structure:end'), false);
    releaseStructure();
    const result = await boot;
    assert.equal(result.operationalCompetence, '2026-08');
});

test('bootstrap descarta prefetch inválido e consulta o fallback confirmado pelo calendário estrutural', async () => {
    const queries = [];
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        exportSnapshot: async () => structuralSnapshot(),
        queryOperationalContext: async ({ competenceId }) => {
            queries.push(competenceId);
            return operationalContext(competenceId);
        },
        load: async () => [], save: async () => [], remove: async () => ({}),
        restoreSnapshot: async () => undefined, healthCheck: async () => ({ ok: true })
    };
    const service = new DataService({ repository, statePort: statePort() });

    const result = await service.bootstrap({ competenceId: '2026-07' });

    assert.equal(result.operationalCompetence, '2026-08');
    assert.deepEqual(queries, ['2026-07', '2026-08']);
});

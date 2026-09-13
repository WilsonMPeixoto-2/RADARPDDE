'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService, REMOTE_BOOTSTRAP_ENTITIES } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshot(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'remote-context-bootstrap',
        exportedAt: '2026-09-13T04:30:00.000Z'
    });
}

function createHarness() {
    const exportedSelections = [];
    const contextQueries = [];
    const applied = [];
    const structural = {
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
    };
    const operational = {
        verifications: [{ id: 'v-sep', school_id: '04.31.001', competence_id: '2026-09', program_id: 'BASIC', bonification: {}, analysis: {}, payload: {} }],
        pendencies: [],
        pendencyAttempts: [],
        pendencyContacts: [],
        assets: [],
        registeredInvoices: []
    };
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        load: async () => { throw new Error('bootstrap não deve carregar coleção operacional integral'); },
        save: async () => [],
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async options => {
            exportedSelections.push([...(options?.entities || [])]);
            return snapshot(structural);
        },
        queryOperationalContext: async options => {
            contextQueries.push(options);
            return { competenceId: options.competenceId, entities: structuredClone(operational) };
        },
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
    const statePort = {
        capture: async () => ({ memory: {}, storage: {} }),
        exportCanonical: async () => snapshot({}),
        applyCanonical: async (value, options) => applied.push({ value: structuredClone(value), options }),
        applyEntities: async (value, entities, options) => applied.push({ value: structuredClone(value), entities: [...entities], options }),
        restore: async () => undefined
    };
    return { repository, statePort, exportedSelections, contextQueries, applied };
}

test('bootstrap remoto busca estrutura e somente o contexto operacional solicitado', async () => {
    const harness = createHarness();
    const service = new DataService({ repository: harness.repository, statePort: harness.statePort });

    const result = await service.bootstrap({ competenceId: '2026-09' });

    assert.deepEqual(harness.exportedSelections, [[...REMOTE_BOOTSTRAP_ENTITIES]]);
    assert.deepEqual(harness.contextQueries, [{ competenceId: '2026-09' }]);
    assert.equal(harness.applied.length, 1);
    assert.equal(harness.applied[0].options.persistStorage, false);
    assert.equal(harness.applied[0].value.entities.verifications[0].id, 'v-sep');
    assert.equal(result.operationalCompetence, '2026-09');
});

test('troca de competência recarrega apenas as projeções operacionais do novo mês', async () => {
    const harness = createHarness();
    const service = new DataService({ repository: harness.repository, statePort: harness.statePort });
    await service.bootstrap({ competenceId: '2026-09' });
    harness.applied.length = 0;
    harness.contextQueries.length = 0;

    await service.loadOperationalContext('2026-08');

    assert.deepEqual(harness.contextQueries, [{ competenceId: '2026-08' }]);
    assert.equal(harness.applied.length, 1);
    assert.deepEqual(
        [...harness.applied[0].entities].sort(),
        ['assets', 'pendencies', 'pendencyAttempts', 'pendencyContacts', 'registeredInvoices', 'verifications'].sort()
    );
    assert.equal(harness.applied[0].options.persistStorage, false);
});

test('leitura contextual aguarda gravação anterior e resposta obsoleta não substitui memória', async () => {
    const harness = createHarness();
    const service = new DataService({ repository: harness.repository, statePort: harness.statePort });
    let finishWrite, finishRead;
    const events = [];
    service.executeCommand = async () => {
        events.push('writing');
        await new Promise(resolve => { finishWrite = resolve; });
        events.push('saved');
    };
    harness.repository.queryOperationalContext = async ({ competenceId }) => {
        events.push(competenceId);
        await new Promise(resolve => { finishRead = resolve; });
        return { entities: {} };
    };
    const write = service.execute({});
    await Promise.resolve();
    const old = service.loadOperationalContext('2026-08');
    assert.deepEqual(events, ['writing']);
    finishWrite();
    await write;
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, ['writing', 'saved', '2026-08']);
    const latest = service.loadOperationalContext('2026-09');
    finishRead();
    assert.equal((await old).stale, true);
    await new Promise(resolve => setImmediate(resolve));
    finishRead();
    assert.equal((await latest).stale, false);
    assert.equal(harness.applied.length, 1);
    assert.equal(service.currentOperationalCompetence, '2026-09');
});

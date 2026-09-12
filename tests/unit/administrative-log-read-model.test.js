'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdministrativeLogReadModel } = require('../../src/integration/administrative-log-read-model.js');

function createHarness(results) {
    const queries = [];
    const applications = [];
    const queue = [...results];
    const dataService = {
        repository: {
            async queryAdministrativeLogs(options) {
                queries.push(structuredClone(options));
                const next = queue.shift();
                if (!next) throw new Error('Resultado remoto não preparado.');
                return structuredClone(next);
            }
        },
        statePort: {
            async applyEntities(snapshot, entities, options) {
                applications.push({
                    snapshot: structuredClone(snapshot),
                    entities: structuredClone(entities),
                    options: structuredClone(options)
                });
            }
        }
    };
    return { dataService, queries, applications };
}

test('auditoria carrega somente uma página e aplica em memória sem localStorage', async () => {
    const harness = createHarness([{
        records: [{ id: 'L2', event_at: '2026-09-11T18:00:00Z' }],
        hasMore: true,
        cursor: { eventAt: '2026-09-11T18:00:00Z', id: 'L2' }
    }]);
    const model = createAdministrativeLogReadModel({
        dataService: harness.dataService,
        pageSize: 100,
        getAuditActorUserId: () => 'USER-1'
    });

    const state = await model.loadAudit();

    assert.deepEqual(harness.queries, [{ limit: 100, actorUserId: 'USER-1' }]);
    assert.deepEqual(state.records.map(item => item.id), ['L2']);
    assert.equal(state.hasMore, true);
    assert.deepEqual(harness.applications[0].entities, ['administrativeLogs']);
    assert.equal(harness.applications[0].options.persistStorage, false);
    assert.deepEqual(
        harness.applications[0].snapshot.entities.administrativeLogs.map(item => item.id),
        ['L2']
    );
});

test('histórico da escola consulta somente a escola solicitada', async () => {
    const harness = createHarness([{
        records: [{ id: 'S2', school_id: '04.31.001', event_at: '2026-09-11T18:00:00Z' }],
        hasMore: false,
        cursor: null
    }]);
    const model = createAdministrativeLogReadModel({
        dataService: harness.dataService,
        pageSize: 80
    });

    const state = await model.loadSchool('04.31.001');

    assert.deepEqual(harness.queries, [{ limit: 80, schoolId: '04.31.001' }]);
    assert.deepEqual(state.records.map(item => item.id), ['S2']);
});

test('carregar mais usa cursor e combina páginas sem duplicar registros', async () => {
    const harness = createHarness([
        {
            records: [
                { id: 'L3', event_at: '2026-09-11T19:00:00Z' },
                { id: 'L2', event_at: '2026-09-11T18:00:00Z' }
            ],
            hasMore: true,
            cursor: { eventAt: '2026-09-11T18:00:00Z', id: 'L2' }
        },
        {
            records: [
                { id: 'L2', event_at: '2026-09-11T18:00:00Z' },
                { id: 'L1', event_at: '2026-09-11T17:00:00Z' }
            ],
            hasMore: false,
            cursor: null
        }
    ]);
    const model = createAdministrativeLogReadModel({ dataService: harness.dataService, pageSize: 2 });

    await model.loadAudit();
    const state = await model.loadAudit({ append: true });

    assert.deepEqual(harness.queries[1], {
        limit: 2,
        cursor: { eventAt: '2026-09-11T18:00:00Z', id: 'L2' }
    });
    assert.deepEqual(state.records.map(item => item.id), ['L3', 'L2', 'L1']);
    assert.equal(state.hasMore, false);
    assert.deepEqual(
        harness.applications.at(-1).snapshot.entities.administrativeLogs.map(item => item.id),
        ['L3', 'L2', 'L1']
    );
});

test('refresh da coleção busca novamente apenas a primeira página e substitui cache antigo', async () => {
    const harness = createHarness([
        {
            records: [{ id: 'L1', event_at: '2026-09-11T17:00:00Z' }],
            hasMore: false,
            cursor: null
        },
        {
            records: [
                { id: 'L2', event_at: '2026-09-11T18:00:00Z' },
                { id: 'L1', event_at: '2026-09-11T17:00:00Z' }
            ],
            hasMore: false,
            cursor: null
        }
    ]);
    const model = createAdministrativeLogReadModel({ dataService: harness.dataService, pageSize: 100 });

    await model.loadAudit();
    const refreshed = await model.loadAudit({ refresh: true });

    assert.deepEqual(harness.queries, [
        { limit: 100 },
        { limit: 100 }
    ]);
    assert.deepEqual(refreshed.records.map(item => item.id), ['L2', 'L1']);
    assert.equal(refreshed.hasMore, false);
});

test('reabrir sem refresh ainda pode reutilizar cache dentro da mesma superfície', async () => {
    const harness = createHarness([{
        records: [{ id: 'L1', event_at: '2026-09-11T17:00:00Z' }],
        hasMore: false,
        cursor: null
    }]);
    const model = createAdministrativeLogReadModel({ dataService: harness.dataService });

    await model.loadAudit();
    await model.loadAudit();

    assert.equal(harness.queries.length, 1);
    assert.equal(harness.applications.length, 2);
});

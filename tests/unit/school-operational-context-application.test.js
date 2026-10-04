'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DataService, REMOTE_CONTEXT_ENTITIES } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function clone(value) {
    return structuredClone(value);
}

function snapshot(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'school-apply-test',
        exportedAt: '2026-10-04T18:00:00.000Z'
    });
}

function entities(overrides = {}) {
    return {
        verifications: [],
        pendencies: [],
        pendencyAttempts: [],
        pendencyContacts: [],
        assets: [],
        registeredInvoices: [],
        ...clone(overrides)
    };
}

function schoolEnvelope(schoolId, data, overrides = {}) {
    return {
        schemaVersion: 1,
        schoolId,
        competenceId: '2026-08',
        historyStatuses: ['Resolvida'],
        coverage: {
            kind: 'competence-and-dependencies',
            complete: true,
            contacts: 'selected-pendencies',
            collections: [...REMOTE_CONTEXT_ENTITIES]
        },
        fallback: null,
        entities: entities(data),
        ...clone(overrides)
    };
}

function makeHarness(options = {}) {
    const globalEntities = entities(options.globalEntities || {});
    let current = snapshot(globalEntities);
    let schoolReader = options.schoolReader || (async () => schoolEnvelope('S1', {}));
    let schoolContactsReader = options.schoolContactsReader || (async () => []);
    const applied = [];

    const repository = {
        capabilities: () => ({
            mode: 'supabase',
            remote: true,
            writable: true,
            schoolOperationalContext: true
        }),
        load: async () => [],
        save: async () => [],
        remove: async () => ({ removedId: null }),
        exportSnapshot: async () => snapshot({}),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true }),
        queryOperationalContext: async () => ({ entities: clone(globalEntities) }),
        querySchoolOperationalContext: async request => schoolReader(request),
        querySchoolContacts: async schoolId => schoolContactsReader(schoolId)
    };

    const statePort = {
        capture: async () => clone(current),
        restore: async captured => { current = clone(captured); },
        exportCanonical: async () => clone(current),
        applyCanonical: async next => { current = clone(next); },
        exportCanonicalEntities: async requested => snapshot(Object.fromEntries(
            requested.map(entity => [entity, clone(current.entities?.[entity] || [])])
        )),
        applyEntities: async (next, requested, applyOptions = {}) => {
            applied.push({ entities: [...requested], source: applyOptions.source || null });
            current = clone(next);
            return clone(next);
        }
    };

    const service = new DataService({ repository, statePort });
    return {
        service,
        repository,
        applied,
        getCurrent: () => clone(current),
        setCurrent: value => { current = clone(value); },
        setSchoolReader: reader => { schoolReader = reader; },
        setSchoolContactsReader: reader => { schoolContactsReader = reader; }
    };
}

async function establishGlobalBaseline(harness) {
    const result = await harness.service.loadOperationalContext('2026-08', {
        historyStatuses: ['Resolvida'],
        source: 'test-global-baseline'
    });
    assert.equal(result.stale, false);
}

test('aplicação escolar substitui somente a cobertura anterior e preserva outra escola e contato geral', async () => {
    const harness = makeHarness({
        globalEntities: {
            verifications: [
                { id: 'v1', school_id: 'S1', competence_id: '2026-08', program_id: 'BASIC' },
                { id: 'v2', school_id: 'S2', competence_id: '2026-08', program_id: 'BASIC' }
            ],
            pendencies: [
                { id: 'p1', school_id: 'S1' },
                { id: 'p2', school_id: 'S2' }
            ],
            pendencyAttempts: [
                { id: 'a1', pendency_id: 'p1' },
                { id: 'a2', pendency_id: 'p2' }
            ],
            pendencyContacts: [
                { id: 'c1', school_id: 'S1', pendency_id: 'p1' },
                { id: 'c2', school_id: 'S2', pendency_id: 'p2' }
            ],
            assets: [
                { id: 'b1', school_id: 'S1' },
                { id: 'b2', school_id: 'S2' }
            ],
            registeredInvoices: [
                { id: 'n1', school_id: 'S1' },
                { id: 'n2', school_id: 'S2' }
            ]
        }
    });
    await establishGlobalBaseline(harness);

    const withGeneralContact = harness.getCurrent();
    withGeneralContact.entities.pendencyContacts.push({
        id: 'cg', school_id: 'S1', pendency_id: null, channel: 'geral'
    });
    harness.setCurrent(withGeneralContact);

    harness.setSchoolContactsReader(async schoolId => {
        assert.equal(schoolId, 'S1');
        return [
            { id: 'c3', school_id: 'S1', pendency_id: 'p3' },
            { id: 'cg', school_id: 'S1', pendency_id: null, channel: 'geral' }
        ];
    });

    harness.setSchoolReader(async () => schoolEnvelope('S1', {
        verifications: [{ id: 'v1', school_id: 'S1', competence_id: '2026-08', program_id: 'BASIC', row_version: 2 }],
        pendencies: [{ id: 'p3', school_id: 'S1' }],
        pendencyAttempts: [{ id: 'a3', pendency_id: 'p3' }],
        pendencyContacts: [{ id: 'c3', school_id: 'S1', pendency_id: 'p3' }],
        assets: [],
        registeredInvoices: []
    }));

    const result = await harness.service.loadSchoolOperationalContext('S1', '2026-08', {
        historyStatuses: ['Resolvida'],
        source: 'test-school-refresh'
    });

    assert.equal(result.stale, false);
    assert.equal(result.applied, true);
    const next = harness.getCurrent().entities;
    assert.deepEqual(next.verifications.map(row => row.id).sort(), ['v1', 'v2']);
    assert.deepEqual(next.pendencies.map(row => row.id).sort(), ['p2', 'p3']);
    assert.deepEqual(next.pendencyAttempts.map(row => row.id).sort(), ['a2', 'a3']);
    assert.deepEqual(next.pendencyContacts.map(row => row.id).sort(), ['c2', 'c3', 'cg']);
    assert.deepEqual(next.assets.map(row => row.id), ['b2']);
    assert.deepEqual(next.registeredInvoices.map(row => row.id), ['n2']);
    assert.equal(next.verifications.find(row => row.id === 'v1').row_version, 2);
});

test('sem cobertura global anterior a leitura escolar pede fallback e não altera memória', async () => {
    const harness = makeHarness({
        globalEntities: { verifications: [{ id: 'v1', school_id: 'S1', competence_id: '2026-08', program_id: 'BASIC' }] },
        schoolReader: async () => schoolEnvelope('S1', {
            verifications: [{ id: 'v1', school_id: 'S1', competence_id: '2026-08', program_id: 'BASIC', row_version: 2 }]
        })
    });
    const before = harness.getCurrent();

    const result = await harness.service.loadSchoolOperationalContext('S1', '2026-08', {
        historyStatuses: ['Resolvida']
    });

    assert.equal(result.applied, false);
    assert.equal(result.fallback?.kind, 'global');
    assert.equal(result.fallback?.reason, 'MISSING_BASELINE_COVERAGE');
    assert.deepEqual(harness.getCurrent(), before);
    assert.equal(harness.applied.length, 0);
});

test('fallback declarado pela RPC escolar nunca aplica coleções parciais', async () => {
    const harness = makeHarness();
    await establishGlobalBaseline(harness);
    harness.setSchoolReader(async () => schoolEnvelope('S1', {}, {
        coverage: {
            kind: 'competence-and-dependencies',
            complete: false,
            contacts: 'selected-pendencies',
            collections: [...REMOTE_CONTEXT_ENTITIES]
        },
        fallback: { kind: 'global', reason: 'NON_ISOLATABLE_RELATION' },
        entities: null
    }));
    const before = harness.getCurrent();

    const result = await harness.service.loadSchoolOperationalContext('S1', '2026-08', {
        historyStatuses: ['Resolvida']
    });

    assert.equal(result.applied, false);
    assert.equal(result.fallback?.reason, 'NON_ISOLATABLE_RELATION');
    assert.deepEqual(harness.getCurrent(), before);
});

test('resposta escolar antiga não sobrescreve leitura escolar posterior', async () => {
    let resolveFirst;
    let markFirstStarted;
    const firstStarted = new Promise(resolve => { markFirstStarted = resolve; });
    let calls = 0;
    const harness = makeHarness({
        globalEntities: {
            verifications: [{ id: 'v1', school_id: 'S1', competence_id: '2026-08', program_id: 'BASIC', row_version: 1 }]
        },
        schoolReader: async () => {
            calls += 1;
            if (calls === 1) {
                markFirstStarted();
                return new Promise(resolve => { resolveFirst = resolve; });
            }
            return schoolEnvelope('S1', {
                verifications: [{ id: 'v1', school_id: 'S1', competence_id: '2026-08', program_id: 'BASIC', row_version: 3 }]
            });
        }
    });
    await establishGlobalBaseline(harness);

    const first = harness.service.loadSchoolOperationalContext('S1', '2026-08', {
        historyStatuses: ['Resolvida']
    });
    await firstStarted;
    const second = await harness.service.loadSchoolOperationalContext('S1', '2026-08', {
        historyStatuses: ['Resolvida']
    });
    assert.equal(second.applied, true);
    resolveFirst(schoolEnvelope('S1', {
        verifications: [{ id: 'v1', school_id: 'S1', competence_id: '2026-08', program_id: 'BASIC', row_version: 2 }]
    }));
    const late = await first;

    assert.equal(late.stale, true);
    assert.equal(late.applied, false);
    assert.equal(harness.getCurrent().entities.verifications[0].row_version, 3);
});

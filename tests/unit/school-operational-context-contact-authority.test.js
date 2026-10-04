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
        importId: 'school-contact-authority-test',
        exportedAt: '2026-10-04T19:15:00.000Z'
    });
}

function contextEntities(overrides = {}) {
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

function completeSchoolEnvelope(schoolId, entities) {
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
        entities: contextEntities(entities)
    };
}

function createHarness() {
    const schoolId = 'S1';
    const baselineEntities = contextEntities({
        pendencies: [{ id: 'p1', school_id: schoolId, status: 'Aberta' }],
        pendencyContacts: [{
            id: 'c1',
            school_id: schoolId,
            pendency_id: 'p1',
            contact_type: 'E-mail',
            contact_date: '2026-10-01',
            description: 'Contato que deve sobreviver ao pai'
        }]
    });
    let current = snapshot(baselineEntities);
    let schoolContactReads = 0;

    const repository = {
        capabilities: () => ({
            mode: 'supabase', remote: true, writable: true, schoolOperationalContext: true
        }),
        load: async () => [],
        save: async () => [],
        remove: async () => ({ removedId: null }),
        exportSnapshot: async () => snapshot({}),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true }),
        queryOperationalContext: async () => ({ entities: clone(baselineEntities) }),
        querySchoolOperationalContext: async () => completeSchoolEnvelope(schoolId, {
            pendencies: [],
            pendencyContacts: []
        }),
        querySchoolContacts: async requestedSchoolId => {
            assert.equal(requestedSchoolId, schoolId);
            schoolContactReads += 1;
            return [{
                id: 'c1',
                school_id: schoolId,
                pendency_id: null,
                contact_type: 'E-mail',
                contact_date: '2026-10-01',
                description: 'Contato que deve sobreviver ao pai'
            }];
        }
    };

    const statePort = {
        capture: async () => clone(current),
        restore: async captured => { current = clone(captured); },
        exportCanonical: async () => clone(current),
        applyCanonical: async next => { current = clone(next); },
        exportCanonicalEntities: async requested => snapshot(Object.fromEntries(
            requested.map(entity => [entity, clone(current.entities?.[entity] || [])])
        )),
        applyEntities: async next => {
            current = clone(next);
            return clone(next);
        }
    };

    return {
        service: new DataService({ repository, statePort }),
        getCurrent: () => clone(current),
        getSchoolContactReads: () => schoolContactReads
    };
}

test('contato ligado não desaparece quando a Pendência pai é excluída e o banco o preserva como contato geral', async () => {
    const harness = createHarness();
    const baseline = await harness.service.loadOperationalContext('2026-08', {
        historyStatuses: ['Resolvida'],
        source: 'contact-authority-baseline'
    });
    assert.equal(baseline.stale, false);

    const result = await harness.service.loadSchoolOperationalContext('S1', '2026-08', {
        historyStatuses: ['Resolvida'],
        source: 'contact-authority-school-refresh'
    });

    assert.equal(result.applied, true);
    assert.equal(harness.getSchoolContactReads(), 1,
        'quando um contato sai da cobertura operacional, a autoridade escolar completa deve decidir se foi apagado ou apenas desvinculado');
    assert.deepEqual(harness.getCurrent().entities.pendencies, []);
    assert.deepEqual(harness.getCurrent().entities.pendencyContacts, [{
        id: 'c1',
        school_id: 'S1',
        pendency_id: null,
        contact_type: 'E-mail',
        contact_date: '2026-10-01',
        description: 'Contato que deve sobreviver ao pai'
    }]);
});

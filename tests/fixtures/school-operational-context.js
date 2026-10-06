'use strict';

const { REMOTE_CONTEXT_ENTITIES } = require('../../src/data/repository-contract.js');

function collections(schoolId = 'S', suffix = '') {
    const id = name => `${name}${schoolId}${suffix}`;
    return {
        verifications: [{ id: `${schoolId}::2026-08::BASIC${suffix}`, school_id: schoolId,
            competence_id: '2026-08', program_id: `BASIC${suffix}`, bonification: { extCC: 'Sim' }, analysis: {}, payload: {} }],
        registeredInvoices: [{ id: id('i'), school_id: schoolId, competence_id: '2026-08', program_id: 'BASIC',
            expense_type: 'consumo', invoice_number: '1', amount: 10, payload: {} }],
        pendencies: [{ id: id('p'), school_id: schoolId, competence_origin: '2026-08', program_id: 'BASIC',
            status: 'Aberta', document_key: 'nf', payload: {} }],
        pendencyAttempts: [{ id: id('t'), pendency_id: id('p'), attempt_number: 1, payload: {} }],
        pendencyContacts: [{ id: id('c'), school_id: schoolId, pendency_id: id('p'), payload: {} }],
        assets: [{ id: id('a'), school_id: schoolId, competence_id: '2026-08', status: 'Encaminhada', payload: {} }]
    };
}

function envelope(entities = collections(), options = {}) {
    return { schemaVersion: 1, schoolId: 'S', competenceId: '2026-08', historyStatuses: [],
        coverage: { kind: 'competence-and-dependencies', complete: true, contacts: 'selected-pendencies',
            collections: [...REMOTE_CONTEXT_ENTITIES] }, fallback: null, entities, ...options };
}

function emptyCollections() {
    return Object.fromEntries(REMOTE_CONTEXT_ENTITIES.map(entity => [entity, []]));
}

module.exports = { collections, envelope, emptyCollections };

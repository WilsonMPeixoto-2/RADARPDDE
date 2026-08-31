'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const bridge = require('../../src/data/state-bridge.js');

function versionedEntities() {
    return {
        appConfig: [{ id: 'global', exercises: ['2026'], settings: {}, row_version: 2 }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico', description: '', active: true, row_version: 3 }],
        controllers: [{ id: 'ctrl-1', name: 'Controlador', email: '', active: true, row_version: 4 }],
        inventoryTeamMembers: [{ id: 'inv-1', name: 'Inventário', email: '', active: true, row_version: 5 }],
        schools: [{
            id: '04.10.001', designation: '04.10.001', denomination: 'Escola', cre: '4ª CRE',
            controller_id: 'ctrl-1', active: true, row_version: 6
        }],
        schoolPrograms: [{
            id: '04.10.001::BASIC', school_id: '04.10.001', program_id: 'BASIC',
            active: true, starts_on: null, ends_on: null, row_version: 7
        }],
        competences: [{ id: '2026-05', label: 'Maio 2026', exercise: 2026 }],
        verifications: [{
            id: '04.10.001::2026-05::BASIC',
            school_id: '04.10.001',
            competence_id: '2026-05',
            program_id: 'BASIC',
            bonification: { notaFiscal: 'Sim' },
            analysis: { notaFiscal: 'Não analisado' },
            bonus_result: null,
            payload: { rowVersion: 80, row_version: 81 },
            row_version: 8
        }],
        pendencies: [{
            id: 'pend-1', school_id: '04.10.001', competence_origin: '2026-05',
            program_id: 'BASIC', document_key: 'extCC', status: 'Aberta',
            payload: { rowVersion: 90, row_version: 91 }, row_version: 9
        }],
        pendencyAttempts: [{
            id: 'attempt-1', pendency_id: 'pend-1', attempt_number: 1,
            submitted_at: '2026-07-22T20:00:00.000Z', errors: [],
            payload: { rowVersion: 100, row_version: 101 }, row_version: 10
        }],
        pendencyContacts: [{
            id: 'contact-1', school_id: '04.10.001', pendency_id: 'pend-1',
            contact_type: 'E-mail', contact_date: '2026-07-22', description: 'Contato',
            official_charge: false, payload: { rowVersion: 110, row_version: 111 }, row_version: 11
        }],
        assets: [],
        registeredInvoices: [{
            id: 'nota-1',
            school_id: '04.10.001',
            competence_id: '2026-05',
            program_id: 'BASIC',
            verification_id: '04.10.001::2026-05::BASIC',
            source_context_key: '2026-05_BASIC',
            description: 'Serviço',
            expense_type: 'servico',
            invoice_number: 'NF-1',
            amount: 100,
            payload: { rowVersion: 120, row_version: 121 },
            row_version: 12
        }],
        administrativeLogs: []
    };
}

test('ponte preserva row_version de todas as entidades editáveis na ida e volta', () => {
    const legacy = bridge.canonicalEntitiesToLegacyState(versionedEntities());

    assert.equal(legacy.config.rowVersion, 2);
    assert.equal(legacy.programs[0].rowVersion, 3);
    assert.equal(legacy.controllers[0].rowVersion, 4);
    assert.equal(legacy.inventoryTeamMembers[0].rowVersion, 5);
    assert.equal(legacy.schools[0].rowVersion, 6);
    assert.equal(legacy.schools[0].programasVinculos[0].rowVersion, 7);
    assert.equal(legacy.verifications['04.10.001']['2026-05_BASIC'].rowVersion, 8);
    assert.equal(legacy.pendencies[0].rowVersion, 9);
    assert.equal(legacy.pendencies[0].tentativas[0].rowVersion, 10);
    assert.equal(legacy.contacts[0].rowVersion, 11);
    assert.equal(legacy.registeredInvoices[0].rowVersion, 12);

    const canonical = bridge.transformLegacyState(legacy).entities;
    assert.equal(canonical.appConfig[0].row_version, 2);
    assert.equal(canonical.programs[0].row_version, 3);
    assert.equal(canonical.controllers[0].row_version, 4);
    assert.equal(canonical.inventoryTeamMembers[0].row_version, 5);
    assert.equal(canonical.schools[0].row_version, 6);
    assert.equal(canonical.schoolPrograms[0].row_version, 7);
    assert.equal(canonical.verifications[0].row_version, 8);
    assert.equal(canonical.pendencies[0].row_version, 9);
    assert.equal(canonical.pendencyAttempts[0].row_version, 10);
    assert.equal(canonical.pendencyContacts[0].row_version, 11);
    assert.equal(canonical.registeredInvoices[0].row_version, 12);

    for (const record of [
        canonical.verifications[0],
        canonical.pendencies[0],
        canonical.pendencyAttempts[0],
        canonical.pendencyContacts[0],
        canonical.registeredInvoices[0]
    ]) {
        assert.equal(record.payload.rowVersion, undefined);
        assert.equal(record.payload.row_version, undefined);
    }
});

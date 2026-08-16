'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const legacyAdapter = require('../../src/data/legacy-state-adapter.js');
const stateBridge = require('../../src/data/state-bridge.js');

function legacyState() {
    return {
        config: { exercicios: ['2026'], competenciaFechamento: '2026-12' },
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        controllers: [],
        inventoryTeamMembers: [],
        schools: [{ id: 'ESC-1', designação: 'ESC-1', programasIds: ['BASIC'], competenciaInicial: '2026-01' }],
        verifications: {},
        pendencies: [],
        contacts: [],
        assets: [],
        registeredInvoices: [{
            id: 'expense-1',
            escolaId: 'ESC-1',
            compKey: '2026-08_BASIC',
            competencia: '2026-08',
            programaId: 'BASIC',
            desc: 'Saída observada no extrato',
            tipo: 'a_identificar',
            numero: '',
            valor: 850
        }],
        logs: []
    };
}

test('transformação canônica aceita a_identificar e persiste invoice_number nulo', () => {
    const transformed = legacyAdapter.transformLegacyState(legacyState());
    assert.equal(transformed.rejected.length, 0);
    assert.equal(transformed.entities.registeredInvoices.length, 1);
    assert.equal(transformed.entities.registeredInvoices[0].expense_type, 'a_identificar');
    assert.equal(transformed.entities.registeredInvoices[0].invoice_number, null);
});

test('round-trip canônico mantém despesa sem inventar número de NF', () => {
    const canonical = stateBridge.transformLegacyState(legacyState()).entities;
    const restored = stateBridge.canonicalEntitiesToLegacyState(canonical);
    const invoice = restored.registeredInvoices[0];

    assert.equal(invoice.tipo, 'a_identificar');
    assert.equal(invoice.numero == null || invoice.numero === '', true);
    assert.notEqual(invoice.numero, 'SEM-NÚMERO');

    const roundTrip = stateBridge.transformLegacyState(restored);
    assert.equal(roundTrip.entities.registeredInvoices[0].invoice_number, null);
});

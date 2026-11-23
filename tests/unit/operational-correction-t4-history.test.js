'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildRequest,
    describePlan,
    createOperationalCorrectionClient
} = require('../../src/application/operational-correction-client.js');

const target = {
    kind: 'analysis',
    schoolId: '04.31.001',
    competence: '2026-10',
    programId: 'BASIC',
    documentKey: 'extCC'
};
const digest = 'a'.repeat(64);

function fullHistoryPlan() {
    return {
        action: 'clear_item_history',
        target: { ...target },
        planDigest: digest,
        effects: {
            delete: {
                verifications: [],
                registered_invoices: [],
                pendencies: ['P-OLD', 'P-CURRENT'],
                pendency_attempts: ['ATT-1'],
                pendency_contacts: ['CONTACT-1'],
                assets: []
            },
            update: [{
                entity: 'verifications',
                id: 'V1',
                field: 'analysis.extCC',
                before: 'Incorreto',
                after: null
            }]
        },
        affectedRecords: {
            pendencies: [
                { id: 'P-OLD', documentKey: 'extCC', status: 'Resolvida' },
                { id: 'P-CURRENT', documentKey: 'extCC', status: 'Aberta' }
            ],
            attempts: [{ id: 'ATT-1', pendencyId: 'P-OLD' }],
            contacts: [{ id: 'CONTACT-1', pendencyId: 'P-OLD' }]
        },
        preserved: { registeredInvoices: true, bonusResult: 'apta', otherItems: true },
        blockers: [],
        warnings: []
    };
}

test('T4 clear_item_history define item exato sem inferir ou transferir outro contexto', () => {
    const request = buildRequest({ action: 'clear_item_history', target });
    assert.deepEqual(request, {
        contractVersion: 1,
        action: 'clear_item_history',
        target
    });
    assert.equal('selectedPendencyIds' in request, false);
    assert.equal('changes' in request, false);
});

test('T4 clear_item_history exige nota identificada para análise de NF/Assessoria', () => {
    assert.throws(
        () => buildRequest({ action: 'clear_item_history', target: { ...target, documentKey: 'notaFiscal' } }),
        /individual/
    );
    assert.deepEqual(
        buildRequest({ action: 'clear_item_history', target: { ...target, documentKey: 'notaFiscal', id: 'NF-1' } }).target.id,
        'NF-1'
    );
});

test('T4 clear_item_history rejeita destino, seleção parcial e alterações de análise embutidas', () => {
    const request = { action: 'clear_item_history', target };
    assert.throws(
        () => buildRequest({ ...request, selectedPendencyIds: ['P-CURRENT'] }),
        /sem seleção parcial/
    );
    assert.throws(
        () => buildRequest({ ...request, changes: { analysis: 'Correto' } }),
        /sem seleção parcial/
    );
    assert.throws(
        () => buildRequest({ action: 'clear_item_history', target: { ...target, destinationProgramId: 'CONECTADA' } }),
        /sem seleção parcial/
    );
});

test('T4 clear_item_history rejeita campo desconhecido e identidade fiscal na linha documental', () => {
    assert.throws(
        () => buildRequest({ action: 'clear_item_history', target: { ...target, documentKey: 'internal_flags' } }),
        /documento reconhecido/
    );
    assert.throws(
        () => buildRequest({ action: 'clear_item_history', target: { ...target, id: 'ANY-INVOICE' } }),
        /documento reconhecido/
    );
});

test('T4 clear_item_history exige identificar todas as Pendências, tentativas e contatos antes de confirmar', () => {
    assert.equal(describePlan(fullHistoryPlan()).canApply, true);
    const missingHistory = fullHistoryPlan();
    missingHistory.affectedRecords.pendencies.pop();
    assert.equal(describePlan(missingHistory).canApply, false);
    const missingAttempt = fullHistoryPlan();
    missingAttempt.affectedRecords.attempts = [];
    assert.equal(describePlan(missingAttempt).canApply, false);
    const swappedContact = fullHistoryPlan();
    swappedContact.affectedRecords.contacts[0].id = 'OTHER-CONTACT';
    assert.equal(describePlan(swappedContact).canApply, false);
});

test('T4 clear_item_history nunca permite eliminar documento, nota, bem ou programa pelo plano', () => {
    for (const entity of ['registered_invoices', 'assets', 'verifications']) {
        const plan = fullHistoryPlan();
        plan.effects.delete[entity] = ['HIDDEN-ID'];
        assert.equal(describePlan(plan).canApply, false, entity);
    }
});

test('T4 clear_item_history rejeita prévia devolvida para outro item, mesmo com digest válido', async () => {
    const repository = {
        executeRpc: async () => ({ ...fullHistoryPlan(), target: { ...target, programId: 'CONECTADA' } })
    };
    const client = createOperationalCorrectionClient({ repository });
    await assert.rejects(
        client.preview({ action: 'clear_item_history', target }),
        /prévia não corresponde exatamente/
    );
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    createOperationalCorrectionService
} = require('../../src/application/operational-correction-service.js');
const {
    rebuildPendencyAfterCorrection
} = require('../../src/domain/pendency-correction.js');

test('OperationalCorrectionService: delete_invoice remove dependentes exatos, preserva vizinhos, legado sem FK e bonificação', async () => {
    const state = {
        registeredInvoices: [
            {
                id: 'nf-1058',
                escolaId: 'esc-1',
                compKey: '2026-10_BASICO',
                tipo: 'servico',
                bemId: 'asset-1058',
                rowVersion: 2
            },
            {
                id: 'nf-1042',
                escolaId: 'esc-1',
                compKey: '2026-10_BASICO',
                tipo: 'consumo',
                rowVersion: 1
            }
        ],
        pendencies: [
            { id: 'pend-1058-fiscal', escolaId: 'esc-1', documentoKey: 'notaFiscal', registeredInvoiceId: 'nf-1058' },
            { id: 'pend-1058-adv', escolaId: 'esc-1', documentoKey: 'consAssessoria', registeredInvoiceId: 'nf-1058' },
            { id: 'pend-legacy-null', escolaId: 'esc-1', documentoKey: 'notaFiscal', registeredInvoiceId: null }
        ],
        pendencyAttempts: [
            { id: 'att-1', pendencyId: 'pend-1058-fiscal' },
            { id: 'att-2', pendencyId: 'pend-1058-adv' }
        ],
        pendencyContacts: [
            { id: 'contact-linked-1', pendencyId: 'pend-1058-fiscal' }
        ],
        assets: [
            { id: 'asset-1058', status: 'Inventariada' }
        ],
        qualityProvisionalMovements: [
            { id: 'prov-1', status: 'identified', registeredInvoiceId: 'nf-1058' }
        ]
    };

    const service = createOperationalCorrectionService({ getState: () => state });
    const request = {
        action: 'delete_invoice',
        target: {
            kind: 'invoice',
            id: 'nf-1058',
            schoolId: 'esc-1',
            competence: '2026-10',
            programId: 'BASICO'
        },
        note: ''
    };

    const plan = await service.preview(request);
    assert.deepEqual(plan.effects.delete.registeredInvoices, ['nf-1058']);
    assert.deepEqual(plan.effects.delete.pendencies, ['pend-1058-fiscal', 'pend-1058-adv']);
    assert.deepEqual(plan.effects.delete.pendencyAttempts, ['att-1', 'att-2']);
    assert.deepEqual(plan.effects.delete.pendencyContacts, ['contact-linked-1']);
    assert.deepEqual(plan.effects.delete.assets, ['asset-1058']);
    assert.deepEqual(plan.effects.reopen, [{ kind: 'quality_movement', id: 'prov-1', status: 'open' }]);
    assert.ok(plan.preservedObjects.some(obj => obj.kind === 'invoice' && obj.id === 'nf-1042'));
    assert.ok(plan.preservedObjects.some(obj => obj.kind === 'legacy_pendency' && obj.id === 'pend-legacy-null'));

    state.pendencies.push({
        id: 'pend-concurrent-new',
        escolaId: 'esc-1',
        documentoKey: 'notaFiscal',
        registeredInvoiceId: 'nf-1058'
    });
    await assert.rejects(
        () => service.apply({ request, planDigest: plan.planDigest, operationKey: 'op-key-1' }),
        { code: 'CONCURRENT_SCOPE_CHANGED' }
    );

    const refreshedPlan = await service.preview(request);
    const receipt1 = await service.apply({
        request,
        planDigest: refreshedPlan.planDigest,
        operationKey: 'op-key-2'
    });
    const receipt2 = await service.apply({
        request,
        planDigest: refreshedPlan.planDigest,
        operationKey: 'op-key-2'
    });
    assert.equal(receipt1.committed, true);
    assert.deepEqual(receipt1, receipt2);
});

test('OperationalCorrectionService: na-bonus-with-valid-invoices preserva NFs e aplica regra de BB Ágil N/A', async () => {
    const state = {
        registeredInvoices: [
            { id: 'nf-1042', escolaId: 'esc-1', compKey: '2026-10_BASICO', tipo: 'consumo' }
        ],
        pendencies: []
    };
    const service = createOperationalCorrectionService({ getState: () => state });

    const nfBonusPlan = await service.preview({
        action: 'correct_bonification',
        target: {
            kind: 'verification',
            schoolId: 'esc-1',
            competence: '2026-10',
            programId: 'BASICO',
            documentKey: 'notaFiscal'
        },
        changes: { bonificacao: 'Não se aplica' }
    });
    assert.deepEqual(nfBonusPlan.effects.delete.registeredInvoices, []);
    assert.ok(nfBonusPlan.preservedObjects.some(item => item.id === 'nf-1042'));

    const bbAgilPlan = await service.preview({
        action: 'correct_bonification',
        target: {
            kind: 'verification',
            schoolId: 'esc-1',
            competence: '2026-10',
            programId: 'BASICO',
            documentKey: 'declBBAgil'
        },
        changes: { bonificacao: 'Não se aplica' }
    });
    assert.deepEqual(bbAgilPlan.effects.update.analise, { declBBAgil: 'Correto' });
});

test('rebuildPendencyAfterCorrection: excluir reanálise atual recoloca envio válido em Aguardando reanálise', () => {
    const result = rebuildPendencyAfterCorrection({
        pendency: {
            id: 'pend-1058',
            status: 'Resolvida',
            nextActor: null,
            resolvedAt: '2026-11-11'
        },
        attempts: [
            { id: 'att-1', kind: 'open', date: '2026-11-08', errors: ['Documento ilegível'] },
            { id: 'att-2', kind: 'submission', date: '2026-11-10', note: 'Versão legível no Drive' },
            { id: 'att-3', kind: 'review', date: '2026-11-11', result: 'Correto' }
        ],
        action: 'delete_review',
        targetId: 'att-3'
    });

    assert.equal(result.ambiguity, null);
    assert.equal(result.pendency.status, 'Aguardando reanálise');
    assert.equal(result.pendency.nextActor, 'Controlador');
    assert.equal(result.affectedAnalysis, 'Incorreto');
    assert.equal(result.attempts.length, 2);
});

test('rebuildPendencyAfterCorrection: corrigir data de envio recalcula atraso sem inventar aprovação', () => {
    const result = rebuildPendencyAfterCorrection({
        pendency: {
            id: 'pend-1058',
            status: 'Resolvida',
            cutoffDate: '2026-10-31'
        },
        attempts: [
            { id: 'att-1', kind: 'open', date: '2026-10-20' },
            { id: 'att-2', kind: 'submission', date: '2026-10-25' },
            { id: 'att-3', kind: 'review', date: '2026-10-26', result: 'Correto' }
        ],
        action: 'correct_attempt',
        targetId: 'att-2',
        changes: { date: '2026-11-05', note: '' }
    });

    assert.equal(result.ambiguity, null);
    assert.equal(result.affectedAnalysis, 'Correto (Atrasado)');
    assert.equal(result.attempts[2].result, 'Correto (Atrasado)');
});

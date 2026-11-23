'use strict';

// T4/Release 2: contrato do cliente para exclusão integral de um contexto errado.
// Este teste NÃO autoriza excluir registros no servidor; exige prévia autoritativa.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildRequest,
    describePlan,
    createOperationalCorrectionClient,
    OperationalCorrectionError
} = require('../../src/application/operational-correction-client.js');

const TARGET = Object.freeze({
    kind: 'program_context',
    schoolId: 'ESC-1',
    competence: '2026-09',
    programId: 'BASICO'
});

test('T4 delete_context: identifica expressamente escola, mês e programa, sem destino automático', () => {
    const request = buildRequest({ action: 'delete_context', target: TARGET });
    assert.deepEqual(request, {
        contractVersion: 1,
        action: 'delete_context',
        target: { ...TARGET }
    });
    assert.equal('note' in request, false, 'justificativa não é requisito');
});

test('T4 delete_context: não aceita contexto impreciso ou espécie de alvo incorreta', () => {
    const invalidTargets = [
        { ...TARGET, schoolId: '' },
        { ...TARGET, competence: '' },
        { ...TARGET, programId: '' },
        { ...TARGET, kind: 'invoice' },
        { ...TARGET, kind: undefined },
        { ...TARGET, id: 'NF-OUTRO-MES' },
        { ...TARGET, documentKey: 'notaFiscal' }
    ];
    for (const target of invalidTargets) {
        assert.throws(
            () => buildRequest({ action: 'delete_context', target }),
            OperationalCorrectionError,
            'alvo de delete_context não pode ser ampliado nem inferido'
        );
    }
});

test('T4 delete_context: não aceita seleção parcial de pendências ou movimentação de destino', () => {
    const invalid = [
        { selectedPendencyIds: ['P-1'] },
        { changes: { destinationCompetence: '2026-10' } },
        { changes: { destinationProgramId: 'CONECTADA' } },
        { changes: { moveRecords: true } }
    ];
    for (const extra of invalid) {
        assert.throws(
            () => buildRequest({ action: 'delete_context', target: TARGET, ...extra }),
            OperationalCorrectionError,
            'somente o servidor estabelece o conjunto exato de exclusão'
        );
    }
});

test('T4 delete_context: prévia apresenta a verificação e todas as classes de registros afetadas', () => {
    const plan = {
        action: 'delete_context',
        planDigest: 'a'.repeat(64),
        effects: {
            delete: {
                verifications: ['VER-SET'],
                registered_invoices: ['NF-SET'],
                pendencies: ['P-SET'],
                pendency_attempts: ['ATT-SET'],
                pendency_contacts: ['CONTATO-VINCULADO'],
                assets: ['BEM-SET']
            },
            update: []
        },
        affectedRecords: {
            invoices: [{ id: 'NF-SET', invoiceNumber: '1245', description: 'Materiais de expediente', amount: 189.5 }],
            pendencies: [{ id: 'P-SET', documentKey: 'notaFiscal', status: 'Aberta' }]
        },
        preserved: {
            otherCompetence: '2026-10',
            otherInvoiceIds: ['NF-OUT'],
            generalContactIds: ['CONTATO-GERAL'],
            qualityOpenMovementIds: ['PROV-ABERTA']
        },
        warnings: [],
        blockers: []
    };
    const view = describePlan(plan);
    assert.equal(view.canApply, true);
    assert.match(view.summary, /avaliação mensal do programa/);
    assert.match(view.summary, /nota fiscal/);
    assert.match(view.summary, /Pendência/);
    assert.deepEqual(view.preserved, plan.preserved);
    assert.equal(view.affectedRecords.invoices[0].invoiceNumber, '1245');
    assert.equal(view.affectedRecords.invoices[0].description, 'Materiais de expediente');
    assert.equal(view.affectedRecords.pendencies[0].documentKey, 'notaFiscal');
    assert.deepEqual(view.removals.find(item => item.entity === 'verifications').ids, ['VER-SET']);
});

test('T4 delete_context: impede exclusão quando os registros descritos não correspondem aos IDs do plano', () => {
    const plan = {
        action: 'delete_context',
        planDigest: 'a'.repeat(64),
        effects: {
            delete: {
                verifications: ['V-1'],
                registered_invoices: ['NF-1', 'NF-2'],
                pendencies: ['P-1']
            },
            update: []
        },
        affectedRecords: {
            invoices: [{ id: 'NF-1', invoiceNumber: '0123' }],
            pendencies: [{ id: 'P-1', documentKey: 'notaFiscal' }]
        },
        blockers: []
    };
    assert.equal(describePlan(plan).canApply, false, 'faltou descrever uma NF que será excluída');
    plan.affectedRecords.invoices.push({ id: 'NF-2', invoiceNumber: '0124' });
    assert.equal(describePlan(plan).canApply, true, 'a lista completa pode ser confirmada');
    plan.affectedRecords.pendencies[0].id = 'P-OUTRA';
    assert.equal(describePlan(plan).canApply, false, 'não confundir Pendência de outro programa');
});

test('T4 delete_context: o frontend solicita somente prévia e não executa exclusões locais', async () => {
    const calls = [];
    const repository = {
        async executeRpc(name, args) {
            calls.push({ name, args });
            return {
                action: 'delete_context',
                target: { ...TARGET },
                planDigest: 'b'.repeat(64),
                effects: {
                    delete: { verifications: ['V-1'], registered_invoices: [], pendencies: [] },
                    update: []
                },
                affectedRecords: { invoices: [], pendencies: [] },
                warnings: [],
                blockers: []
            };
        }
    };
    const client = createOperationalCorrectionClient({ repository });
    const preview = await client.preview({ action: 'delete_context', target: TARGET });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'preview_operational_change');
    assert.deepEqual(calls[0].args.p_request, preview.request);
    assert.equal(preview.view.canApply, true);
});

test('T4 delete_context: bloqueio do plano remoto impede confirmação mesmo com digest válido', () => {
    const plan = {
        action: 'delete_context',
        planDigest: 'c'.repeat(64),
        effects: { delete: { verifications: ['V-1'] }, update: [] },
        blockers: [{ code: 'AMBIGUOUS_SCOPE', message: 'Há dependências sem vínculo inequívoco.' }]
    };
    const client = createOperationalCorrectionClient({
        repository: { async executeRpc() {} },
        newOperationKey: () => '00000000-0000-0000-0000-00000000a100'
    });
    assert.throws(
        () => client.prepareConfirmation({ request: buildRequest({ action: 'delete_context', target: TARGET }), plan, view: describePlan(plan) }),
        error => error.code === 'PLAN_BLOCKED'
    );
});

test('T4 delete_context: prévia sem raiz verificável não autoriza exclusão', () => {
    const empty = {
        action: 'delete_context', planDigest: 'd'.repeat(64),
        effects: { delete: { verifications: [], registered_invoices: [] }, update: [] },
        blockers: []
    };
    assert.equal(describePlan(empty).canApply, false);
});

test('T4 delete_context: não aceita uma prévia retornada para outra competência ou programa', async () => {
    for (const foreignTarget of [
        { ...TARGET, competence: '2026-10' },
        { ...TARGET, programId: 'CONECTADA' },
        { ...TARGET, schoolId: 'ESC-2' }
    ]) {
        const repository = {
            async executeRpc() {
                return {
                    action: 'delete_context',
                    target: foreignTarget,
                    planDigest: 'e'.repeat(64),
                    effects: { delete: { verifications: ['VER-OUTRA'] }, update: [] },
                    blockers: []
                };
            }
        };
        const client = createOperationalCorrectionClient({ repository });
        await assert.rejects(
            () => client.preview({ action: 'delete_context', target: TARGET }),
            error => error instanceof OperationalCorrectionError && error.code === 'INVALID_PREVIEW'
        );
    }
});

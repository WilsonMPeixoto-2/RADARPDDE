'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { planInvoiceEffects } = require('../../src/domain/invoice-effects.js');

function baseInput(overrides = {}) {
    const existingInvoice = {
        id: 'nota-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        desc: 'Material pedagógico',
        descricao: 'Material pedagógico',
        tipo: 'consumo',
        numero: 'NF-001',
        valor: 150.5,
        bemId: null,
        dataRegistro: '2026-07-14T12:00:00.000Z',
        rowVersion: 4
    };
    const verification = {
        bonificacao: {
            notaFiscal: 'Sim',
            consAssessoria: 'Não se aplica',
            consEnviada: false
        },
        analise: {
            notaFiscal: 'Correto',
            consAssessoria: 'Correto'
        },
        resultadoBonif: ''
    };
    return {
        existingInvoice,
        request: {
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competence: '2026-05',
            programId: 'BASIC',
            description: 'Material pedagógico',
            expenseType: 'consumo',
            invoiceNumber: 'NF-001',
            amount: 150.5
        },
        contextInvoices: [existingInvoice],
        currentAsset: null,
        verification,
        school: {
            id: 'ESC-1',
            denominação: 'Escola Teste',
            processoInventario: ''
        },
        program: { id: 'BASIC', name: 'PDDE Básico' },
        profile: 'controlador',
        ...overrides
    };
}

test('mesma NF e todos os derivados corretos produz plano unchanged sem efeitos', () => {
    const result = planInvoiceEffects(baseInput());

    assert.equal(result.unchanged, true);
    assert.equal(result.operation, 'update');
    assert.equal(result.invoice.id, 'nota-1');
    assert.equal(result.asset, null);
    assert.equal(result.removedAsset, null);
    assert.deepEqual(result.warnings, []);
    assert.deepEqual(result.changedEntities, []);
    assert.equal(result.auditDescriptor, null);
});

test('mesma NF com Assessoria divergente produz plano corretivo', () => {
    const input = baseInput();
    input.verification.bonificacao.consAssessoria = 'Não';
    input.verification.bonificacao.consEnviada = true;
    input.verification.analise.consAssessoria = 'Não analisado';

    const result = planInvoiceEffects(input);

    assert.equal(result.unchanged, false);
    assert.equal(result.verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.equal(result.verification.bonificacao.consEnviada, false);
    assert.equal(result.verification.analise.consAssessoria, 'Correto');
    assert.equal(result.changedEntities.includes('verifications'), true);
});

test('mesma NF permanente com bem derivado divergente produz plano corretivo', () => {
    const invoice = {
        ...baseInput().existingInvoice,
        tipo: 'permanente',
        desc: 'Notebook',
        descricao: 'Notebook',
        numero: 'NF-002',
        valor: 5000,
        bemId: 'bem-1'
    };
    const input = baseInput({
        existingInvoice: invoice,
        contextInvoices: [invoice],
        request: {
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competence: '2026-05',
            programId: 'BASIC',
            description: 'Notebook',
            expenseType: 'permanente',
            invoiceNumber: 'NF-002',
            amount: 5000
        },
        currentAsset: {
            id: 'bem-1',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            item: 'PDDE Básico - VALOR ANTIGO',
            descricao: 'PDDE Básico - VALOR ANTIGO',
            tipo: 'permanente',
            valor: 1,
            notaFiscal: 'NF-002',
            processoInventario: '',
            status: 'Não encaminhada',
            rowVersion: 2
        }
    });

    const result = planInvoiceEffects(input);

    assert.equal(result.unchanged, false);
    assert.equal(result.asset.id, 'bem-1');
    assert.equal(result.asset.valor, 5000);
    assert.equal(result.asset.item, 'PDDE Básico - Notebook');
    assert.equal(result.changedEntities.includes('assets'), true);
});

test('mudança real em consolidação de assistente planeja reabertura; no-op não reabre', () => {
    const unchangedInput = baseInput({ profile: 'assistente' });
    unchangedInput.verification.resultadoBonif = 'apta';
    const unchanged = planInvoiceEffects(unchangedInput);
    assert.equal(unchanged.unchanged, true);
    assert.equal(unchanged.verification.resultadoBonif, 'apta');

    const changedInput = baseInput({ profile: 'assistente' });
    changedInput.verification.resultadoBonif = 'apta';
    changedInput.request = {
        ...changedInput.request,
        amount: 151
    };
    const changed = planInvoiceEffects(changedInput);
    assert.equal(changed.unchanged, false);
    assert.equal(changed.verification.resultadoBonif, '');
});

test('inclusão nova nunca é no-op apenas porque existe outra NF de conteúdo igual', () => {
    const sibling = baseInput().existingInvoice;
    const input = baseInput({
        existingInvoice: null,
        contextInvoices: [sibling],
        invoiceId: 'nota-2',
        timestamp: '2026-08-27T02:30:00.000Z'
    });

    const result = planInvoiceEffects(input);

    assert.equal(result.unchanged, false);
    assert.equal(result.operation, 'create');
    assert.equal(result.invoice.id, 'nota-2');
    assert.equal(result.invoice.numero, 'NF-001');
    assert.notEqual(result.invoice.id, sibling.id);
});

test('A identificar não participa da regra da Assessoria', () => {
    const unidentified = {
        id: 'pendente-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        tipo: 'a_identificar',
        desc: 'Despesa pendente',
        valor: 100
    };
    const input = baseInput({
        contextInvoices: [baseInput().existingInvoice, unidentified]
    });

    const result = planInvoiceEffects(input);

    assert.equal(result.unchanged, false);
    assert.equal(result.verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.equal(result.verification.analise.consAssessoria, 'Correto');
    assert.equal(result.verification.analise.notaFiscal, 'Incorreto');
});


test('remoção da última NF de serviço reconverge Assessoria e análise fiscal pelo mesmo planner', () => {
    const serviceInvoice = {
        ...baseInput().existingInvoice,
        tipo: 'servico',
        desc: 'Serviço',
        descricao: 'Serviço',
        numero: 'NF-SERV-REMOVE',
        consultaAssessoriaEnviada: true,
        analiseConsultaAssessoria: 'Correto'
    };
    const input = baseInput({
        operation: 'remove',
        existingInvoice: serviceInvoice,
        contextInvoices: [serviceInvoice],
        verification: {
            bonificacao: {
                notaFiscal: 'Sim',
                consAssessoria: 'Sim',
                consEnviada: true
            },
            analise: {
                notaFiscal: 'Correto',
                consAssessoria: 'Correto'
            },
            resultadoBonif: ''
        }
    });

    const result = planInvoiceEffects(input);

    assert.equal(result.operation, 'remove');
    assert.equal(result.unchanged, false);
    assert.equal(result.invoice.id, serviceInvoice.id);
    assert.equal(result.asset, null);
    assert.equal(result.verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.equal(result.verification.bonificacao.consEnviada, false);
    assert.equal(result.verification.analise.consAssessoria, 'Correto');
    assert.equal(result.verification.analise.notaFiscal, 'Não analisado');
    assert.equal(result.resetFiscalAnalysis, true);
    assert.equal(result.auditDescriptor.action, 'Nota Fiscal Removida');
});

test('remoção de NF permanente planeja exclusão do bem derivado e reabertura em um único efeito', () => {
    const permanentInvoice = {
        ...baseInput().existingInvoice,
        tipo: 'permanente',
        desc: 'Notebook',
        descricao: 'Notebook',
        numero: 'NF-PERM-REMOVE',
        valor: 5000,
        bemId: 'bem-1'
    };
    const input = baseInput({
        operation: 'remove',
        profile: 'assistente',
        existingInvoice: permanentInvoice,
        contextInvoices: [permanentInvoice],
        currentAsset: {
            id: 'bem-1',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            item: 'PDDE Básico - Notebook',
            descricao: 'PDDE Básico - Notebook',
            tipo: 'permanente',
            valor: 5000,
            notaFiscal: 'NF-PERM-REMOVE',
            processoInventario: '',
            status: 'Não encaminhada',
            rowVersion: 2
        },
        verification: {
            bonificacao: {
                notaFiscal: 'Sim',
                consAssessoria: 'Não se aplica',
                consEnviada: false
            },
            analise: {
                notaFiscal: 'Correto',
                consAssessoria: 'Correto'
            },
            resultadoBonif: 'apta'
        }
    });

    const result = planInvoiceEffects(input);

    assert.equal(result.operation, 'remove');
    assert.equal(result.removedAsset.id, 'bem-1');
    assert.equal(result.verification.resultadoBonif, '');
    assert.match(result.auditDescriptor.details, /reaberta/i);
    assert.deepEqual(result.changedEntities, [
        'registeredInvoices',
        'assets',
        'verifications',
        'administrativeLogs'
    ]);
});

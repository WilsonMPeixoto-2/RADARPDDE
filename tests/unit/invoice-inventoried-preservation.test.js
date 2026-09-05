'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { planInvoiceEffects } = require('../../src/domain/invoice-effects.js');

function inputForInventoriedAsset(overrides = {}) {
    const invoice = {
        id: 'nota-inventariada-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        desc: 'Notebook',
        descricao: 'Notebook',
        tipo: 'permanente',
        numero: 'NF-INV-001',
        valor: 5000,
        bemId: 'bem-inventariado-1'
    };
    const asset = {
        id: 'bem-inventariado-1',
        escolaId: 'ESC-1',
        competencia: '2026-05',
        item: 'PDDE Básico - Notebook',
        descricao: 'PDDE Básico - Notebook',
        tipo: 'permanente',
        valor: 5000,
        notaFiscal: 'NF-INV-001',
        processoInventario: 'PROC-2026/001',
        status: 'Inventariada',
        inventariadorId: 'MEMBRO-1',
        dataInventariacao: '2026-09-04T12:00:00.000Z'
    };
    return {
        existingInvoice: invoice,
        request: {
            schoolId: 'ESC-1', compKey: '2026-05_BASIC', competence: '2026-05', programId: 'BASIC',
            description: 'Notebook', expenseType: 'permanente', invoiceNumber: 'NF-INV-001', amount: 5000
        },
        contextInvoices: [invoice], contextAssets: [asset], currentAsset: asset,
        verification: {
            bonificacao: { notaFiscal: 'Sim', consAssessoria: 'Não se aplica', consEnviada: false, encampInventario: 'Sim' },
            analise: { notaFiscal: 'Correto', consAssessoria: 'Correto', encampInventario: 'Correto' }, resultadoBonif: ''
        },
        school: { id: 'ESC-1', denominação: 'Escola Teste', processoInventario: 'PROC-2026/001' },
        program: { id: 'BASIC', name: 'PDDE Básico' }, profile: 'controlador', ...overrides
    };
}

test('salvar novamente NF permanente preserva bem já Inventariado e seus metadados', () => {
    const result = planInvoiceEffects(inputForInventoriedAsset());
    assert.equal(result.asset.status, 'Inventariada');
    assert.equal(result.asset.inventariadorId, 'MEMBRO-1');
    assert.equal(result.asset.dataInventariacao, '2026-09-04T12:00:00.000Z');
    assert.equal(result.unchanged, true);
});

test('editar descrição/valor da NF inventariada preserva o estado patrimonial terminal', () => {
    const input = inputForInventoriedAsset();
    input.request = { ...input.request, description: 'Notebook atualizado', amount: 5200 };
    const result = planInvoiceEffects(input);
    assert.equal(result.unchanged, false);
    assert.equal(result.asset.status, 'Inventariada');
    assert.equal(result.asset.inventariadorId, 'MEMBRO-1');
    assert.equal(result.asset.dataInventariacao, '2026-09-04T12:00:00.000Z');
    assert.equal(result.asset.item, 'PDDE Básico - Notebook atualizado');
    assert.equal(result.asset.valor, 5200);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    INVOICE_DOCUMENT_ANALYSES,
    deriveInvoiceDocumentAnalysis,
    getInvoiceDocumentAnalysis,
    isInvoiceDocument,
    isUnidentifiedExpense,
    normalizeInvoiceDocumentAnalysis,
    withInvoiceDocumentAnalysis
} = require('../../src/domain/invoice-document-analysis.js');

test('reconhece todos os registros individuais de Notas Fiscais, inclusive despesa a identificar', () => {
    ['consumo', 'permanente', 'servico', 'boleto_internet', 'a_identificar'].forEach(tipo => {
        assert.equal(isInvoiceDocument({ tipo }), true);
    });
    assert.equal(isInvoiceDocument({ tipo: 'outro' }), false);
});

test('despesa a identificar nova é Incorreto, mas legado sem análise não recebe classificação inventada', () => {
    const legacy = { id: 'nota-legada', tipo: 'a_identificar' };
    const canonical = {
        id: 'nota-nova',
        tipo: 'a_identificar',
        analiseDocumentoFiscal: 'Incorreto'
    };

    assert.equal(isUnidentifiedExpense(legacy), true);
    assert.equal(getInvoiceDocumentAnalysis(legacy), 'Não analisado');
    assert.equal(
        deriveInvoiceDocumentAnalysis([legacy], 'Correto'),
        'Correto'
    );
    assert.equal(getInvoiceDocumentAnalysis(canonical), 'Incorreto');
    assert.equal(
        deriveInvoiceDocumentAnalysis([canonical], 'Correto'),
        'Incorreto'
    );
    assert.throws(
        () => withInvoiceDocumentAnalysis(canonical, 'Correto'),
        /deve permanecer Incorreto/
    );
});

test('sem estado individual explícito preserva o resumo legado durante a transição', () => {
    const invoices = [
        { id: 'nota-1', tipo: 'consumo' },
        { id: 'nota-2', tipo: 'servico' }
    ];

    assert.equal(
        deriveInvoiceDocumentAnalysis(invoices, 'Incorreto'),
        'Incorreto'
    );
});

test('a primeira análise individual encerra a inferência do estado agregado para os demais documentos', () => {
    const invoices = [
        { id: 'nota-1', tipo: 'consumo', analiseDocumentoFiscal: 'Correto' },
        { id: 'nota-2', tipo: 'servico' }
    ];

    assert.equal(
        deriveInvoiceDocumentAnalysis(invoices, 'Incorreto'),
        'Não analisado'
    );
});

test('Incorreto prevalece no resumo derivado', () => {
    const invoices = [
        { id: 'nota-1', tipo: 'consumo', analiseDocumentoFiscal: 'Correto' },
        { id: 'nota-2', tipo: 'servico', analiseDocumentoFiscal: 'Incorreto' },
        { id: 'nota-3', tipo: 'permanente', analiseDocumentoFiscal: 'Não analisado' }
    ];

    assert.equal(deriveInvoiceDocumentAnalysis(invoices), 'Incorreto');
});

test('Não analisado prevalece sobre Correto (Atrasado)', () => {
    const invoices = [
        { id: 'nota-1', tipo: 'consumo', analiseDocumentoFiscal: 'Correto (Atrasado)' },
        { id: 'nota-2', tipo: 'servico', analiseDocumentoFiscal: 'Não analisado' }
    ];

    assert.equal(deriveInvoiceDocumentAnalysis(invoices), 'Não analisado');
});

test('Correto (Atrasado) prevalece sobre Correto quando não há estado pior', () => {
    const invoices = [
        { id: 'nota-1', tipo: 'consumo', analiseDocumentoFiscal: 'Correto' },
        { id: 'nota-2', tipo: 'permanente', analiseDocumentoFiscal: 'Correto (Atrasado)' }
    ];

    assert.equal(deriveInvoiceDocumentAnalysis(invoices), 'Correto (Atrasado)');
});

test('normaliza o rótulo legado Correto após o prazo', () => {
    assert.equal(
        normalizeInvoiceDocumentAnalysis('Correto após o prazo'),
        'Correto (Atrasado)'
    );
    assert.deepEqual(INVOICE_DOCUMENT_ANALYSES, [
        'Não analisado',
        'Correto',
        'Correto (Atrasado)',
        'Incorreto'
    ]);
});

test('boleto de Internet é documento individual de notaFiscal sem criar identidade documental boletoInternet', () => {
    const boleto = withInvoiceDocumentAnalysis({
        id: 'boleto-1',
        tipo: 'boleto_internet'
    }, 'Incorreto');

    assert.equal(boleto.analiseDocumentoFiscal, 'Incorreto');
    assert.equal(boleto.tipo, 'boleto_internet');
    assert.equal('documentoKey' in boleto, false);
});

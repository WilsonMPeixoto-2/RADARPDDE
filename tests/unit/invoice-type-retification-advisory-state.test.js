'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { invoiceTypeChangeRestriction } = require('../../src/application/invoice-service.js');

function fiscalHistoryState() {
    return {
        pendencies: [{
            id: 'PEND-FISCAL',
            registeredInvoiceId: 'NF-SERVICE',
            documentoKey: 'notaFiscal',
            status: 'Resolvida'
        }],
        assets: []
    };
}

function serviceInvoice(overrides = {}) {
    return {
        id: 'NF-SERVICE',
        tipo: 'servico',
        rowVersion: 3,
        consultaAssessoriaEnviada: false,
        analiseConsultaAssessoria: 'Não analisado',
        ...overrides
    };
}

test('bloqueia troca de tipo quando a Consulta à Assessoria já foi enviada mesmo sem Pendência de Assessoria', () => {
    const restriction = invoiceTypeChangeRestriction(
        fiscalHistoryState(),
        serviceInvoice({ consultaAssessoriaEnviada: true })
    );
    assert.equal(restriction?.code, 'INVOICE_HISTORY_LOCKED');
    assert.match(restriction?.message || '', /Assessoria/);
});

test('bloqueia troca de tipo quando a Assessoria já tem resultado individual mesmo sem Pendência de Assessoria', () => {
    const restriction = invoiceTypeChangeRestriction(
        fiscalHistoryState(),
        serviceInvoice({ analiseConsultaAssessoria: 'Correto' })
    );
    assert.equal(restriction?.code, 'INVOICE_HISTORY_LOCKED');
    assert.match(restriction?.message || '', /Assessoria/);
});

test('mantém elegível serviço sem envio nem análise da Assessoria quando o histórico fiscal está encerrado', () => {
    const restriction = invoiceTypeChangeRestriction(fiscalHistoryState(), serviceInvoice());
    assert.equal(restriction, null);
});

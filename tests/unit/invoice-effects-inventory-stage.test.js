'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { planInvoiceEffects } = require('../../src/domain/invoice-effects.js');

test('NF permanente com processo existente ainda nasce Não encaminhada e só encaminha por ação explícita', () => {
  const verification = {
    bonificacao: {
      notaFiscal: 'Sim',
      consAssessoria: 'Não se aplica',
      encampInventario: 'Não'
    },
    analise: {
      notaFiscal: 'Não analisado',
      consAssessoria: 'Correto',
      encampInventario: 'Não analisado'
    },
    resultadoBonif: ''
  };

  const result = planInvoiceEffects({
    existingInvoice: null,
    contextInvoices: [],
    contextAssets: [],
    invoiceId: 'nota-stage-real',
    assetId: 'bem-stage-real',
    timestamp: '2026-09-04T14:15:00.000Z',
    verification,
    school: {
      id: 'ESC-1',
      denominação: 'Escola Teste',
      processoInventario: 'PROC-2026/001'
    },
    program: { id: 'BASIC', name: 'PDDE Básico' },
    profile: 'controlador',
    request: {
      schoolId: 'ESC-1',
      compKey: '2026-05_BASIC',
      competence: '2026-05',
      programId: 'BASIC',
      description: 'Notebook',
      expenseType: 'permanente',
      invoiceNumber: 'NF-STAGE-REAL',
      amount: 5000
    }
  });

  assert.equal(result.asset.status, 'Não encaminhada');
  assert.equal(result.asset.processoInventario, 'PROC-2026/001');
  assert.equal(result.verification.bonificacao.encampInventario, 'Não');
  assert.equal(result.verification.analise.encampInventario, 'Não analisado');
});

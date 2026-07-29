'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { certifyExcelProducts } = require('../../src/domain/excel-integral-certification.js');

function bonification(overrides = {}) {
  return {
    extCC: 'Sim',
    extINV: 'Sim',
    notaFiscal: 'Não se aplica',
    consAssessoria: 'Não se aplica',
    declBBAgil: 'Sim',
    encampInventario: 'Não se aplica',
    ...overrides
  };
}

function verification(result, overrides = {}) {
  return {
    bonificacao: bonification(overrides),
    analise: {
      extCC: 'Correto',
      extINV: 'Correto',
      notaFiscal: 'Correto',
      consAssessoria: 'Correto',
      declBBAgil: 'Correto',
      encampInventario: 'Correto'
    },
    resultadoBonif: result
  };
}

function input() {
  return {
    generatedAt: '2026-07-29T02:30:00.000Z',
    activeCompetenciaKey: '2026-08',
    escolas: [{
      id: 'SCHOOL-ISOLATION',
      inep: '00000003',
      denominação: 'Unidade Escolar de Teste',
      designação: '04.00.003',
      cre: '4ª CRE',
      programasIds: ['BASIC']
    }],
    competencias: [
      { key: '2026-07', label: 'Julho 2026' },
      { key: '2026-08', label: 'Agosto 2026' }
    ],
    programas: [{ id: 'BASIC', name: 'PDDE Básico' }],
    verificacoes: {
      'SCHOOL-ISOLATION': {
        '2026-07_BASIC': verification('apta'),
        '2026-08_BASIC': verification('apta')
      }
    }
  };
}

test('alterar julho muda o relatório histórico e não modifica o Excel SME de agosto', () => {
  const original = input();
  const changed = input();
  changed.verificacoes['SCHOOL-ISOLATION']['2026-07_BASIC'] = verification('inapta', { extCC: 'Não' });

  const originalReport = certifyExcelProducts(original);
  const changedReport = certifyExcelProducts(changed);

  assert.equal(originalReport.passed, true);
  assert.equal(changedReport.passed, true);
  assert.notEqual(
    originalReport.products.institutional.contentHash,
    changedReport.products.institutional.contentHash
  );
  assert.equal(
    originalReport.products.smeMonthly.contentHash,
    changedReport.products.smeMonthly.contentHash
  );
  assert.deepEqual(changedReport.products.smeMonthly.competenceKeys, ['2026-08']);
});

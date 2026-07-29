'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const certification = require('../../src/domain/excel-integral-certification.js');

function completeBonification(overrides = {}) {
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

function completeAnalysis(overrides = {}) {
  return {
    extCC: 'Correto',
    extINV: 'Correto',
    notaFiscal: 'Correto',
    consAssessoria: 'Correto',
    declBBAgil: 'Correto',
    encampInventario: 'Correto',
    ...overrides
  };
}

function verification(result, bonificationOverrides = {}) {
  return {
    bonificacao: completeBonification(bonificationOverrides),
    analise: completeAnalysis(),
    resultadoBonif: result
  };
}

function fixture() {
  return {
    generatedAt: '2026-07-29T02:30:00.000Z',
    activeCompetenciaKey: '2026-08',
    escolas: [
      {
        id: 'SCHOOL-A',
        inep: '00000001',
        denominação: 'Unidade Escolar Alfa',
        designação: '04.00.001',
        cre: '4ª CRE',
        programasIds: ['BASIC', 'CONECTADA']
      },
      {
        id: 'SCHOOL-B',
        inep: '00000002',
        denominação: 'Unidade Escolar Beta',
        designação: '04.00.002',
        cre: '4ª CRE',
        programasIds: ['BASIC']
      }
    ],
    competencias: [
      { key: '2026-07', label: 'Julho 2026' },
      { key: '2026-08', label: 'Agosto 2026' }
    ],
    programas: [
      { id: 'BASIC', name: 'PDDE Básico' },
      { id: 'CONECTADA', name: 'Educação Conectada' }
    ],
    verificacoes: {
      'SCHOOL-A': {
        '2026-07_BASIC': verification('apta'),
        '2026-08_BASIC': verification('apta'),
        '2026-08_CONECTADA': verification('inapta', { extINV: 'Não' })
      },
      'SCHOOL-B': {
        '2026-08_BASIC': verification('apta', { notaFiscal: 'Sim', encampInventario: 'Sim' })
      }
    }
  };
}

test('certifica separadamente o relatório institucional histórico e o Excel SME mensal', () => {
  assert.equal(typeof certification.certifyExcelProducts, 'function');

  const report = certification.certifyExcelProducts(fixture());

  assert.equal(report.passed, true);
  assert.equal(report.canonicalResults.mismatchCount, 0);

  assert.equal(report.products.institutional.passed, true);
  assert.equal(report.products.institutional.scope, 'historical-multi-competence');
  assert.deepEqual(report.products.institutional.competenceKeys, ['2026-07', '2026-08']);
  assert.equal(report.products.institutional.logicalRowCount, 4);
  assert.equal(report.products.institutional.cellCertification.mismatchCount, 0);
  assert.equal(report.products.institutional.ooxml.sheetCount, 4);
  assert.equal(report.products.institutional.ooxml.hasDataValidations, false);

  assert.equal(report.products.smeMonthly.passed, true);
  assert.equal(report.products.smeMonthly.scope, 'single-competence');
  assert.deepEqual(report.products.smeMonthly.competenceKeys, ['2026-08']);
  assert.equal(report.products.smeMonthly.schoolCount, 2);
  assert.equal(report.products.smeMonthly.columnCount, 26);
  assert.equal(report.products.smeMonthly.cellCertification.mismatchCount, 0);
  assert.equal(report.products.smeMonthly.ooxml.sheetCount, 1);
  assert.equal(report.products.smeMonthly.ooxml.hasDataValidations, false);
});

test('reconcilia endereços e valores concretos nas planilhas OOXML', () => {
  const report = certification.certifyExcelProducts(fixture());
  const institutional = report.products.institutional.cellCertification;
  const sme = report.products.smeMonthly.cellCertification;

  assert.deepEqual(institutional.samples, [
    { address: 'A9', value: '00000001' },
    { address: 'D9', value: '07-2026' },
    { address: 'L9', value: 'APTA' },
    { address: 'D10', value: '08-2026' },
    { address: 'L11', value: 'INAPTA' }
  ]);

  assert.deepEqual(sme.samples, [
    { address: 'A2', value: 1 },
    { address: 'C2', value: '04.00.001' },
    { address: 'E2', value: 'SIM' },
    { address: 'K2', value: 'NÃO' },
    { address: 'C3', value: '04.00.002' }
  ]);
});

test('detecta resultado consolidado incompatível com a projeção canônica e bloqueia a certificação', () => {
  const input = fixture();
  input.verificacoes['SCHOOL-A']['2026-08_BASIC'].resultadoBonif = 'inapta';

  const report = certification.certifyExcelProducts(input);

  assert.equal(report.passed, false);
  assert.equal(report.canonicalResults.mismatchCount, 1);
  assert.equal(report.products.institutional.passed, false);
  assert.equal(report.products.smeMonthly.passed, false);
  assert.deepEqual(report.canonicalResults.mismatches.map(item => item.code), [
    'STORED_RESULT_DIFFERS_FROM_CANONICAL'
  ]);
  assert.match(report.canonicalResults.mismatches[0].contextHash, /^[a-f0-9]{16}$/);
  assert.equal(Object.hasOwn(report.canonicalResults.mismatches[0], 'schoolId'), false);
});

test('manifesto é determinístico, não inclui dados pessoais e altera hash quando uma célula muda', () => {
  const first = certification.certifyExcelProducts(fixture());
  const second = certification.certifyExcelProducts(fixture());
  const changedInput = fixture();
  changedInput.verificacoes['SCHOOL-B']['2026-08_BASIC'].bonificacao.notaFiscal = 'Não se aplica';
  changedInput.verificacoes['SCHOOL-B']['2026-08_BASIC'].bonificacao.encampInventario = 'Não se aplica';
  const changed = certification.certifyExcelProducts(changedInput);

  assert.equal(first.manifestHash, second.manifestHash);
  assert.equal(first.products.institutional.contentHash, second.products.institutional.contentHash);
  assert.equal(first.products.smeMonthly.contentHash, second.products.smeMonthly.contentHash);
  assert.notEqual(first.products.smeMonthly.contentHash, changed.products.smeMonthly.contentHash);

  const serialized = JSON.stringify(first);
  assert.equal(serialized.includes('Unidade Escolar Alfa'), false);
  assert.equal(serialized.includes('Unidade Escolar Beta'), false);
  assert.equal(serialized.includes('SCHOOL-A'), false);
  assert.equal(serialized.includes('SCHOOL-B'), false);
  assert.match(first.manifestHash, /^[a-f0-9]{64}$/);
});

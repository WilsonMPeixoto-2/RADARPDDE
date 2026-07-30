#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const modelApi = require('../src/domain/excel-sme-export-model.js');
const renderer = require('../src/domain/excel-sme-monthly-renderer.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUTPUT = path.join(
  ROOT,
  'artifacts/excel-homologation/RADAR_PDDE_EXCEL_SME_HOMOLOGACAO_12-2026.xlsx'
);

function parseArguments(argv) {
  const args = { output: DEFAULT_OUTPUT };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token !== '--output') throw new Error(`Argumento desconhecido: ${token}`);
    const next = argv[index + 1];
    if (!next) throw new Error('O argumento --output exige um caminho.');
    args.output = path.resolve(ROOT, next);
    index += 1;
  }
  return args;
}

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

function verification(result, overrides = {}) {
  return {
    bonificacao: completeBonification(overrides),
    resultadoBonif: result
  };
}

function fixture() {
  return {
    activeCompetenciaKey: '2026-12',
    escolas: [
      {
        id: 'HOMOLOG-SCHOOL-001',
        designação: '04.31.001',
        denominação: 'Unidade de Homologação Alfa',
        cre: '4ª CRE',
        programasIds: ['BASIC', 'CONECTADA', 'RECURSOS']
      },
      {
        id: 'HOMOLOG-SCHOOL-002',
        designação: '04.31.002',
        denominação: 'Unidade de Homologação Beta',
        cre: '4ª CRE',
        programasIds: ['BASIC']
      }
    ],
    programas: [
      { id: 'BASIC', name: 'PDDE Básico' },
      { id: 'CONECTADA', name: 'Educação Conectada' },
      { id: 'RECURSOS', name: 'Sala de Recursos' }
    ],
    verificacoes: {
      'HOMOLOG-SCHOOL-001': {
        '2026-12_BASIC': verification('apta'),
        '2026-12_CONECTADA': verification('inapta', { extCC: 'Não' }),
        '2026-12_RECURSOS': verification('apta', {
          notaFiscal: 'Sim',
          encampInventario: 'Sim'
        })
      },
      'HOMOLOG-SCHOOL-002': {
        '2026-12_BASIC': verification('apta', {
          extINV: 'Não',
          declBBAgil: 'Não se aplica'
        })
      }
    }
  };
}

function validateWorkbook(model, workbook) {
  const worksheet = workbook.worksheets[0];
  if (workbook.worksheets.length !== 1 || worksheet?.name !== 'DEZEMBRO') {
    throw new Error('O arquivo de homologação não preservou a única aba mensal esperada.');
  }
  if (worksheet.columnCount !== 30) {
    throw new Error('O arquivo de homologação não preservou as 30 colunas do modelo original.');
  }
  const headers = model.columns.map((_, index) => worksheet.getRow(1).getCell(index + 1).value || '');
  if (JSON.stringify(headers) !== JSON.stringify(modelApi.ORIGINAL_HEADER_LABELS)) {
    throw new Error('O arquivo de homologação alterou os textos do modelo original.');
  }
  if (!worksheet.getCell('A1').isMerged || !worksheet.getCell('B1').isMerged) {
    throw new Error('O arquivo de homologação perdeu a mesclagem CRE em A1:B1.');
  }
  const view = worksheet.views[0] || {};
  if (view.state !== 'frozen' || view.xSplit !== 4 || view.ySplit !== 1) {
    throw new Error('O arquivo de homologação perdeu o congelamento das quatro primeiras colunas e do cabeçalho.');
  }
  if (worksheet.autoFilter !== 'A1:AD3') {
    throw new Error('O arquivo de homologação perdeu o autofiltro integral.');
  }
  if (worksheet.pageSetup.printArea !== 'A1:AD3' || worksheet.pageSetup.printTitlesRow !== '1:1') {
    throw new Error('O arquivo de homologação perdeu os contratos de impressão.');
  }
  if (Object.keys(worksheet.dataValidations.model || {}).length > 0) {
    throw new Error('O arquivo de homologação reintroduziu validações de dados incompatíveis.');
  }
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const model = modelApi.buildSmeMonthlyModel(fixture());
  const workbook = renderer.buildWorkbook(model);
  validateWorkbook(model, workbook);
  const bytes = await renderer.renderWorkbook(model);

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, bytes);
  process.stdout.write(`Excel SME de homologação gerado: ${path.relative(ROOT, args.output)}\n`);
  process.stdout.write(`Renderer: ${renderer.VERSION}\n`);
  process.stdout.write(`Colunas: ${model.columns.length}\n`);
  process.stdout.write(`Bytes: ${bytes.length}\n`);
}

main().catch(error => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});

#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const modelApi = require('../src/domain/excel-sme-export-model.js');
const renderer = require('../src/domain/excel-sme-template-renderer.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(ROOT, 'assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx');
const DEFAULT_OUTPUT = path.join(
  ROOT,
  'artifacts/excel-homologation/RADAR_PDDE_EXCEL_SME_HOMOLOGACAO_EXCELJS_12-2026.xlsx'
);
const DEFAULT_EVIDENCE = path.join(
  ROOT,
  'artifacts/excel-homologation/evidence.json'
);

function parseArguments(argv) {
  const args = { output: DEFAULT_OUTPUT, evidence: DEFAULT_EVIDENCE };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!['--output', '--evidence'].includes(token)) {
      throw new Error(`Argumento desconhecido: ${token}`);
    }
    const next = argv[index + 1];
    if (!next) throw new Error(`O argumento ${token} exige um caminho.`);
    args[token === '--output' ? 'output' : 'evidence'] = path.resolve(ROOT, next);
    index += 1;
  }
  return args;
}

function complete(overrides = {}) {
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

function verification(overrides = {}) {
  return {
    bonificacao: complete(overrides)
  };
}

function fixture() {
  return {
    activeCompetenciaKey: '2026-12',
    escolas: [
      {
        id: 'HOMOLOG-APTA',
        designação: '04.10.001',
        denominação: 'Escola Municipal Ema Negrão de Lima',
        cre: '4ª CRE',
        programasIds: ['BASIC']
      },
      {
        id: 'HOMOLOG-INAPTA',
        designação: '04.10.002',
        denominação: 'Escola Municipal Albino Souza Cruz',
        cre: '4ª CRE',
        programasIds: ['BASIC']
      },
      {
        id: 'HOMOLOG-NAO-INICIADA',
        designação: '04.10.003',
        denominação: 'Escola Municipal Ruy Barbosa',
        cre: '4ª CRE',
        programasIds: ['BASIC']
      },
      {
        id: 'HOMOLOG-PARCIAL',
        designação: '04.10.004',
        denominação: 'Escola Municipal Pedro Lessa',
        cre: '4ª CRE',
        programasIds: ['BASIC', 'CONECTADA', 'PROEC', 'RECURSOS']
      }
    ],
    programas: [
      { id: 'BASIC', name: 'PDDE Básico' },
      { id: 'CONECTADA', name: 'Educação Conectada' },
      { id: 'PROEC', name: 'Programa Escola e Comunidade' },
      { id: 'RECURSOS', name: 'Sala de Recursos' }
    ],
    verificacoes: {
      'HOMOLOG-APTA': {
        '2026-12_BASIC': verification()
      },
      'HOMOLOG-INAPTA': {
        '2026-12_BASIC': verification({ extCC: 'Não' })
      },
      'HOMOLOG-NAO-INICIADA': {},
      'HOMOLOG-PARCIAL': {
        '2026-12_BASIC': verification(),
        '2026-12_CONECTADA': verification({ notaFiscal: 'Sim' }),
        '2026-12_PROEC': {
          bonificacao: { extCC: 'Não' }
        }
      }
    }
  };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeHeaderValues(worksheet, columns) {
  return columns.map((column, index) => (
    column.mergedHeader ? '' : (worksheet.getRow(1).getCell(index + 1).value || '')
  ));
}

function validateWorkbook(workbook, model) {
  if (workbook.worksheets.length !== 1) {
    throw new Error('O candidato deve conter somente uma aba mensal.');
  }
  const worksheet = workbook.worksheets[0];
  if (worksheet.name !== 'DEZEMBRO' || worksheet.columnCount !== 27) {
    throw new Error('O candidato não preservou a aba DEZEMBRO e as 27 colunas originais.');
  }
  const expectedHeaders = modelApi.ORIGINAL_HEADER_LABELS.map(label => (
    label ? renderer.formatHeaderLabel(label) : ''
  ));
  if (JSON.stringify(normalizeHeaderValues(worksheet, model.columns)) !== JSON.stringify(expectedHeaders)) {
    throw new Error('O candidato não preservou o conteúdo normalizado dos títulos originais.');
  }
  if (model.columns.some(column => column.label === 'SISTEMÁTICA PREENCHIDA')) {
    throw new Error('O candidato reintroduziu uma coluna SISTEMÁTICA PREENCHIDA.');
  }
  if (!worksheet.getCell('A1').isMerged || !worksheet.getCell('B1').isMerged) {
    throw new Error('O candidato perdeu a mesclagem CRE em A1:B1.');
  }
  if (worksheet.getRow(1).height !== renderer.HEADER_ROW_HEIGHT) {
    throw new Error('O candidato perdeu a altura canônica do cabeçalho.');
  }
  for (let column = 1; column <= worksheet.columnCount; column += 1) {
    if (column === 2) continue;
    const alignment = worksheet.getRow(1).getCell(column).alignment || {};
    if (alignment.horizontal !== 'center'
        || alignment.vertical !== 'middle'
        || alignment.wrapText !== true
        || alignment.indent) {
      throw new Error(`O título da coluna ${column} não está centralizado uniformemente.`);
    }
  }

  const expected = {
    E2: 'SIM', W2: 'APTA',
    E3: 'NÃO', W3: 'INAPTA',
    E4: '', W4: '',
    E5: 'SIM', K5: 'NÃO', Q5: '', W5: ''
  };
  for (const [address, value] of Object.entries(expected)) {
    const actual = worksheet.getCell(address).value || '';
    if (actual !== value) {
      throw new Error(`Valor inesperado em ${address}: ${JSON.stringify(actual)}; esperado ${JSON.stringify(value)}.`);
    }
  }
  for (let row = 2; row <= 5; row += 1) {
    for (const column of ['X', 'Y', 'Z', 'AA']) {
      if ((worksheet.getCell(`${column}${row}`).value || '') !== '') {
        throw new Error(`O campo administrativo ${column}${row} deveria permanecer vazio.`);
      }
    }
    const designation = worksheet.getCell(`C${row}`);
    if (typeof designation.value !== 'string' || designation.numFmt !== '@') {
      throw new Error(`A designação C${row} não foi gravada como texto.`);
    }
  }

  const finalRow = model.rows.length + 1;
  const expectedRange = `A1:AA${finalRow}`;
  const view = worksheet.views[0] || {};
  if (view.state !== 'frozen' || view.xSplit !== 4 || view.ySplit !== 1 || view.topLeftCell !== 'E2') {
    throw new Error('O candidato perdeu o congelamento de E2.');
  }
  if (worksheet.autoFilter !== expectedRange) {
    throw new Error(`O candidato perdeu o autofiltro dinâmico ${expectedRange}.`);
  }
  if (worksheet.pageSetup.orientation !== 'landscape'
      || worksheet.pageSetup.fitToWidth !== 1
      || worksheet.pageSetup.fitToHeight !== 0
      || worksheet.pageSetup.printArea !== expectedRange
      || worksheet.pageSetup.printTitlesRow !== '1:1') {
    throw new Error(`O candidato perdeu os contratos de impressão dinâmicos ${expectedRange}.`);
  }
  if (Object.keys(worksheet.dataValidations.model || {}).length !== 0) {
    throw new Error('O candidato reintroduziu dataValidations incompatíveis.');
  }
  for (const address of ['A1', 'AA1', 'A2', 'AA2']) {
    const border = worksheet.getCell(address).border;
    if (!['left', 'right', 'top', 'bottom'].every(side => border[side]?.style === 'thin')) {
      throw new Error(`O candidato não aplicou a grade completa em ${address}.`);
    }
  }
  return worksheet;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const templateBytes = fs.readFileSync(TEMPLATE);
  const model = modelApi.buildSmeMonthlyModel(fixture());
  const bytes = await renderer.renderWorkbook(model, { ExcelJS, templateBytes });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const worksheet = validateWorkbook(workbook, model);

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.mkdirSync(path.dirname(args.evidence), { recursive: true });
  fs.writeFileSync(args.output, bytes);

  const finalRange = `A1:AA${model.rows.length + 1}`;
  const evidence = {
    version: 3,
    rendererVersion: renderer.VERSION,
    modelVersion: model.VERSION,
    competenceKey: model.competenceKey,
    sheetName: worksheet.name,
    columnCount: worksheet.columnCount,
    styledRowCount: worksheet.rowCount,
    scenarioCount: model.rows.length,
    statuses: {
      apta: model.rows.filter(row => row.status === 'APTA').length,
      inapta: model.rows.filter(row => row.status === 'INAPTA').length,
      indeterminado: model.rows.filter(row => !row.status).length
    },
    templateSha256: sha256(templateBytes),
    outputSha256: sha256(bytes),
    outputBytes: bytes.length,
    contracts: {
      normalizedHeaders: true,
      centeredHeaderAlignment: true,
      mergedCre: true,
      dataValidations: false,
      frozenPane: 'E2',
      printArea: finalRange,
      administrativeFieldsBlank: true,
      obsoleteTemplateValuesCleared: true,
      systematicColumnsRemoved: true,
      designationStoredAsText: true,
      gridBorders: true,
      roundTripExcelJs: true
    }
  };
  fs.writeFileSync(args.evidence, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

  process.stdout.write(`Excel SME de homologação gerado: ${path.relative(ROOT, args.output)}\n`);
  process.stdout.write(`Evidência sanitizada: ${path.relative(ROOT, args.evidence)}\n`);
  process.stdout.write(`SHA-256: ${evidence.outputSha256}\n`);
}

main().catch(error => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});

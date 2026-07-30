#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const modelApi = require('../src/domain/excel-sme-export-model.js');
const renderer = require('../src/domain/excel-sme-monthly-renderer.js');
const baseRenderer = require('../src/domain/excel-xlsx-renderer.js');

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

function main() {
  const args = parseArguments(process.argv.slice(2));
  const model = modelApi.buildSmeMonthlyModel(fixture());
  const bytes = renderer.renderWorkbook(model);
  const entries = baseRenderer.inspectStoredZip(bytes);
  const workbook = new TextDecoder('utf-8').decode(entries['xl/workbook.xml']);

  if (/<workbookPr\b/.test(workbook)) {
    throw new Error('O arquivo de homologação ainda contém propriedades vazias reparáveis no workbook.');
  }
  if (!workbook.includes('_xlnm.Print_Area') || !workbook.includes('_xlnm.Print_Titles')) {
    throw new Error('O arquivo de homologação perdeu os contratos de impressão.');
  }

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, bytes);
  process.stdout.write(`Excel SME de homologação gerado: ${path.relative(ROOT, args.output)}\n`);
  process.stdout.write(`Renderer: ${renderer.VERSION}\n`);
  process.stdout.write(`Bytes: ${bytes.length}\n`);
}

try {
  main();
} catch (error) {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
}

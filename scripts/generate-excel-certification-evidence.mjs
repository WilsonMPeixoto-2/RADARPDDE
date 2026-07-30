#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { certifyExcelProducts, stableStringify } = require('../src/domain/excel-integral-certification.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUTPUT = path.join(
  ROOT,
  'docs/evidence/excel-certification/synthetic-manifest.json'
);

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

function completeAnalysis() {
  return {
    extCC: 'Correto',
    extINV: 'Correto',
    notaFiscal: 'Correto',
    consAssessoria: 'Correto',
    declBBAgil: 'Correto',
    encampInventario: 'Correto'
  };
}

function verification(result, overrides = {}) {
  return {
    bonificacao: completeBonification(overrides),
    analise: completeAnalysis(),
    resultadoBonif: result
  };
}

function certificationFixture() {
  return {
    generatedAt: '2026-07-29T02:30:00.000Z',
    activeCompetenciaKey: '2026-08',
    escolas: [
      {
        id: 'CERT-SCHOOL-001',
        inep: '00000001',
        denominação: 'Unidade Sintética Alfa',
        designação: '04.00.001',
        cre: '4ª CRE',
        programasIds: ['BASIC', 'CONECTADA']
      },
      {
        id: 'CERT-SCHOOL-002',
        inep: '00000002',
        denominação: 'Unidade Sintética Beta',
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
      'CERT-SCHOOL-001': {
        '2026-07_BASIC': verification('apta'),
        '2026-08_BASIC': verification('apta'),
        '2026-08_CONECTADA': verification('inapta', { extCC: 'Não' })
      },
      'CERT-SCHOOL-002': {
        '2026-08_BASIC': verification('apta', {
          notaFiscal: 'Sim',
          encampInventario: 'Sim'
        })
      }
    }
  };
}

function parseArguments(argv) {
  const args = { check: false, stdout: false, output: DEFAULT_OUTPUT };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--check') args.check = true;
    else if (token === '--stdout') args.stdout = true;
    else if (token === '--output') {
      const next = argv[index + 1];
      if (!next) throw new Error('O argumento --output exige um caminho.');
      args.output = path.resolve(ROOT, next);
      index += 1;
    } else {
      throw new Error(`Argumento desconhecido: ${token}`);
    }
  }
  return args;
}

function canonicalJson(value) {
  return `${JSON.stringify(JSON.parse(stableStringify(value)), null, 2)}\n`;
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  const report = certifyExcelProducts(certificationFixture());
  if (!report.passed) {
    throw new Error(`A massa sintética não foi certificada: ${JSON.stringify(report)}`);
  }
  const output = canonicalJson(report);

  if (args.stdout) {
    process.stdout.write(`EXCEL_CERTIFICATION_MANIFEST=${JSON.stringify(report)}\n`);
  }

  if (args.check) {
    if (!fs.existsSync(args.output)) {
      throw new Error(`Manifesto de referência ausente: ${path.relative(ROOT, args.output)}`);
    }
    const existing = fs.readFileSync(args.output, 'utf8');
    if (existing !== output) {
      process.stdout.write(`EXCEL_CERTIFICATION_EXPECTED=${JSON.stringify(report)}\n`);
      throw new Error('O manifesto Excel regenerado diverge da evidência versionada.');
    }
    process.stdout.write(`Manifesto Excel reproduzido: ${path.relative(ROOT, args.output)}\n`);
    return;
  }

  if (!args.stdout || args.output !== DEFAULT_OUTPUT) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, output, 'utf8');
    process.stdout.write(`Manifesto Excel gerado: ${path.relative(ROOT, args.output)}\n`);
  }
}

try {
  main();
} catch (error) {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
}

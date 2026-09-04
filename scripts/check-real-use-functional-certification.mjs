#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadMatrix } from './check-functional-contract-matrix.mjs';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(MODULE_DIR, '..');
const CERTIFICATION_RELATIVE_PATH = 'docs/reference/real-use-functional-certification.json';
const MARKDOWN_RELATIVE_PATH = 'docs/reference/REAL_USE_FUNCTIONAL_CERTIFICATION.md';
const FUNCTIONAL_MUTATION_MODES = new Set(['write', 'edge-function', 'export']);
const VALID_RESULTS = new Set(['NÃO EXECUTADO', 'PASS', 'FAIL', 'CORRIGIDO']);
const REQUIRED_FIELDS = Object.freeze([
  'area',
  'userAction',
  'initialState',
  'expectedResult',
  'persistence',
  'reload',
  'relations',
  'repeatGesture',
  'functionalProfiles',
  'result',
  'evidence'
]);

function readJson(rootDir, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function functionalProfileIds(matrix) {
  return new Set(
    (matrix.profiles || [])
      .filter(profile => profile?.kind === 'functional')
      .map(profile => profile.id)
  );
}

export function requiredOperations(matrix) {
  const functionalProfiles = functionalProfileIds(matrix);
  return (matrix.operations || [])
    .filter(operation => FUNCTIONAL_MUTATION_MODES.has(operation?.mode))
    .filter(operation => (operation.allow || []).some(profile => functionalProfiles.has(profile)))
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id, 'pt-BR'));
}

export function requiredOperationIds(matrix) {
  return requiredOperations(matrix).map(operation => operation.id);
}

export function validateCertification(matrix, certification) {
  const findings = [];
  if (certification?.schemaVersion !== 1) findings.push('schemaVersion da certificação deve ser 1.');

  const requiredIds = requiredOperationIds(matrix);
  const rows = Array.isArray(certification?.operations) ? certification.operations : [];
  const rowsById = new Map();

  for (const row of rows) {
    if (!row?.id) {
      findings.push('Linha de certificação sem id.');
      continue;
    }
    if (rowsById.has(row.id)) findings.push(`Operação duplicada na certificação: ${row.id}.`);
    rowsById.set(row.id, row);
  }

  for (const id of requiredIds) {
    if (!rowsById.has(id)) findings.push(`Operação funcional sem certificação: ${id}.`);
  }

  const requiredSet = new Set(requiredIds);
  for (const row of rows) {
    if (!row?.id) continue;
    if (!requiredSet.has(row.id)) findings.push(`Operação fora do conjunto funcional obrigatório: ${row.id}.`);
    for (const field of REQUIRED_FIELDS) {
      if (row[field] === undefined || row[field] === null) {
        findings.push(`${row.id}: campo de uso real ausente: ${field}.`);
      }
    }
    if (row.result !== undefined && !VALID_RESULTS.has(row.result)) {
      findings.push(`${row.id}: resultado inválido: ${row.result}.`);
    }
    if (row.relations !== undefined && !Array.isArray(row.relations)) {
      findings.push(`${row.id}: relations deve ser um array.`);
    }
    if (row.functionalProfiles !== undefined && !Array.isArray(row.functionalProfiles)) {
      findings.push(`${row.id}: functionalProfiles deve ser um array.`);
    }
    if (row.evidence !== undefined && !Array.isArray(row.evidence)) {
      findings.push(`${row.id}: evidence deve ser um array.`);
    }
    if (['PASS', 'CORRIGIDO'].includes(row.result) && (!Array.isArray(row.evidence) || row.evidence.length === 0)) {
      findings.push(`${row.id}: ${row.result} exige evidência explícita.`);
    }
  }

  return findings;
}

function escapeCell(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', '<br>');
}

function renderCounts(certification) {
  const counts = Object.fromEntries([...VALID_RESULTS].map(result => [result, 0]));
  for (const row of certification.operations || []) {
    if (Object.hasOwn(counts, row.result)) counts[row.result] += 1;
  }
  return [...VALID_RESULTS]
    .map(result => `| ${result} | ${counts[result]} |`)
    .join('\n');
}

export function renderMarkdown(matrix, certification) {
  const rowsById = new Map((certification.operations || []).map(row => [row.id, row]));
  const operationRows = requiredOperations(matrix).map(operation => {
    const row = rowsById.get(operation.id);
    const relations = (row.relations || []).join(', ');
    const profiles = (row.functionalProfiles || []).join(', ');
    const evidence = (row.evidence || []).join('<br>');
    return `| \`${operation.id}\` | ${escapeCell(row.area)} | ${escapeCell(row.userAction)} | ${escapeCell(profiles)} | ${escapeCell(row.persistence)} | ${escapeCell(row.reload)} | ${escapeCell(relations)} | ${escapeCell(row.repeatGesture)} | **${row.result}** | ${escapeCell(evidence)} |`;
  }).join('\n');

  return [
    '# Certificação funcional por uso real',
    '',
    `**Atualizado em:** ${certification.updatedAt}  `,
    `**Baseline de referência:** \`${certification.sourceCommit}\`  `,
    `**Operações funcionais obrigatórias:** ${requiredOperationIds(matrix).length}`,
    '',
    '> Uma operação não recebe PASS por herdar testes antigos. PASS/CORRIGIDO exige evidência de execução do cenário de uso real definido para a linha.',
    '',
    '## Resumo',
    '',
    '| Resultado | Operações |',
    '|---|---:|',
    renderCounts(certification),
    '',
    '## Operações',
    '',
    '| ID | Área | Ação real | Perfis funcionais | Persistência | Reload | Relações | Gesto repetido | Resultado | Evidência |',
    '|---|---|---|---|---|---|---|---|---|---|',
    operationRows,
    '',
    '## Regra de fechamento',
    '',
    'A frente só pode ser encerrada com **FAIL = 0** e **NÃO EXECUTADO = 0** para este conjunto fechado. Checks unitários, lint e CI são proteção adicional, não substitutos desta evidência.',
    ''
  ].join('\n');
}

export function main(argv = process.argv.slice(2), rootDir = DEFAULT_ROOT) {
  let matrix;
  let certification;
  try {
    matrix = loadMatrix(rootDir);
    certification = readJson(rootDir, CERTIFICATION_RELATIVE_PATH);
  } catch (error) {
    console.error(`Falha ao carregar certificação funcional: ${error.message}`);
    return 1;
  }

  const findings = validateCertification(matrix, certification);
  if (findings.length > 0) {
    console.error('Certificação funcional inválida:');
    findings.forEach(finding => console.error(`- ${finding}`));
    return 1;
  }

  const rendered = renderMarkdown(matrix, certification);
  const markdownPath = path.join(rootDir, MARKDOWN_RELATIVE_PATH);
  if (argv.includes('--write')) {
    fs.writeFileSync(markdownPath, rendered, 'utf8');
    console.log(`Certificação funcional gerada em ${MARKDOWN_RELATIVE_PATH}.`);
    return 0;
  }

  if (!fs.existsSync(markdownPath)) {
    console.error(`Arquivo gerado ausente: ${MARKDOWN_RELATIVE_PATH}. Execute com --write.`);
    return 1;
  }
  const current = fs.readFileSync(markdownPath, 'utf8');
  if (current !== rendered) {
    console.error(`Arquivo gerado divergente: ${MARKDOWN_RELATIVE_PATH}. Execute com --write.`);
    return 1;
  }

  console.log(`Certificação funcional válida: ${requiredOperationIds(matrix).length} operações obrigatórias.`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  process.exitCode = main();
}

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_REPORT = path.join(ROOT, 'dependency-health/npm-audit.json');

const ALLOWED_ADVISORIES = Object.freeze(new Map([
  ['GHSA-mh99-v99m-4gvg', Object.freeze({
    packages: Object.freeze(new Set([
      'archiver',
      'archiver-utils',
      'brace-expansion',
      'exceljs',
      'glob',
      'minimatch',
      'readdir-glob',
      'rimraf',
      'zip-stream'
    ])),
    reason: 'Cadeia de glob/streaming do Node não alcançada pelo workbook documental do navegador.'
  })],
  ['GHSA-w5hq-g745-h8pq', Object.freeze({
    packages: Object.freeze(new Set(['exceljs', 'uuid'])),
    reason: 'Advisory restrito a uuid v3/v5/v6 com buffer; o caminho usado pelo ExcelJS emprega uuid v4.'
  })]
]));

const RUNTIME_FILES = Object.freeze([
  'src/domain/excel-sme-template-renderer.js',
  'src/domain/excel-sme-monthly-renderer.js',
  'src/integration/excel-sme-runtime-loader.js',
  'src/integration/excel-export-integration.js',
  'src/integration/load-excel-export.js'
]);

const FORBIDDEN_RUNTIME_PATTERNS = Object.freeze([
  Object.freeze({ pattern: /workbook-writer|stream\/xlsx/i, label: 'writer XLSX por streaming' }),
  Object.freeze({ pattern: /\brequire\(['"](?:node:)?fs['"]\)|\bfrom\s+['"](?:node:)?fs['"]/i, label: 'filesystem Node' }),
  Object.freeze({ pattern: /\brequire\(['"](?:glob|archiver|readdir-glob|minimatch)['"]\)/i, label: 'cadeia glob/archiver' }),
  Object.freeze({ pattern: /<input[^>]+type=['"]file['"]/i, label: 'entrada XLSX fornecida pelo usuário' })
]);

function advisoryId(value) {
  const url = String(value?.url || '');
  const match = /\/advisories\/(GHSA-[a-z0-9-]+)/i.exec(url);
  return match ? match[1].toUpperCase() : '';
}

function collectAdvisories(report, packageName, seen = new Set()) {
  if (seen.has(packageName)) return new Set();
  seen.add(packageName);
  const vulnerability = report?.vulnerabilities?.[packageName];
  if (!vulnerability) return new Set();
  const result = new Set();
  for (const item of vulnerability.via || []) {
    if (typeof item === 'string') {
      for (const id of collectAdvisories(report, item, seen)) result.add(id);
      continue;
    }
    const id = advisoryId(item);
    if (id) result.add(id);
  }
  return result;
}

function evaluateAuditReport(report) {
  const violations = [];
  const accepted = [];
  const vulnerabilities = report?.vulnerabilities || {};

  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    const severity = String(vulnerability?.severity || '').toLowerCase();
    if (severity === 'critical') {
      violations.push({ code: 'CRITICAL_VULNERABILITY', packageName, severity });
      continue;
    }
    if (!['high', 'moderate'].includes(severity)) continue;

    const advisories = [...collectAdvisories(report, packageName)];
    if (!advisories.length) {
      violations.push({ code: 'UNRESOLVED_ADVISORY', packageName, severity });
      continue;
    }

    for (const id of advisories) {
      const policy = ALLOWED_ADVISORIES.get(id);
      if (!policy) {
        violations.push({ code: 'NEW_ADVISORY', packageName, severity, advisory: id });
        continue;
      }
      if (!policy.packages.has(packageName)) {
        violations.push({ code: 'PACKAGE_OUTSIDE_ALLOWED_PATH', packageName, severity, advisory: id });
        continue;
      }
      accepted.push({ packageName, severity, advisory: id, reason: policy.reason });
    }
  }

  const counts = report?.metadata?.vulnerabilities || {};
  return Object.freeze({
    passed: violations.length === 0,
    counts: Object.freeze({
      moderate: Number(counts.moderate || 0),
      high: Number(counts.high || 0),
      critical: Number(counts.critical || 0)
    }),
    accepted: Object.freeze(accepted),
    violations: Object.freeze(violations)
  });
}

function verifyBundleIdentity(root = ROOT) {
  const packageBundle = path.join(root, 'node_modules/exceljs/dist/exceljs.min.js');
  const vendorBundle = path.join(root, 'vendor/exceljs.min.js');
  const packageBytes = fs.readFileSync(packageBundle);
  const vendorBytes = fs.readFileSync(vendorBundle);
  if (!packageBytes.equals(vendorBytes)) {
    throw new Error('O bundle versionado do ExcelJS diverge do bundle oficial instalado.');
  }
  return Object.freeze({ bytes: vendorBytes.length });
}

function verifyRuntimeScope(root = ROOT) {
  const violations = [];
  for (const relativePath of RUNTIME_FILES) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    for (const item of FORBIDDEN_RUNTIME_PATTERNS) {
      if (item.pattern.test(source)) {
        violations.push({ file: relativePath, code: 'FORBIDDEN_RUNTIME_CAPABILITY', capability: item.label });
      }
    }
  }
  if (violations.length) {
    const error = new Error(`O runtime do Excel SME alcança capacidades fora da exceção: ${JSON.stringify(violations)}`);
    error.violations = violations;
    throw error;
  }
  return Object.freeze({ checkedFiles: RUNTIME_FILES.length });
}

function parseArgs(argv) {
  const args = { report: DEFAULT_REPORT };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token !== '--report') throw new Error(`Argumento desconhecido: ${token}`);
    const value = argv[index + 1];
    if (!value) throw new Error('O argumento --report exige um caminho.');
    args.report = path.resolve(ROOT, value);
    index += 1;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = JSON.parse(fs.readFileSync(args.report, 'utf8'));
  const evaluation = evaluateAuditReport(report);
  const bundle = verifyBundleIdentity();
  const runtime = verifyRuntimeScope();

  console.log(`Vulnerabilidades registradas: moderate=${evaluation.counts.moderate}, high=${evaluation.counts.high}, critical=${evaluation.counts.critical}`);
  console.log(`Ocorrências aceitas por alcance: ${evaluation.accepted.length}`);
  console.log(`Bundle oficial conferido: ${bundle.bytes} bytes`);
  console.log(`Arquivos de runtime inspecionados: ${runtime.checkedFiles}`);

  if (!evaluation.passed) {
    console.error(`A política de alcance rejeitou a auditoria: ${JSON.stringify(evaluation.violations)}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    main();
  } catch (error) {
    console.error(error?.stack || error?.message || error);
    process.exitCode = 1;
  }
}

export {
  ALLOWED_ADVISORIES,
  FORBIDDEN_RUNTIME_PATTERNS,
  RUNTIME_FILES,
  collectAdvisories,
  evaluateAuditReport,
  verifyBundleIdentity,
  verifyRuntimeScope
};

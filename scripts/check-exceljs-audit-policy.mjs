#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_REPORT = path.join(ROOT, 'dependency-health/npm-audit.json');
const AUDIT_SEVERITIES = Object.freeze(new Set(['info', 'low', 'moderate', 'high', 'critical']));

const ALLOWED_ADVISORIES = Object.freeze(new Map([
  ['GHSA-MH99-V99M-4GVG', Object.freeze({
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
    directPackages: Object.freeze(new Set(['exceljs'])),
    reason: 'Cadeia de glob/streaming do Node não alcançada pelo workbook documental do navegador.'
  })],
  ['GHSA-VFJ7-8CJW-P6XM', Object.freeze({
    packages: Object.freeze(new Set([
      'braces',
      'micromatch',
      'fast-glob',
      'globby',
      'stylelint',
      'stylelint-config-recommended'
    ])),
    directPackages: Object.freeze(new Set(['stylelint', 'stylelint-config-recommended'])),
    reason: 'Cadeia exclusiva do Stylelint em devDependencies; sem correção publicada em 2026-10-03. Remover a exceção quando houver versão corrigida compatível.'
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

function validAuditEntry(vulnerability) {
  if (!vulnerability || typeof vulnerability !== 'object' || Array.isArray(vulnerability)) return false;
  const severity = String(vulnerability.severity || '').toLowerCase();
  return AUDIT_SEVERITIES.has(severity)
    && typeof vulnerability.isDirect === 'boolean'
    && Array.isArray(vulnerability.via)
    && Array.isArray(vulnerability.effects)
    && Array.isArray(vulnerability.nodes)
    && vulnerability.nodes.length > 0
    && vulnerability.nodes.every(node => typeof node === 'string' && node.trim());
}

function reachesApprovedDirectPackage(report, packageName, policy, seen = new Set()) {
  const name = String(packageName || '');
  if (!name || seen.has(name) || !policy?.packages?.has(name)) return false;
  seen.add(name);
  const vulnerability = report?.vulnerabilities?.[name];
  if (!validAuditEntry(vulnerability)) return false;
  if (vulnerability.isDirect === true && policy.directPackages?.has(name)) return true;
  for (const effect of vulnerability.effects) {
    const next = String(effect || '');
    if (!policy.packages.has(next)) continue;
    if (reachesApprovedDirectPackage(report, next, policy, new Set(seen))) return true;
  }
  return false;
}

function evaluateAuditReport(report) {
  const violations = [];
  if (!report || typeof report !== 'object' || report.error
    || Number(report.auditReportVersion) !== 2
    || typeof report.vulnerabilities !== 'object' || report.vulnerabilities === null
    || typeof report?.metadata?.vulnerabilities !== 'object') {
    violations.push({ code: 'INVALID_AUDIT_REPORT', packageName: null, severity: null });
  }
  const accepted = [];
  const vulnerabilities = report?.vulnerabilities || {};
  const observedCounts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };

  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    if (!validAuditEntry(vulnerability)) {
      violations.push({ code: 'INVALID_AUDIT_ENTRY', packageName, severity: vulnerability?.severity || null });
      continue;
    }
    const severity = String(vulnerability.severity).toLowerCase();
    observedCounts[severity] += 1;
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
      const outsideEffects = vulnerability.effects.filter(effect => !policy.packages.has(String(effect)));
      const reachesApprovedRoot = reachesApprovedDirectPackage(report, packageName, policy);
      if (!policy.packages.has(packageName)
        || (vulnerability.isDirect === true && !policy.directPackages?.has(packageName))
        || outsideEffects.length > 0
        || !reachesApprovedRoot) {
        violations.push({
          code: 'PACKAGE_OUTSIDE_ALLOWED_PATH',
          packageName,
          severity,
          advisory: id,
          outsideEffects,
          reachesApprovedRoot
        });
        continue;
      }
      accepted.push({ packageName, severity, advisory: id, reason: policy.reason });
    }
  }

  const counts = report?.metadata?.vulnerabilities || {};
  const metadataTotal = Number(counts.total ?? 0);
  const observedTotal = Object.values(observedCounts).reduce((total, value) => total + value, 0);
  const countMismatch = [...AUDIT_SEVERITIES].some(severity => (
    Number(counts[severity] ?? 0) !== observedCounts[severity]
  )) || metadataTotal !== observedTotal;
  if (countMismatch) {
    violations.push({
      code: 'AUDIT_COUNT_MISMATCH',
      packageName: null,
      severity: null,
      expected: { ...counts },
      observed: { ...observedCounts, total: observedTotal }
    });
  }

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

function verifyRuntimeDependencyAudit(root = ROOT) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['audit', '--omit=dev', '--audit-level=high'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error('A árvore de dependências de runtime possui vulnerabilidade bloqueante; a exceção de tooling não pode ser aplicada.');
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }
  return Object.freeze({ passed: true });
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
  const runtimeAudit = verifyRuntimeDependencyAudit();
  const bundle = verifyBundleIdentity();
  const runtime = verifyRuntimeScope();

  console.log(`Vulnerabilidades registradas: moderate=${evaluation.counts.moderate}, high=${evaluation.counts.high}, critical=${evaluation.counts.critical}`);
  console.log(`Ocorrências aceitas por alcance: ${evaluation.accepted.length}`);
  console.log(`Auditoria de dependências de runtime: ${runtimeAudit.passed ? 'sem vulnerabilidades bloqueantes' : 'falhou'}`);
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
  AUDIT_SEVERITIES,
  FORBIDDEN_RUNTIME_PATTERNS,
  RUNTIME_FILES,
  collectAdvisories,
  evaluateAuditReport,
  reachesApprovedDirectPackage,
  validAuditEntry,
  verifyBundleIdentity,
  verifyRuntimeDependencyAudit,
  verifyRuntimeScope
};

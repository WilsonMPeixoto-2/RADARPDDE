'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const POLICY_URL = pathToFileURL(
    path.resolve(__dirname, '../../scripts/check-exceljs-audit-policy.mjs')
).href;

function advisory(id, severity = 'high') {
    return {
        source: id === 'GHSA-mh99-v99m-4gvg' ? 1124334 : 1119441,
        name: id === 'GHSA-mh99-v99m-4gvg' ? 'brace-expansion' : 'uuid',
        dependency: id === 'GHSA-mh99-v99m-4gvg' ? 'brace-expansion' : 'uuid',
        title: id,
        url: `https://github.com/advisories/${id}`,
        severity
    };
}

function entry(name, via, effects, { severity = 'high', isDirect = false } = {}) {
    return {
        severity,
        isDirect,
        via,
        effects,
        range: '*',
        nodes: [`node_modules/${name}`],
        fixAvailable: false
    };
}

function allowedReport() {
    return {
        auditReportVersion: 2,
        vulnerabilities: {
            'brace-expansion': entry('brace-expansion', [advisory('GHSA-mh99-v99m-4gvg')], ['minimatch']),
            minimatch: entry('minimatch', ['brace-expansion'], ['glob', 'readdir-glob']),
            glob: entry('glob', ['minimatch'], ['archiver-utils', 'rimraf']),
            'archiver-utils': entry('archiver-utils', ['glob'], ['archiver', 'zip-stream']),
            archiver: entry('archiver', ['archiver-utils'], ['exceljs']),
            'readdir-glob': entry('readdir-glob', ['minimatch'], ['archiver']),
            'zip-stream': entry('zip-stream', ['archiver-utils'], ['archiver']),
            rimraf: entry('rimraf', ['glob'], ['exceljs']),
            exceljs: entry('exceljs', ['archiver'], [], { isDirect: true })
        },
        metadata: {
            vulnerabilities: { info: 0, low: 0, moderate: 0, high: 9, critical: 0, total: 9 }
        }
    };
}

function stylelintBracesReport() {
    return {
        auditReportVersion: 2,
        vulnerabilities: {
            braces: entry('braces', [advisory('GHSA-vfj7-8cjw-p6xm')], ['micromatch']),
            micromatch: entry('micromatch', ['braces'], ['fast-glob', 'globby', 'stylelint']),
            'fast-glob': entry('fast-glob', ['micromatch'], ['globby', 'stylelint']),
            globby: entry('globby', ['fast-glob', 'micromatch'], ['stylelint']),
            stylelint: entry('stylelint', ['fast-glob', 'globby', 'micromatch'], ['stylelint-config-recommended'], { isDirect: true }),
            'stylelint-config-recommended': entry('stylelint-config-recommended', ['stylelint'], [], { isDirect: true })
        },
        metadata: {
            vulnerabilities: { info: 0, low: 0, moderate: 0, high: 6, critical: 0, total: 6 }
        }
    };
}

function minimatchAmplificationReport() {
    return {
        auditReportVersion: 2,
        vulnerabilities: {
            '@eslint-community/eslint-utils': entry('@eslint-community/eslint-utils', ['eslint'], ['eslint'], { severity: 'moderate' }),
            '@eslint/config-array': entry('@eslint/config-array', ['minimatch'], ['eslint'], { severity: 'moderate' }),
            '@eslint/js': entry('@eslint/js', ['eslint'], [], { severity: 'moderate', isDirect: true }),
            archiver: entry('archiver', ['archiver-utils', 'readdir-glob', 'zip-stream'], ['exceljs'], { severity: 'moderate' }),
            'archiver-utils': entry('archiver-utils', ['glob'], ['archiver', 'zip-stream'], { severity: 'moderate' }),
            eslint: entry('eslint', ['@eslint-community/eslint-utils', '@eslint/config-array', 'minimatch'], ['@eslint-community/eslint-utils', '@eslint/js', 'eslint-plugin-no-unsanitized', 'eslint-plugin-playwright'], { severity: 'moderate', isDirect: true }),
            'eslint-plugin-no-unsanitized': entry('eslint-plugin-no-unsanitized', ['eslint'], [], { severity: 'moderate', isDirect: true }),
            'eslint-plugin-playwright': entry('eslint-plugin-playwright', ['eslint'], [], { severity: 'moderate', isDirect: true }),
            exceljs: entry('exceljs', ['archiver'], [], { severity: 'moderate', isDirect: true }),
            glob: entry('glob', ['minimatch'], ['archiver-utils', 'rimraf'], { severity: 'moderate' }),
            minimatch: entry('minimatch', [advisory('GHSA-g3hv-75wg-m249', 'moderate')], ['@eslint/config-array', 'eslint', 'glob', 'readdir-glob'], { severity: 'moderate' }),
            'readdir-glob': entry('readdir-glob', ['minimatch'], ['archiver'], { severity: 'moderate' }),
            rimraf: entry('rimraf', ['glob'], [], { severity: 'moderate' }),
            'zip-stream': entry('zip-stream', ['archiver-utils'], ['archiver'], { severity: 'moderate' })
        },
        metadata: {
            vulnerabilities: { info: 0, low: 0, moderate: 14, high: 0, critical: 0, total: 14 }
        }
    };
}

function minimatchAmplificationLockfile() {
    return {
        packages: {
            'node_modules/exceljs': { dependencies: { unzipper: '^0.10.11' } },
            'node_modules/unzipper': { dependencies: { fstream: '^1.0.12' } },
            'node_modules/fstream': { dependencies: { rimraf: '2' } },
            'node_modules/rimraf': { dependencies: { glob: '^7.1.3' } },
            'node_modules/glob': { dependencies: { minimatch: '^3.1.1' } },
            'node_modules/eslint': {
                dependencies: {
                    '@eslint-community/eslint-utils': '^4.9.1',
                    '@eslint/config-array': '^0.23.0',
                    minimatch: '^10.2.6'
                }
            },
            'node_modules/@eslint/config-array': { dependencies: { minimatch: '^10.2.4' } }
        }
    };
}

test('aceita somente o advisory remanescente da cadeia glob nos caminhos documentados', async () => {
    const policy = await import(POLICY_URL);
    const result = policy.evaluateAuditReport(allowedReport());

    assert.equal(result.passed, true);
    assert.equal(result.counts.high, 9);
    assert.equal(result.counts.moderate, 0);
    assert.deepEqual(new Set(result.accepted.map(item => item.advisory)), new Set([
        'GHSA-mh99-v99m-4gvg'.toUpperCase()
    ]));
    assert.deepEqual(result.violations, []);
});

test('bloqueia pacote transitivo da exceção ExcelJS quando ele aparece como dependência direta', async () => {
    const policy = await import(POLICY_URL);
    const report = allowedReport();
    report.vulnerabilities.glob.isDirect = true;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => (
        item.code === 'PACKAGE_OUTSIDE_ALLOWED_PATH'
        && item.packageName === 'glob'
        && item.advisory === 'GHSA-MH99-V99M-4GVG'
    )));
});

test('aceita o advisory sem correção de braces somente na cadeia Stylelint de desenvolvimento documentada', async () => {
    const policy = await import(POLICY_URL);
    const result = policy.evaluateAuditReport(stylelintBracesReport());

    assert.equal(result.passed, true);
    assert.equal(result.counts.high, 6);
    assert.deepEqual(new Set(result.accepted.map(item => item.advisory)), new Set([
        'GHSA-vfj7-8cjw-p6xm'.toUpperCase()
    ]));
    assert.deepEqual(result.violations, []);
});

test('bloqueia o advisory de braces quando aparece fora da cadeia Stylelint autorizada', async () => {
    const policy = await import(POLICY_URL);
    const report = stylelintBracesReport();
    report.vulnerabilities['runtime-package'] = entry('runtime-package', ['braces'], [], { isDirect: true });
    report.metadata.vulnerabilities.high += 1;
    report.metadata.vulnerabilities.total += 1;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => (
        item.code === 'PACKAGE_OUTSIDE_ALLOWED_PATH'
        && item.packageName === 'runtime-package'
        && item.advisory === 'GHSA-VFJ7-8CJW-P6XM'
    )));
});

test('bloqueia cadeia permitida quando ela afeta pacote fora do caminho aprovado', async () => {
    const policy = await import(POLICY_URL);
    const report = stylelintBracesReport();
    report.vulnerabilities.braces.effects.push('other-tool');

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => (
        item.code === 'PACKAGE_OUTSIDE_ALLOWED_PATH'
        && item.packageName === 'braces'
        && item.outsideEffects?.includes('other-tool')
    )));
});

test('aceita o advisory moderado recente de minimatch apenas nas cadeias documentadas de tooling e ExcelJS', async () => {
    const policy = await import(POLICY_URL);
    const report = minimatchAmplificationReport();
    const withoutLock = policy.evaluateAuditReport(report);
    assert.equal(withoutLock.passed, false);
    assert.ok(withoutLock.violations.some(item => (
        item.packageName === 'rimraf'
        && item.code === 'PACKAGE_OUTSIDE_ALLOWED_PATH'
    )));

    const result = policy.evaluateAuditReport(report, minimatchAmplificationLockfile());

    assert.equal(result.passed, true);
    assert.equal(result.counts.moderate, 14);
    assert.deepEqual(new Set(result.accepted.map(item => item.advisory)), new Set([
        'GHSA-G3HV-75WG-M249'
    ]));
    assert.deepEqual(result.violations, []);
});

test('bloqueia o advisory de minimatch fora das cadeias explicitamente autorizadas', async () => {
    const policy = await import(POLICY_URL);
    const report = minimatchAmplificationReport();
    report.vulnerabilities['runtime-package'] = entry(
        'runtime-package',
        ['minimatch'],
        [],
        { severity: 'moderate', isDirect: true }
    );
    report.vulnerabilities.minimatch.effects.push('runtime-package');
    report.metadata.vulnerabilities.moderate += 1;
    report.metadata.vulnerabilities.total += 1;

    const result = policy.evaluateAuditReport(report, minimatchAmplificationLockfile());

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => (
        item.code === 'PACKAGE_OUTSIDE_ALLOWED_PATH'
        && item.advisory === 'GHSA-G3HV-75WG-M249'
    )));
});

test('rejeita entrada de auditoria incompleta em vez de tratá-la como limpa', async () => {
    const policy = await import(POLICY_URL);
    const report = stylelintBracesReport();
    delete report.vulnerabilities.braces.nodes;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => (
        item.code === 'INVALID_AUDIT_ENTRY' && item.packageName === 'braces'
    )));
});

test('rejeita metadados de auditoria que não correspondem às vulnerabilidades recebidas', async () => {
    const policy = await import(POLICY_URL);
    const report = stylelintBracesReport();
    report.metadata.vulnerabilities.high = 5;
    report.metadata.vulnerabilities.total = 5;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => item.code === 'AUDIT_COUNT_MISMATCH'));
});

test('bloqueia a vulnerabilidade de uuid se ela reaparecer na árvore ExcelJS', async () => {
    const policy = await import(POLICY_URL);
    const report = allowedReport();
    report.vulnerabilities.uuid = entry(
        'uuid',
        [advisory('GHSA-w5hq-g745-h8pq', 'moderate')],
        ['exceljs'],
        { severity: 'moderate' }
    );
    report.vulnerabilities.exceljs.via.push('uuid');
    report.metadata.vulnerabilities.moderate = 1;
    report.metadata.vulnerabilities.total += 1;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => (
        item.code === 'NEW_ADVISORY'
        && item.advisory === 'GHSA-W5HQ-G745-H8PQ'
    )));
});

test('bloqueia advisory novo mesmo quando a severidade não é crítica', async () => {
    const policy = await import(POLICY_URL);
    const report = allowedReport();
    report.vulnerabilities['new-package'] = entry('new-package', [advisory('GHSA-aaaa-bbbb-cccc')], []);
    report.metadata.vulnerabilities.high += 1;
    report.metadata.vulnerabilities.total += 1;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => item.code === 'NEW_ADVISORY'));
});

test('bloqueia vulnerabilidade crítica independentemente do pacote ou advisory', async () => {
    const policy = await import(POLICY_URL);
    const report = allowedReport();
    report.vulnerabilities.exceljs = entry(
        'exceljs',
        [advisory('GHSA-mh99-v99m-4gvg')],
        [],
        { severity: 'critical', isDirect: true }
    );
    report.metadata.vulnerabilities.high -= 1;
    report.metadata.vulnerabilities.critical = 1;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => item.code === 'CRITICAL_VULNERABILITY'));
});

test('bloqueia o advisory conhecido quando aparece fora do caminho autorizado', async () => {
    const policy = await import(POLICY_URL);
    const report = allowedReport();
    report.vulnerabilities['unrelated-package'] = entry('unrelated-package', [advisory('GHSA-mh99-v99m-4gvg')], []);
    report.metadata.vulnerabilities.high += 1;
    report.metadata.vulnerabilities.total += 1;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => item.code === 'PACKAGE_OUTSIDE_ALLOWED_PATH'));
});

test('confere que o bundle versionado é idêntico ao distribuído pelo pacote', async () => {
    const policy = await import(POLICY_URL);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-exceljs-policy-'));
    fs.mkdirSync(path.join(root, 'node_modules/exceljs/dist'), { recursive: true });
    fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
    fs.writeFileSync(path.join(root, 'node_modules/exceljs/dist/exceljs.min.js'), 'bundle-oficial');
    fs.writeFileSync(path.join(root, 'vendor/exceljs.min.js'), 'bundle-oficial');

    assert.deepEqual(policy.verifyBundleIdentity(root), { bytes: 14 });

    fs.writeFileSync(path.join(root, 'vendor/exceljs.min.js'), 'bundle-alterado');
    assert.throws(() => policy.verifyBundleIdentity(root), /diverge do bundle oficial/);
});

test('bloqueia capacidades de Node e writer streaming no runtime do Excel SME', async () => {
    const policy = await import(POLICY_URL);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-exceljs-runtime-'));
    for (const relativePath of policy.RUNTIME_FILES) {
        const target = path.join(root, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, "'use strict';\n");
    }

    assert.deepEqual(policy.verifyRuntimeScope(root), { checkedFiles: policy.RUNTIME_FILES.length });

    fs.writeFileSync(path.join(root, policy.RUNTIME_FILES[0]), "const fs = require('node:fs');\n");
    assert.throws(() => policy.verifyRuntimeScope(root), /capacidades fora da exceção/);
});
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

function allowedReport() {
    return {
        auditReportVersion: 2,
        vulnerabilities: {
            'brace-expansion': {
                severity: 'high',
                isDirect: false,
                via: [advisory('GHSA-mh99-v99m-4gvg')]
            },
            minimatch: {
                severity: 'high',
                isDirect: false,
                via: ['brace-expansion']
            },
            glob: {
                severity: 'high',
                isDirect: false,
                via: ['minimatch']
            },
            'archiver-utils': {
                severity: 'high',
                isDirect: false,
                via: ['glob']
            },
            archiver: {
                severity: 'high',
                isDirect: false,
                via: ['archiver-utils']
            },
            'readdir-glob': {
                severity: 'high',
                isDirect: false,
                via: ['minimatch']
            },
            'zip-stream': {
                severity: 'high',
                isDirect: false,
                via: ['archiver-utils']
            },
            rimraf: {
                severity: 'high',
                isDirect: false,
                via: ['glob']
            },
            uuid: {
                severity: 'moderate',
                isDirect: false,
                via: [advisory('GHSA-w5hq-g745-h8pq', 'moderate')]
            },
            exceljs: {
                severity: 'high',
                isDirect: true,
                via: ['archiver', 'uuid']
            }
        },
        metadata: {
            vulnerabilities: { info: 0, low: 0, moderate: 1, high: 9, critical: 0, total: 10 }
        }
    };
}

test('aceita somente os dois advisories conhecidos nos caminhos transitivos documentados', async () => {
    const policy = await import(POLICY_URL);
    const result = policy.evaluateAuditReport(allowedReport());

    assert.equal(result.passed, true);
    assert.equal(result.counts.high, 9);
    assert.equal(result.counts.moderate, 1);
    assert.deepEqual(new Set(result.accepted.map(item => item.advisory)), new Set([
        'GHSA-mh99-v99m-4gvg'.toUpperCase(),
        'GHSA-w5hq-g745-h8pq'.toUpperCase()
    ]));
    assert.deepEqual(result.violations, []);
});

test('bloqueia advisory novo mesmo quando a severidade não é crítica', async () => {
    const policy = await import(POLICY_URL);
    const report = allowedReport();
    report.vulnerabilities['new-package'] = {
        severity: 'high',
        isDirect: false,
        via: [advisory('GHSA-aaaa-bbbb-cccc')]
    };
    report.metadata.vulnerabilities.high += 1;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => item.code === 'NEW_ADVISORY'));
});

test('bloqueia vulnerabilidade crítica independentemente do pacote ou advisory', async () => {
    const policy = await import(POLICY_URL);
    const report = allowedReport();
    report.vulnerabilities.exceljs = {
        severity: 'critical',
        isDirect: true,
        via: [advisory('GHSA-mh99-v99m-4gvg')]
    };
    report.metadata.vulnerabilities.critical = 1;

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => item.code === 'CRITICAL_VULNERABILITY'));
});

test('bloqueia o advisory conhecido quando aparece fora do caminho autorizado', async () => {
    const policy = await import(POLICY_URL);
    const report = allowedReport();
    report.vulnerabilities['unrelated-package'] = {
        severity: 'high',
        isDirect: false,
        via: [advisory('GHSA-mh99-v99m-4gvg')]
    };

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

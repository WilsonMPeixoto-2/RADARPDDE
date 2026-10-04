'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const POLICY_URL = pathToFileURL(
    path.resolve(__dirname, '../../scripts/check-exceljs-audit-policy.mjs')
).href;

function advisory(id) {
    return {
        source: 1119441,
        name: 'braces',
        dependency: 'braces',
        title: id,
        url: `https://github.com/advisories/${id}`,
        severity: 'high'
    };
}

test('pacote de nome permitido continua bloqueado se não alcançar a dependência direta aprovada', async () => {
    const policy = await import(POLICY_URL);
    const report = {
        auditReportVersion: 2,
        vulnerabilities: {
            braces: {
                severity: 'high',
                isDirect: false,
                via: [advisory('GHSA-vfj7-8cjw-p6xm')],
                effects: [],
                nodes: ['node_modules/unrelated-tool/node_modules/braces'],
                fixAvailable: false
            }
        },
        metadata: {
            vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 }
        }
    };

    const result = policy.evaluateAuditReport(report);

    assert.equal(result.passed, false, 'allow-list de nomes não basta sem caminho até Stylelint');
    assert.ok(result.violations.some(item => (
        item.code === 'PACKAGE_OUTSIDE_ALLOWED_PATH'
        && item.packageName === 'braces'
        && item.advisory === 'GHSA-VFJ7-8CJW-P6XM'
    )));
});

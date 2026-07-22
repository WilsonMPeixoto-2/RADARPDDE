'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('app.js', 'utf8');

function functionBody(name, nextName) {
    const start = source.indexOf(`function ${name}`);
    const end = nextName ? source.indexOf(`function ${nextName}`, start + 1) : source.length;
    assert.notEqual(start, -1, `função ${name} não encontrada`);
    return source.slice(start, end === -1 ? source.length : end);
}

test('ações operacionais legadas não chamam persist diretamente', () => {
    const consultation = functionBody('toggleConsEnviada', 'removerNotaRegistrada');
    const charge = functionBody('copyCobrancaText', 'openRedistributionModal');
    const report = functionBody('exportDataExcel', 'toggleTheme');
    const theme = functionBody('toggleTheme', 'updateThemeIcon');

    assert.doesNotMatch(consultation, /\bpersist\s*\(/);
    assert.match(consultation, /radarVerificationService\.setBonification/);
    assert.doesNotMatch(charge, /\bpersist\s*\(/);
    assert.match(charge, /radarPendencyService\.registerContact/);
    assert.doesNotMatch(report, /\bpersist\s*\(/);
    assert.match(report, /radarAuditService\.record/);
    assert.doesNotMatch(theme, /\bpersist\s*\(/);
    assert.match(theme, /radarAuditService\.record/);
});

test('app mantém apenas a definição de compatibilidade de persist', () => {
    const calls = [...source.matchAll(/\bpersist\s*\(/g)];
    assert.equal(calls.length, 1);
    assert.match(source.slice(Math.max(0, calls[0].index - 20), calls[0].index + 30), /function persist/);
});

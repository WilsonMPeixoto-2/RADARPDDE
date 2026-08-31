'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.resolve(__dirname, '../../src/integration/prontuario-operational-ux.js'),
    'utf8'
);
const appSource = fs.readFileSync(
    path.resolve(__dirname, '../../app.js'),
    'utf8'
);
const cssSource = fs.readFileSync(
    path.resolve(__dirname, '../../src/styles/prontuario-operational-ux.css'),
    'utf8'
);

test('extensão sinaliza competência futura e bloqueia apenas controles operacionais', () => {
    assert.match(source, /data-future-competence-notice/);
    assert.match(source, /futureCompetenceDisabled/);
    assert.match(source, /isFutureCompetence/);
});

test('extensão torna Correto indisponível quando a regra histórica exige atraso', () => {
    assert.match(source, /data-late-correct-required/);
    assert.match(source, /requiresLateCorrect/);
    assert.match(source, /option\[value="Correto"\]/);
});


test('extensão preserva a grade canônica da Consulta Assessoria', () => {
    assert.match(source, /legacyInvoiceCards/);
    assert.match(source, /!card\.classList\.contains\('invoice-document-row'\)/);
    assert.match(source, /findInvoiceCard\(legacyInvoiceCards/);
});


test('documentos regulares usam tipografia e ícones do layout atualizado', () => {
    assert.match(appSource, /verificationDocumentIconSvg/);
    assert.match(appSource, /class="verification-document-row/);
    assert.match(appSource, /class="verification-document-icon"/);
    assert.match(appSource, /verification-document-copy/);
    assert.match(cssSource, /\.verification-document-copy strong/);
    assert.match(cssSource, /font-family: var\(--font-heading\)/);
    assert.match(cssSource, /tr\.verification-document-row\.is-striped/);
});

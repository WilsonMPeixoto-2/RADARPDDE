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
const rootCssSource = fs.readFileSync(
    path.resolve(__dirname, '../../styles.css'),
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


test('dados da unidade usam grupos sem colisão com o CSS operacional legado', () => {
    assert.match(appSource, /class="school-info-card school-data-card"/);
    assert.match(appSource, /class="school-data-sections"/);
    assert.match(appSource, /class="school-data-fields"/);
    assert.match(appSource, /class="info-item school-data-item is-quarter"/);
    assert.match(appSource, /class="info-item school-data-item is-half"/);
    assert.match(appSource, /<dt class="info-label">/);
    assert.match(appSource, /<dd class="info-value">/);
    assert.match(appSource, />Dados da unidade</);
    assert.match(rootCssSource, /\.school-data-fields\s*\{[\s\S]*grid-template-columns: repeat\(12, minmax\(0, 1fr\)\)/);
    assert.match(rootCssSource, /\.school-data-fields \.school-data-item\.is-quarter\s*\{[\s\S]*grid-column: span 3/);
    assert.match(rootCssSource, /\.school-data-fields \.school-data-item\.is-half\s*\{[\s\S]*grid-column: span 6/);
    assert.doesNotMatch(cssSource, /\.school-sidebar > \.school-info-card:not\(\.school-programs-card\)/);
    assert.doesNotMatch(cssSource, /content:\s*['"]Dados da unidade['"]/);
});


test('ordem visual da avaliação prioriza PDDE Básico sem reordenar a fonte de dados', () => {
    assert.match(source, /function orderProgramGroupsForPresentation/);
    assert.match(source, /programId === 'BASIC' \? 0 : 1/);
    assert.match(source, /leftPriority - rightPriority \|\| left\.sourceIndex - right\.sourceIndex/);
    assert.match(source, /rowsContainer\.appendChild\(row\)/);
    assert.doesNotMatch(source, /programasIds\.sort\(/);
});

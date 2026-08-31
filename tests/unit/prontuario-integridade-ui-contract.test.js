'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.resolve(__dirname, '../../src/integration/prontuario-operational-ux.js'),
    'utf8'
);
const atomicSource = fs.readFileSync(
    path.resolve(__dirname, '../../src/integration/atomic-analysis-pendency.js'),
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

test('documentos padrão recebem composição tipográfica e ícones sem duplicar os painéis especiais', () => {
    assert.match(source, /STANDARD_DOCUMENT_META/);
    assert.match(source, /declBBAgil/);
    assert.match(source, /encampInventario/);
    assert.match(source, /prontuario-document-icon/);
    assert.match(source, /prontuario-document-title/);
    assert.doesNotMatch(source, /STANDARD_DOCUMENT_META[\s\S]*notaFiscal:/);
    assert.doesNotMatch(source, /STANDARD_DOCUMENT_META[\s\S]*consAssessoria:/);
});

test('observação de abertura mostra somente o achado técnico, sem metadado de persistência', () => {
    assert.match(atomicSource, /Identificado erro técnico na conferência de/);
    assert.doesNotMatch(atomicSource, /será gravada somente ao confirmar esta pendência/);
});

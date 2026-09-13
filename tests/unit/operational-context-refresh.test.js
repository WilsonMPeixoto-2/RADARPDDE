'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.join(__dirname, '../../src/integration/operational-context-refresh.js'),
    'utf8'
);

test('sessão remota atualiza somente a competência ativa ao voltar para a aba', () => {
    assert.match(source, /visibilitychange/);
    assert.match(source, /focus/);
    assert.match(source, /loadOperationalContext\(competenceKey/);
    assert.doesNotMatch(source, /setInterval\s*\(/);
    assert.doesNotMatch(source, /administrativeLogs/);
});

test('atualização contextual é limitada por janela mínima e rerenderiza somente após confirmação', () => {
    assert.match(source, /MIN_REFRESH_INTERVAL_MS/);
    assert.match(source, /await\s+service\.loadOperationalContext[\s\S]*refreshCurrentView/);
    assert.match(source, /refreshPromise/);
});

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const rootDir = path.resolve(__dirname, '../..');
const files = [
  'src/integration/invoice-history-lock.js',
  'src/integration/operational-write-performance.js',
  'src/integration/prontuario-conditional-reconciler.js'
];

function source(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

test('extensões finais do produto não fazem polling para descobrir application-services', () => {
  for (const relativePath of files) {
    const content = source(relativePath);
    assert.doesNotMatch(content, /setInterval\s*\(/, `${relativePath} ainda usa setInterval de readiness`);
    assert.match(
      content,
      /radar:application-services-ready/,
      `${relativePath} deve reagir ao marco determinístico de application-services`
    );
  }
});

test('as três extensões continuam tentando instalar imediatamente quando carregadas após os serviços', () => {
  for (const relativePath of files) {
    const content = source(relativePath);
    assert.match(content, /attemptInstall\(\)/, `${relativePath} perdeu a instalação imediata`);
  }
});

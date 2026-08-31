'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(
  path.resolve(__dirname, '../../src/styles/prontuario-operational-ux.css'),
  'utf8'
);

test('programas do Prontuário possuem separação visual entre blocos', () => {
  assert.match(css, /tr\.program-block-start:not\(:first-child\) > td/);
  assert.match(css, /border-top: 12px solid var\(--bg-page\)/);
});

test('resumo da unidade escolar usa composição compacta e responsiva', () => {
  assert.match(css, /\.school-grid \{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.school-sidebar \{[\s\S]*grid-template-columns: minmax\(0, 2\.1fr\) minmax\(260px, 0\.9fr\)/);
  assert.match(css, /Dados da unidade/);
  assert.match(css, /\.school-program-item::before/);
});

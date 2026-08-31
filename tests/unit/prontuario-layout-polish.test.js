'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(
  path.resolve(__dirname, '../../src/styles/prontuario-operational-ux.css'),
  'utf8'
);
const rootCss = fs.readFileSync(
  path.resolve(__dirname, '../../styles.css'),
  'utf8'
);

test('programas do Prontuário possuem separação visual entre blocos', () => {
  assert.match(css, /tr\.program-block-start:not\(:first-child\) > td/);
  assert.match(css, /border-top: 12px solid var\(--bg-page\)/);
});

test('resumo da unidade escolar usa composição compacta e responsiva', () => {
  assert.match(rootCss, /\.school-grid \{[\s\S]*display: block/);
  assert.match(rootCss, /\.school-sidebar \{[\s\S]*grid-template-columns: minmax\(0, 2\.25fr\) minmax\(280px, 0\.85fr\)/);
  assert.match(rootCss, /\.school-data-fields \{[\s\S]*grid-template-columns: repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(rootCss, /\.school-program-item::before/);
  assert.doesNotMatch(css, /\.school-sidebar > \.school-info-card:not\(\.school-programs-card\)/);
  assert.doesNotMatch(css, /content:\s*['"]Dados da unidade['"]/);
});

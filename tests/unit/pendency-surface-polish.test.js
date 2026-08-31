'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const pendencyPageSource = fs.readFileSync(
  path.join(root, 'src/integration/task-9-pendencias-page.js'),
  'utf8'
);
const rootCss = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const pendencyCss = fs.readFileSync(
  path.join(root, 'src/styles/task-9-pendencias.css'),
  'utf8'
);

test('modal de novo envio usa contexto estruturado e campos responsivos', () => {
  assert.match(indexSource, /corrective-submission-modal-content/);
  assert.match(indexSource, /corrective-submission-fields/);
  assert.match(rootCss, /#modal-registrar-envio \.pendency-context-summary dl/);
  assert.match(rootCss, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test('gerador de cobrança usa cartões e remove texto técnico interno', () => {
  assert.match(indexSource, /cobranca-modal-content/);
  assert.match(indexSource, /cobranca-pendency-list/);
  assert.match(appSource, /function sanitizePendencyPublicText/);
  assert.match(appSource, /será gravada somente ao confirmar esta pendência/);
  assert.match(appSource, /function isInternalTestPendency/);
  assert.match(appSource, /!isInternalTestPendency\(p\)/);
  assert.match(rootCss, /\.cobranca-pendency-option/);
  assert.match(rootCss, /#modal-cobranca \.cobranca-preview/);
});

test('drawer de pendências usa seções visuais e sanitiza observação', () => {
  assert.match(pendencyPageSource, /pendency-drawer-section is-context/);
  assert.match(pendencyPageSource, /root\.sanitizePendencyPublicText/);
  assert.match(pendencyCss, /Polimento visual do detalhe de Pendência/);
  assert.match(pendencyCss, /\.pendency-detail-grid > div/);
  assert.match(pendencyCss, /@media \(max-width: 900px\)[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

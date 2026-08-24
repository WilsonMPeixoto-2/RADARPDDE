const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const editorialStyles = fs.readFileSync(
  path.join(root, 'src/styles/editorial-premium-desktop.css'),
  'utf8'
);
const competenceStyles = fs.readFileSync(
  path.join(root, 'src/styles/global-competence-selector.css'),
  'utf8'
);

function block(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `Seletor não encontrado: ${selector}`);
  return match[1];
}

function pxValue(cssBlock, property) {
  const match = cssBlock.match(new RegExp(`${property}\\s*:\\s*([\\d.]+)(px|rem)`));
  assert.ok(match, `Propriedade não encontrada: ${property}`);
  const value = Number.parseFloat(match[1]);
  return match[2] === 'rem' ? value * 16 : value;
}

test('contrato editorial exige tipografia legível no dossiê e cobrança', () => {
  assert.ok(pxValue(block(editorialStyles, '.radar-info-section h3'), 'font-size') >= 16);
  assert.ok(pxValue(block(editorialStyles, '.radar-info-label'), 'font-size') >= 11.5);
  assert.ok(pxValue(block(editorialStyles, '.radar-info-value'), 'font-size') >= 16);
  assert.ok(pxValue(block(editorialStyles, '.cobranca-option-title'), 'font-size') >= 15);
  assert.ok(pxValue(block(editorialStyles, '.cobranca-option-detail'), 'font-size') >= 13.5);
  assert.ok(pxValue(block(editorialStyles, '.cobranca-preview-panel .cobranca-preview'), 'font-size') >= 16);
});

test('contrato editorial exige competência ativa dominante e faixa azul preservada', () => {
  assert.match(
    competenceStyles,
    /@import\s+url\(['"]\.\/editorial-premium-desktop\.css['"]\)\s+screen\s+and\s+\(min-width:\s*641px\)/,
    'A camada editorial precisa estar disponível a partir de 641px'
  );
  assert.ok(pxValue(block(competenceStyles, '.global-competence-control > label'), 'font-size') >= 12);
  assert.ok(pxValue(block(competenceStyles, '.global-competence-select'), 'font-size') >= 18);
  assert.match(block(competenceStyles, '.global-competence-control'), /border-left\s*:\s*6px\s+solid\s+#2563eb/i);
  assert.match(block(competenceStyles, '.global-competence-control'), /linear-gradient\([^;]*#4c1d95[^;]*#6d28d9/i);
  assert.ok(pxValue(block(editorialStyles, '.radar-context-label'), 'font-size') >= 12);
  assert.ok(pxValue(block(editorialStyles, '.radar-context-value'), 'font-size') >= 22);
});

test('dossiê usa blocos editoriais separados em vez de folha branca contínua', () => {
  assert.match(block(editorialStyles, '.school-dossier-sections'), /gap\s*:\s*1rem/);
  assert.match(block(editorialStyles, '.radar-info-section'), /border-radius\s*:\s*0\.9rem/);
  assert.match(block(editorialStyles, '.radar-info-field'), /border-left\s*:\s*3px\s+solid/);
  assert.match(block(editorialStyles, '.school-dossier-header'), /linear-gradient/);
});

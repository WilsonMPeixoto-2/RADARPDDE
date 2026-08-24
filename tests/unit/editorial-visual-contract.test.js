const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const competenceStyles = fs.readFileSync(path.join(root, 'src/styles/global-competence-selector.css'), 'utf8');

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
  assert.ok(pxValue(block(styles, '.radar-info-section h3'), 'font-size') >= 15);
  assert.ok(pxValue(block(styles, '.radar-info-label'), 'font-size') >= 12);
  assert.ok(pxValue(block(styles, '.radar-info-value'), 'font-size') >= 15);
  assert.ok(pxValue(block(styles, '.cobranca-option-title'), 'font-size') >= 14);
  assert.ok(pxValue(block(styles, '.cobranca-option-detail'), 'font-size') >= 13);
  assert.ok(pxValue(block(styles, '.cobranca-preview-panel .cobranca-preview'), 'font-size') >= 15);
});

test('contrato editorial exige competência ativa com peso visual superior', () => {
  const desktop = competenceStyles.match(/@media \(min-width: 901px\) \{([\s\S]*?)\n\}/);
  assert.ok(desktop, 'Bloco desktop de competência não encontrado');
  assert.ok(pxValue(block(desktop[1], '.global-competence-control > label'), 'font-size') >= 12);
  assert.ok(pxValue(block(desktop[1], '.global-competence-select'), 'font-size') >= 17);
  assert.ok(pxValue(block(styles, '.radar-context-label'), 'font-size') >= 12);
  assert.ok(pxValue(block(styles, '.radar-context-value'), 'font-size') >= 20);
});

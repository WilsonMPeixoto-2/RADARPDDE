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
const structuralScript = fs.readFileSync(
  path.join(root, 'src/integration/prontuario-structural-redesign.js'),
  'utf8'
);
const runtimeConfig = fs.readFileSync(path.join(root, 'config.js'), 'utf8');

function blocks(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...source.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))].map(match => match[1]);
}

function block(source, selector) {
  const matches = blocks(source, selector);
  assert.ok(matches.length > 0, `Seletor não encontrado: ${selector}`);
  return matches[0];
}

function pxValues(cssBlocks, property) {
  return cssBlocks.flatMap(cssBlock => {
    const values = [...cssBlock.matchAll(new RegExp(`${property}\\s*:\\s*([\\d.]+)(px|rem)`, 'g'))];
    return values.map(match => {
      const value = Number.parseFloat(match[1]);
      return match[2] === 'rem' ? value * 16 : value;
    });
  });
}

function maxPx(source, selector, property) {
  const values = pxValues(blocks(source, selector), property);
  assert.ok(values.length > 0, `Propriedade não encontrada: ${selector} -> ${property}`);
  return Math.max(...values);
}

test('competência ativa continua dominante no seletor global e não é duplicada na página', () => {
  assert.match(
    competenceStyles,
    /@import\s+url\(['"]\.\/editorial-premium-desktop\.css['"]\)\s+screen\s+and\s+\(min-width:\s*641px\)/,
    'A camada editorial precisa estar disponível a partir de 641px'
  );
  assert.ok(maxPx(competenceStyles, '.global-competence-control > label', 'font-size') >= 12);
  assert.ok(maxPx(competenceStyles, '.global-competence-select', 'font-size') >= 18);
  assert.match(competenceStyles, /border-left\s*:\s*6px\s+solid\s+#2563eb/i);
  assert.match(competenceStyles, /linear-gradient\(135deg,\s*#4c1d95[^;]*#6d28d9/i);
  assert.match(block(editorialStyles, '.radar-context-block'), /display\s*:\s*none\s*!important/);
});

test('resumo institucional é compacto e não usa mini-card por campo', () => {
  assert.match(block(editorialStyles, '.school-dossier-sections'), /grid-template-columns\s*:\s*repeat\(4/);
  assert.match(block(editorialStyles, '.radar-info-section'), /border-radius\s*:\s*0/);
  assert.match(block(editorialStyles, '.radar-info-section'), /box-shadow\s*:\s*none/);
  assert.match(block(editorialStyles, '.radar-info-field'), /border\s*:\s*0/);
  assert.match(block(editorialStyles, '.radar-info-field'), /border-radius\s*:\s*0/);
  assert.ok(maxPx(editorialStyles, '.radar-info-label', 'font-size') >= 11);
  assert.ok(maxPx(editorialStyles, '.radar-info-value', 'font-size') >= 15);
  assert.match(block(editorialStyles, '.school-dossier-header'), /background\s*:\s*linear-gradient/);
});

test('acompanhamento mensal deixa de depender da tabela monolítica', () => {
  assert.match(runtimeConfig, /loadScript\('src\/integration\/prontuario-structural-redesign\.js',\s*false\)/);
  assert.match(structuralScript, /radar-program-review-stack/);
  assert.match(structuralScript, /metaCell\.remove\(\)/);
  assert.match(structuralScript, /sourceWrapper\.replaceWith\(stack\)/);
  assert.match(block(editorialStyles, '.radar-program-review-stack'), /display\s*:\s*grid/);
  assert.match(block(editorialStyles, '.radar-program-review'), /border-radius\s*:\s*0\.95rem/);
  assert.match(editorialStyles, /@media\s*\(min-width:\s*641px\)\s*and\s*\(max-width:\s*980px\)[\s\S]*?\.radar-program-review-row\s*\{[\s\S]*?display\s*:\s*grid/);
});

test('modal de cobrança mantém tipografia de leitura confortável', () => {
  assert.ok(maxPx(editorialStyles, '.cobranca-option-title', 'font-size') >= 15);
  assert.ok(maxPx(editorialStyles, '.cobranca-option-detail', 'font-size') >= 13.5);
  assert.ok(maxPx(editorialStyles, '.cobranca-preview-panel .cobranca-preview', 'font-size') >= 16);
});
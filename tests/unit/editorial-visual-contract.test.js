const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const editorialStyles = fs.readFileSync(
  path.join(root, 'src/styles/editorial-premium-desktop.css'),
  'utf8'
);
const structuralStyles = fs.readFileSync(
  path.join(root, 'src/styles/prontuario-structural-v4.css'),
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
    /@import\s+url\(['"]\.\/prontuario-structural-v4\.css['"]\)\s+screen\s+and\s+\(min-width:\s*641px\)/,
    'A camada estrutural v4 precisa ser carregada depois da camada editorial'
  );
  assert.ok(maxPx(competenceStyles, '.global-competence-control > label', 'font-size') >= 12);
  assert.ok(maxPx(competenceStyles, '.global-competence-select', 'font-size') >= 18);
  assert.match(competenceStyles, /border-left\s*:\s*6px\s+solid\s+#2563eb/i);
  assert.match(competenceStyles, /linear-gradient\(135deg,\s*#4c1d95[^;]*#6d28d9/i);
  assert.match(block(editorialStyles, '.radar-context-block'), /display\s*:\s*none\s*!important/);
});

test('ficha institucional usa pares campo e valor em vez de mini-cards', () => {
  assert.match(block(structuralStyles, '.radar-school-summary-v4 .school-dossier-sections'), /grid-template-columns\s*:\s*repeat\(2/);
  assert.match(block(structuralStyles, '.radar-school-summary-v4 .radar-info-field'), /display\s*:\s*grid/);
  assert.match(block(structuralStyles, '.radar-school-summary-v4 .radar-info-field'), /grid-template-columns\s*:\s*minmax\(7\.8rem/);
  assert.match(block(structuralStyles, '.radar-school-summary-v4 .radar-info-field'), /border-radius\s*:\s*0\s*!important/);
  assert.match(block(structuralStyles, '.radar-school-summary-v4 .radar-info-section'), /box-shadow\s*:\s*none\s*!important/);
  assert.ok(maxPx(structuralStyles, '.radar-school-summary-v4 .radar-info-label', 'font-size') >= 11);
  assert.ok(maxPx(structuralStyles, '.radar-school-summary-v4 .radar-info-value', 'font-size') >= 15);
});

test('prontuário muda a leitura sem mover as linhas e controles do tbody original', () => {
  assert.match(runtimeConfig, /loadScript\('src\/integration\/prontuario-structural-redesign\.js',\s*false\)/);
  assert.match(structuralScript, /radar-program-ledger-v4/);
  assert.match(structuralScript, /radar-program-row-v4--first/);
  assert.match(structuralScript, /radar-program-meta-v4/);
  assert.doesNotMatch(structuralScript, /metaCell\.remove\s*\(/);
  assert.doesNotMatch(structuralScript, /appendChild\(row\)/);
  assert.doesNotMatch(structuralScript, /replaceWith\(stack\)/);
  assert.match(block(structuralStyles, '#tab-verificacoes .radar-program-row-v4'), /display\s*:\s*grid/);
  assert.match(block(structuralStyles, '#tab-verificacoes .radar-program-meta-v4'), /grid-column\s*:\s*1\s*\/\s*-1/);
  assert.match(structuralStyles, /@media\s*\(min-width:\s*641px\)\s*and\s*\(max-width:\s*1050px\)[\s\S]*?#tab-verificacoes \.radar-program-row-v4\s*\{[\s\S]*?grid-template-columns\s*:\s*repeat\(2/);
});

test('modal de cobrança mantém tipografia de leitura confortável', () => {
  assert.ok(maxPx(editorialStyles, '.cobranca-option-title', 'font-size') >= 15);
  assert.ok(maxPx(editorialStyles, '.cobranca-option-detail', 'font-size') >= 13.5);
  assert.ok(maxPx(editorialStyles, '.cobranca-preview-panel .cobranca-preview', 'font-size') >= 16);
});
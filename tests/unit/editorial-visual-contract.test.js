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

test('contrato editorial exige tipografia legível no dossiê e cobrança', () => {
  assert.ok(maxPx(editorialStyles, '.radar-info-section h3', 'font-size') >= 16);
  assert.ok(maxPx(editorialStyles, '.radar-info-label', 'font-size') >= 11.5);
  assert.ok(maxPx(editorialStyles, '.radar-info-value', 'font-size') >= 16);
  assert.ok(maxPx(editorialStyles, '.cobranca-option-title', 'font-size') >= 15);
  assert.ok(maxPx(editorialStyles, '.cobranca-option-detail', 'font-size') >= 13.5);
  assert.ok(maxPx(editorialStyles, '.cobranca-preview-panel .cobranca-preview', 'font-size') >= 16);
});

test('contrato editorial exige competência ativa dominante e faixa azul preservada', () => {
  assert.match(
    competenceStyles,
    /@import\s+url\(['"]\.\/editorial-premium-desktop\.css['"]\)\s+screen\s+and\s+\(min-width:\s*641px\)/,
    'A camada editorial precisa estar disponível a partir de 641px'
  );
  assert.ok(maxPx(competenceStyles, '.global-competence-control > label', 'font-size') >= 12);
  assert.ok(maxPx(competenceStyles, '.global-competence-select', 'font-size') >= 18);
  assert.match(competenceStyles, /border-left\s*:\s*6px\s+solid\s+#2563eb/i);
  assert.match(competenceStyles, /linear-gradient\(135deg,\s*#4c1d95[^;]*#6d28d9/i);
  assert.ok(maxPx(editorialStyles, '.radar-context-label', 'font-size') >= 12);
  assert.ok(maxPx(editorialStyles, '.radar-context-value', 'font-size') >= 22);
});

test('dossiê usa blocos editoriais separados em vez de folha branca contínua', () => {
  assert.match(block(editorialStyles, '.school-dossier-sections'), /gap\s*:\s*1rem/);
  assert.match(block(editorialStyles, '.radar-info-section'), /border-radius\s*:\s*0\.9rem/);
  assert.match(block(editorialStyles, '.radar-info-field'), /border-left\s*:\s*3px\s+solid/);
  assert.match(block(editorialStyles, '.school-dossier-header'), /linear-gradient/);
});

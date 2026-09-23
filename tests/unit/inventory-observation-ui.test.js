'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('Painel de Inventário oferece observação independente da conclusão da inventariação', () => {
    assert.match(app, /openInventoryObservationModal\(['"]?\$\{escapeHtml\(b\.id\)\}/);
    assert.match(app, /Adicionar observação|Editar observação/);
    assert.match(app, /field:\s*['"]observacoes['"]/);
    assert.match(app, /radarInventoryService\.updateAsset\(/);
    assert.match(html, /id=["']modal-inventory-observation["']/);
    assert.match(html, /id=["']inventory-observation-text["']/);
    assert.match(html, /Salvar observação/);
});

test('observação permanece visível no item sem depender do status Inventariada', () => {
    assert.match(app, /inventory-item-observation/);
    assert.match(app, /b\.observacoes/);
});

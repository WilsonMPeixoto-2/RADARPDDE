'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const templateRenderer = require('../../src/domain/excel-sme-template-renderer.js');
const compatibilityRenderer = require('../../src/domain/excel-sme-monthly-renderer.js');

test('mantém o nome legado do renderer apontando para o motor ExcelJS do template', () => {
    assert.equal(compatibilityRenderer.VERSION, '2.0.0');
    assert.equal(compatibilityRenderer.renderWorkbook, templateRenderer.renderWorkbook);
    assert.equal(compatibilityRenderer.downloadWorkbook, templateRenderer.downloadWorkbook);
    assert.equal(compatibilityRenderer.buildWorkbook, templateRenderer.buildWorkbook);
});

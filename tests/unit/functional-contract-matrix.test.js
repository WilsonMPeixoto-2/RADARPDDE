'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/check-functional-contract-matrix.mjs');
const GENERATED = path.join(ROOT, 'docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md');

async function api() {
    return import(pathToFileURL(SCRIPT).href);
}

function clone(value) {
    return structuredClone(value);
}

test('a matriz funcional canônica é válida', async () => {
    const { loadMatrix, validateMatrix } = await api();
    const matrix = loadMatrix(ROOT);
    assert.deepEqual(validateMatrix(matrix, ROOT), []);
    assert.equal(matrix.operations.length, 43);
});

test('IDs duplicados são rejeitados', async () => {
    const { loadMatrix, validateMatrix } = await api();
    const matrix = clone(loadMatrix(ROOT));
    matrix.operations[1].id = matrix.operations[0].id;
    const findings = validateMatrix(matrix, ROOT);
    assert.ok(findings.some(item => item.includes('ID duplicado')));
});

test('perfil desconhecido é rejeitado', async () => {
    const { loadMatrix, validateMatrix } = await api();
    const matrix = clone(loadMatrix(ROOT));
    matrix.operations[0].allow = ['perfil-inexistente'];
    const findings = validateMatrix(matrix, ROOT);
    assert.ok(findings.some(item => item.includes('perfil desconhecido')));
});

test('arquivo de âncora inexistente é rejeitado', async () => {
    const { loadMatrix, validateMatrix } = await api();
    const matrix = clone(loadMatrix(ROOT));
    matrix.operations[0].anchors = [['src/inexistente.js', '']];
    const findings = validateMatrix(matrix, ROOT);
    assert.ok(findings.some(item => item.includes('arquivo de âncora ausente')));
});

test('Markdown gerado é determinístico e corresponde ao arquivo versionado', async () => {
    const { loadMatrix, renderMarkdown } = await api();
    const matrix = loadMatrix(ROOT);
    const first = renderMarkdown(matrix);
    const second = renderMarkdown(matrix);
    assert.equal(first, second);
    assert.equal(fs.readFileSync(GENERATED, 'utf8'), first);
});

test('mutação P0 sem releitura após refresh é rejeitada', async () => {
    const { loadMatrix, validateMatrix } = await api();
    const matrix = clone(loadMatrix(ROOT));
    const operation = matrix.operations.find(item => item.mode === 'write' && item.criticality === 'P0');
    assert.ok(operation);
    operation.reload = false;
    const findings = validateMatrix(matrix, ROOT);
    assert.ok(findings.some(item => item.includes('deve exigir releitura após refresh')));
});

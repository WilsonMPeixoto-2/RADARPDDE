'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const manifest = require('../docs/reference/excel-approved-v1.json');

const referencePath = path.join(
    __dirname,
    '..',
    'docs',
    'reference',
    manifest.file
);

function calculateSha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

test('mantém disponível a referência Excel aprovada', () => {
    assert.equal(fs.existsSync(referencePath), true);
});

test('bloqueia qualquer alteração binária não aprovada na referência', () => {
    const buffer = fs.readFileSync(referencePath);

    assert.equal(buffer.length, manifest.sizeBytes);
    assert.equal(calculateSha256(buffer), manifest.sha256);
});

test('confirma que o arquivo é um pacote XLSX e preserva seus componentes principais', () => {
    const buffer = fs.readFileSync(referencePath);
    const packageIndex = buffer.toString('latin1');

    assert.equal(buffer.subarray(0, 2).toString('ascii'), 'PK');

    [
        'xl/workbook.xml',
        'xl/styles.xml',
        'xl/worksheets/sheet1.xml',
        'xl/worksheets/sheet2.xml',
        'xl/worksheets/sheet3.xml',
        'xl/worksheets/sheet4.xml',
        'xl/tables/table1.xml',
        'xl/tables/table2.xml',
        'xl/drawings/charts/chart1.xml'
    ].forEach(entry => {
        assert.equal(
            packageIndex.includes(entry),
            true,
            `Componente ausente no pacote aprovado: ${entry}`
        );
    });
});

test('registra a estrutura funcional aprovada sem promover dados demonstrativos a dados oficiais', () => {
    assert.deepEqual(manifest.sheetOrder, [
        'BONIFICACOES',
        'SINTESE',
        'QUALIDADE_DADOS',
        'METADADOS'
    ]);
    assert.equal(manifest.requiredSheet, 'BONIFICACOES');
    assert.equal(manifest.baseHeaderRow, 8);
    assert.equal(manifest.baseFirstDataRow, 9);
    assert.equal(manifest.originalFieldCount, 12);
    assert.equal(manifest.containsDemonstrationData, true);
    assert.equal(manifest.runtimeTemplate, false);
});

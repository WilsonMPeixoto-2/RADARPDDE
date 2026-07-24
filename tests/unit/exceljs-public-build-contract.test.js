'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('carregador publica ExcelJS antes do modelo e renderer SME', () => {
    const source = read('src/integration/load-excel-export.js');

    assert.match(source, /vendor\/exceljs\.min\.js/);
    assert.match(source, /node_modules\/exceljs\/dist\/exceljs\.min\.js/);
    assert.ok(source.indexOf('await loadExcelJs()') < source.indexOf('for (const src of smeScripts)'));
    assert.ok(source.indexOf('excel-sme-export-model.js') < source.indexOf('excel-sme-monthly-renderer.js'));
    assert.ok(source.indexOf('excel-sme-monthly-renderer.js') < source.indexOf('excel-export-integration.js'));
});

test('build Vercel executa a cópia do bundle de navegador do ExcelJS', () => {
    const packageJson = JSON.parse(read('package.json'));

    assert.match(packageJson.scripts['build:vercel'], /copy-exceljs-public\.mjs/);
    assert.match(packageJson.scripts.check, /excel-sme-export-model\.js/);
    assert.match(packageJson.scripts.check, /excel-sme-monthly-renderer\.js/);
    assert.match(packageJson.scripts.check, /copy-exceljs-public\.mjs/);
});

test('copiador publica o bundle no diretório vendor do artefato', async () => {
    const temporaryRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'radar-exceljs-copy-'));
    const sourceDir = path.join(temporaryRoot, 'node_modules', 'exceljs', 'dist');
    const outputDir = path.join(temporaryRoot, 'dist');
    await fsp.mkdir(sourceDir, { recursive: true });
    await fsp.writeFile(path.join(sourceDir, 'exceljs.min.js'), 'window.ExcelJS={Workbook:function(){}};', 'utf8');

    const moduleUrl = pathToFileURL(path.join(root, 'scripts/copy-exceljs-public.mjs')).href;
    const { copyExcelJsBrowserBundle } = await import(moduleUrl);
    const result = await copyExcelJsBrowserBundle({ rootDir: temporaryRoot, outputDir });

    assert.equal(
        await fsp.readFile(path.join(outputDir, 'vendor', 'exceljs.min.js'), 'utf8'),
        'window.ExcelJS={Workbook:function(){}};'
    );
    assert.ok(result.size > 0);
    await fsp.rm(temporaryRoot, { recursive: true, force: true });
});

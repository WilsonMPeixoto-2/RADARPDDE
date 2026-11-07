'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
    return JSON.parse(read(relativePath));
}

test('mantÃ©m o renderer institucional interno e fixa ExcelJS somente para o produto SME', () => {
    const packageJson = readJson('package.json');
    const lockfile = read('package-lock.json');
    const initialLoader = read('src/integration/load-excel-export.js');
    const runtimeLoader = read('src/integration/excel-sme-runtime-loader.js');

    assert.equal(packageJson.dependencies?.exceljs, '4.4.0');
    assert.match(lockfile, /"node_modules\/exceljs"/);
    assert.equal(fs.existsSync(path.join(ROOT, 'vendor/exceljs.min.js')), true);
    assert.doesNotMatch(initialLoader, /vendor\/exceljs\.min\.js/);
    assert.match(runtimeLoader, /\/vendor\/exceljs\.min\.js/);
    assert.doesNotMatch(lockfile, /"node_modules\/@lhci\/cli"/);
    assert.equal(packageJson.devDependencies.prettier, '3.9.10');
    assert.equal(packageJson.scripts.format, 'prettier . --write --ignore-unknown');
    assert.equal(packageJson.scripts['format:check'], 'prettier . --check --ignore-unknown');
    const prettierIgnore = read('.prettierignore');
    assert.match(prettierIgnore, /^vendor\/$/m);
    assert.equal(pac¶»§q«^
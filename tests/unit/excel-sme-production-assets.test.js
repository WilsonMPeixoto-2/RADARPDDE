'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const TEMPLATE = fs.readFileSync(path.resolve(
    __dirname,
    '../../assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx'
));
const EXCELJS = Buffer.from('window.ExcelJS={Workbook:function Workbook(){}};', 'utf8');
const COMMIT = 'a'.repeat(40);

function descriptor(assetPath, buffer) {
    return {
        path: assetPath,
        bytes: buffer.length,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex')
    };
}

function responseJson(value, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: { get: () => 'application/json; charset=utf-8' },
        async json() { return value; }
    };
}

function responseBuffer(buffer, contentType, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: { get: name => name === 'content-type' ? contentType : null },
        async arrayBuffer() {
            return buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength
            );
        }
    };
}

function validManifest() {
    return {
        schemaVersion: 1,
        template: descriptor('/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx', TEMPLATE),
        exceljs: descriptor('/vendor/exceljs.min.js', EXCELJS)
    };
}

function fetchFor(manifest = validManifest(), template = TEMPLATE) {
    return async urlValue => {
        const url = new URL(urlValue);
        if (url.pathname === '/radar-build-manifest.json') {
            return responseJson({ commitSha: COMMIT });
        }
        if (url.pathname === '/excel-sme-assets.json') {
            return responseJson(manifest);
        }
        if (url.pathname === '/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx') {
            return responseBuffer(
                template,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
        }
        if (url.pathname === '/vendor/exceljs.min.js') {
            return responseBuffer(EXCELJS, 'application/javascript; charset=utf-8');
        }
        return responseJson({}, 404);
    };
}

test('valida commit, hashes, tamanhos, ExcelJS e estrutura OOXML publicados', async () => {
    const { verifyExcelSmeProductionAssets } = await import(
        '../../scripts/verify-excel-sme-production-assets.mjs'
    );

    const result = await verifyExcelSmeProductionAssets({
        baseUrl: 'https://radar.example/',
        expectedCommitSha: COMMIT,
        fetchImpl: fetchFor()
    });

    assert.equal(result.commitSha, COMMIT);
    assert.equal(result.template.bytes, TEMPLATE.length);
    assert.equal(result.template.worksheetCount > 0, true);
    assert.equal(result.exceljs.bytes, EXCELJS.length);
});

test('bloqueia bytes publicados que divergem do manifesto', async () => {
    const { verifyExcelSmeProductionAssets } = await import(
        '../../scripts/verify-excel-sme-production-assets.mjs'
    );
    const changedTemplate = Buffer.concat([TEMPLATE, Buffer.from([0])]);

    await assert.rejects(
        verifyExcelSmeProductionAssets({
            baseUrl: 'https://radar.example/',
            expectedCommitSha: COMMIT,
            fetchImpl: fetchFor(validManifest(), changedTemplate)
        }),
        error => error?.code === 'SME_PRODUCTION_ASSET_MISMATCH'
    );
});

test('bloqueia deployment de commit diferente do esperado', async () => {
    const { verifyExcelSmeProductionAssets } = await import(
        '../../scripts/verify-excel-sme-production-assets.mjs'
    );
    const fetchImpl = async urlValue => {
        const url = new URL(urlValue);
        if (url.pathname === '/radar-build-manifest.json') {
            return responseJson({ commitSha: 'b'.repeat(40) });
        }
        throw new Error('não deveria solicitar outros assets');
    };

    await assert.rejects(
        verifyExcelSmeProductionAssets({
            baseUrl: 'https://radar.example/',
            expectedCommitSha: COMMIT,
            fetchImpl
        }),
        error => error?.code === 'SME_PRODUCTION_COMMIT_MISMATCH'
    );
});

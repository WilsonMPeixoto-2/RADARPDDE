'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const loaderApi = require('../../src/integration/excel-sme-runtime-loader.js');

const TEMPLATE = path.resolve(
    __dirname,
    '../../assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx'
);

function templateResponse() {
    const template = fs.readFileSync(TEMPLATE);
    return {
        ok: true,
        status: 200,
        async arrayBuffer() {
            return template.buffer.slice(
                template.byteOffset,
                template.byteOffset + template.byteLength
            );
        }
    };
}

test('usa SHA do manifesto para versionar ExcelJS e template', async () => {
    const ExcelJS = require('exceljs');
    const requests = [];
    const scripts = [];
    const root = {
        location: { href: 'https://radar.example/' }
    };
    const loader = loaderApi.createRuntimeLoader({
        root,
        document: {},
        useAssetManifest: true,
        loadScript: async (src, target) => {
            scripts.push(src);
            target.ExcelJS = ExcelJS;
        },
        fetch: async (url, options) => {
            requests.push({ url, options });
            if (url === '/excel-sme-assets.json') {
                return {
                    ok: true,
                    status: 200,
                    async json() {
                        return {
                            schemaVersion: 1,
                            template: {
                                path: '/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx',
                                bytes: 123,
                                sha256: 'a'.repeat(64)
                            },
                            exceljs: {
                                path: '/vendor/exceljs.min.js',
                                bytes: 456,
                                sha256: 'b'.repeat(64)
                            }
                        };
                    }
                };
            }
            return templateResponse();
        }
    });

    const runtime = await loader.loadExcelSmeRuntime();

    assert.deepEqual(scripts, [`/vendor/exceljs.min.js?v=${'b'.repeat(16)}`]);
    assert.equal(requests[0].url, '/excel-sme-assets.json');
    assert.equal(requests[0].options.cache, 'no-store');
    assert.equal(
        requests[1].url,
        `/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx?v=${'a'.repeat(16)}`
    );
    assert.equal(runtime.assetManifest.template.sha256, 'a'.repeat(64));
    assert.equal(runtime.assetManifest.exceljs.sha256, 'b'.repeat(64));
});

test('mantém fallback compatível quando manifesto não existe em desenvolvimento local', async () => {
    const ExcelJS = require('exceljs');
    const root = { ExcelJS, location: { href: 'http://localhost:4175/' } };
    const requests = [];
    const loader = loaderApi.createRuntimeLoader({
        root,
        document: {},
        useAssetManifest: true,
        fetch: async url => {
            requests.push(url);
            if (url === '/excel-sme-assets.json') {
                return { ok: false, status: 404 };
            }
            return templateResponse();
        }
    });

    const runtime = await loader.loadExcelSmeRuntime();

    assert.equal(requests[0], '/excel-sme-assets.json');
    assert.match(requests[1], /^\/assets\/templates\/CRE_04_CONTROLE_ONEDRIVE2026\.xlsx\?v=/);
    assert.equal(runtime.assetManifest, null);
});

test('rejeita manifesto publicado com contrato inválido', async () => {
    const ExcelJS = require('exceljs');
    const root = { ExcelJS, location: { href: 'https://radar.example/' } };
    const loader = loaderApi.createRuntimeLoader({
        root,
        document: {},
        useAssetManifest: true,
        fetch: async () => ({
            ok: true,
            status: 200,
            async json() {
                return { schemaVersion: 1, template: {}, exceljs: {} };
            }
        })
    });

    await assert.rejects(
        loader.loadExcelSmeRuntime(),
        error => error?.code === 'SME_ASSET_MANIFEST_INVALID'
    );
});

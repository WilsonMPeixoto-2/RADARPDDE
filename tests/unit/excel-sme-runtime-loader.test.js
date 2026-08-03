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

test('não carrega biblioteca nem template antes da solicitação de exportação', () => {
    let scriptCalls = 0;
    let fetchCalls = 0;
    const root = {};
    loaderApi.createRuntimeLoader({
        root,
        loadScript: async () => { scriptCalls += 1; },
        fetch: async () => { fetchCalls += 1; }
    });

    assert.equal(scriptCalls, 0);
    assert.equal(fetchCalls, 0);
    assert.equal(root.ExcelJS, undefined);
});

test('carrega ExcelJS e template uma única vez sem reutilizar cache HTTP obsoleto', async () => {
    let scriptCalls = 0;
    let fetchCalls = 0;
    const template = fs.readFileSync(TEMPLATE);
    const ExcelJS = require('exceljs');
    const root = {};
    const loader = loaderApi.createRuntimeLoader({
        root,
        loadScript: async (src, target) => {
            scriptCalls += 1;
            assert.equal(src, '/vendor/exceljs.min.js');
            target.ExcelJS = ExcelJS;
        },
        fetch: async (url, options) => {
            fetchCalls += 1;
            assert.match(url, /^\/assets\/templates\/CRE_04_CONTROLE_ONEDRIVE2026\.xlsx\?v=/);
            assert.equal(options.cache, 'no-store');
            assert.equal(options.credentials, 'same-origin');
            return {
                ok: true,
                async arrayBuffer() {
                    return template.buffer.slice(
                        template.byteOffset,
                        template.byteOffset + template.byteLength
                    );
                }
            };
        }
    });

    const [first, second] = await Promise.all([
        loader.loadExcelSmeRuntime(),
        loader.loadExcelSmeRuntime()
    ]);

    assert.equal(scriptCalls, 1);
    assert.equal(fetchCalls, 1);
    assert.equal(first.ExcelJS, ExcelJS);
    assert.equal(second.ExcelJS, ExcelJS);
    assert.notEqual(first.templateBytes, second.templateBytes);
    assert.deepEqual(first.templateBytes, second.templateBytes);
    assert.deepEqual(Array.from(first.templateBytes.slice(0, 4)), [0x50, 0x4B, 0x03, 0x04]);
});

test('repete o carregamento com parâmetro único após resposta HTTP inválida', async () => {
    const template = fs.readFileSync(TEMPLATE);
    const ExcelJS = require('exceljs');
    const requests = [];
    const root = { ExcelJS };
    const loader = loaderApi.createRuntimeLoader({
        root,
        now: () => 123456,
        fetch: async url => {
            requests.push(url);
            if (requests.length === 1) {
                return {
                    ok: false,
                    status: 404,
                    async arrayBuffer() { return new ArrayBuffer(0); }
                };
            }
            return {
                ok: true,
                async arrayBuffer() {
                    return template.buffer.slice(
                        template.byteOffset,
                        template.byteOffset + template.byteLength
                    );
                }
            };
        }
    });

    const runtime = await loader.loadExcelSmeRuntime();

    assert.equal(requests.length, 2);
    assert.match(requests[1], /retry=123456/);
    assert.deepEqual(Array.from(runtime.templateBytes.slice(0, 4)), [0x50, 0x4B, 0x03, 0x04]);
});

test('rejeita resposta 200 que não contenha um arquivo XLSX', async () => {
    const ExcelJS = require('exceljs');
    const root = { ExcelJS };
    const html = Uint8Array.from([0x3C, 0x68, 0x74, 0x6D, 0x6C]);
    const loader = loaderApi.createRuntimeLoader({
        root,
        fetch: async () => ({
            ok: true,
            async arrayBuffer() {
                return html.buffer.slice(html.byteOffset, html.byteOffset + html.byteLength);
            }
        })
    });

    await assert.rejects(
        loader.loadExcelSmeRuntime(),
        /não é um arquivo XLSX válido/
    );
});

test('libera nova tentativa após uma falha transitória', async () => {
    let scriptCalls = 0;
    const ExcelJS = require('exceljs');
    const template = fs.readFileSync(TEMPLATE);
    const root = {};
    const loader = loaderApi.createRuntimeLoader({
        root,
        loadScript: async (_src, target) => {
            scriptCalls += 1;
            if (scriptCalls === 1) throw new Error('falha transitória');
            target.ExcelJS = ExcelJS;
        },
        fetch: async () => ({
            ok: true,
            async arrayBuffer() {
                return template.buffer.slice(template.byteOffset, template.byteOffset + template.byteLength);
            }
        })
    });

    await assert.rejects(loader.loadExcelSmeRuntime(), /falha transitória/);
    const runtime = await loader.loadExcelSmeRuntime();

    assert.equal(scriptCalls, 2);
    assert.equal(runtime.ExcelJS, ExcelJS);
});

test('o carregador inicial não inclui o bundle pesado do ExcelJS', () => {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../src/integration/load-excel-export.js'),
        'utf8'
    );

    assert.doesNotMatch(source, /vendor\/exceljs\.min\.js/);
});

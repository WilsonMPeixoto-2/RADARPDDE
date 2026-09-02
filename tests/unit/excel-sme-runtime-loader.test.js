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

function templateArrayBuffer() {
    const template = fs.readFileSync(TEMPLATE);
    return template.buffer.slice(
        template.byteOffset,
        template.byteOffset + template.byteLength
    );
}

function successfulTemplateResponse() {
    return {
        ok: true,
        status: 200,
        async arrayBuffer() {
            return templateArrayBuffer();
        }
    };
}

function createFakeDocument(onAppend) {
    let currentScript = null;

    function createScript() {
        const listeners = new Map();
        return {
            dataset: {},
            parentNode: null,
            addEventListener(type, handler) {
                const bucket = listeners.get(type) || new Set();
                bucket.add(handler);
                listeners.set(type, bucket);
            },
            removeEventListener(type, handler) {
                listeners.get(type)?.delete(handler);
            },
            dispatch(type) {
                [...(listeners.get(type) || [])].forEach(handler => handler());
            },
            remove() {
                if (currentScript === this) currentScript = null;
                this.parentNode = null;
            }
        };
    }

    const head = {
        appendChild(script) {
            currentScript = script;
            script.parentNode = head;
            onAppend(script);
            return script;
        },
        removeChild(script) {
            script.remove();
        }
    };

    return {
        head,
        createElement(tagName) {
            assert.equal(tagName, 'script');
            return createScript();
        },
        querySelector(selector) {
            assert.match(selector, /data-radar-excel-runtime/);
            return currentScript;
        },
        get currentScript() {
            return currentScript;
        }
    };
}

function rejectAfter(milliseconds, code = 'TEST_TIMEOUT') {
    return new Promise((_, reject) => {
        setTimeout(() => {
            const error = new Error('A operação de teste não foi concluída.');
            error.code = code;
            reject(error);
        }, milliseconds);
    });
}

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
            return successfulTemplateResponse();
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
            return successfulTemplateResponse();
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
        error => error?.code === 'SME_TEMPLATE_INVALID'
    );
});

test('libera nova tentativa após uma falha transitória do carregador injetado', async () => {
    let scriptCalls = 0;
    const ExcelJS = require('exceljs');
    const root = {};
    const loader = loaderApi.createRuntimeLoader({
        root,
        loadScript: async (_src, target) => {
            scriptCalls += 1;
            if (scriptCalls === 1) throw new Error('falha transitória');
            target.ExcelJS = ExcelJS;
        },
        fetch: async () => successfulTemplateResponse()
    });

    await assert.rejects(
        loader.loadExcelSmeRuntime(),
        error => error?.code === 'SME_EXCELJS_LOAD_FAILED'
    );
    const runtime = await loader.loadExcelSmeRuntime();

    assert.equal(scriptCalls, 2);
    assert.equal(runtime.ExcelJS, ExcelJS);
});

test('remove o script que falhou no DOM e cria um novo na tentativa seguinte', async () => {
    const ExcelJS = require('exceljs');
    const root = {};
    let appendCalls = 0;
    const document = createFakeDocument(script => {
        appendCalls += 1;
        queueMicrotask(() => {
            if (appendCalls === 1) {
                script.dispatch('error');
                return;
            }
            root.ExcelJS = ExcelJS;
            script.dispatch('load');
        });
    });
    root.document = document;

    const loader = loaderApi.createRuntimeLoader({
        root,
        document,
        timeoutMs: 30,
        fetch: async () => successfulTemplateResponse()
    });

    await assert.rejects(
        loader.loadExcelSmeRuntime(),
        error => error?.code === 'SME_EXCELJS_LOAD_FAILED'
    );
    assert.equal(document.currentScript, null);

    const runtime = await Promise.race([
        loader.loadExcelSmeRuntime(),
        rejectAfter(100)
    ]);

    assert.equal(appendCalls, 2);
    assert.equal(runtime.ExcelJS, ExcelJS);
});

test('encerra carregamento do ExcelJS com erro tipado quando o evento nunca ocorre', async () => {
    const root = {};
    const document = createFakeDocument(() => {});
    root.document = document;
    const loader = loaderApi.createRuntimeLoader({
        root,
        document,
        timeoutMs: 10,
        fetch: async () => successfulTemplateResponse()
    });

    await assert.rejects(
        Promise.race([loader.loadExcelSmeRuntime(), rejectAfter(100)]),
        error => error?.code === 'SME_EXCELJS_LOAD_TIMEOUT'
    );
    assert.equal(document.currentScript, null);
});

test('aborta template pendente e permite nova tentativa sem recarregar a página', async () => {
    const ExcelJS = require('exceljs');
    const root = { ExcelJS };
    let fetchCalls = 0;
    const loader = loaderApi.createRuntimeLoader({
        root,
        timeoutMs: 10,
        fetch: async (_url, options) => {
            fetchCalls += 1;
            if (fetchCalls <= 2) {
                return new Promise((_, reject) => {
                    options.signal?.addEventListener('abort', () => {
                        const error = new Error('aborted');
                        error.name = 'AbortError';
                        reject(error);
                    }, { once: true });
                });
            }
            return successfulTemplateResponse();
        }
    });

    await assert.rejects(
        Promise.race([loader.loadExcelSmeRuntime(), rejectAfter(150)]),
        error => error?.code === 'SME_TEMPLATE_TIMEOUT'
    );

    const runtime = await loader.loadExcelSmeRuntime();
    assert.equal(fetchCalls, 3);
    assert.equal(runtime.ExcelJS, ExcelJS);
});

test('carrega somente ExcelJS para relatórios que não usam o template SME', async () => {
    let scriptCalls = 0;
    let fetchCalls = 0;
    const ExcelJS = require('exceljs');
    const root = {};
    const loader = loaderApi.createRuntimeLoader({
        root,
        loadScript: async (src, target) => {
            scriptCalls += 1;
            assert.equal(src, '/vendor/exceljs.min.js');
            target.ExcelJS = ExcelJS;
        },
        fetch: async () => {
            fetchCalls += 1;
            return successfulTemplateResponse();
        }
    });

    const runtime = await loader.loadExcelJsRuntime();

    assert.equal(runtime.ExcelJS, ExcelJS);
    assert.equal(scriptCalls, 1);
    assert.equal(fetchCalls, 0);
    assert.equal(runtime.templateBytes, undefined);
});

test('o carregador inicial não inclui o bundle pesado do ExcelJS', () => {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../src/integration/load-excel-export.js'),
        'utf8'
    );

    assert.doesNotMatch(source, /vendor\/exceljs\.min\.js/);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const guardApi = require('../../src/integration/excel-export-bootstrap-guard.js');

test('não recarrega o arquivo quando o bootstrap já está disponível', async () => {
    let loadCalls = 0;
    let startCalls = 0;
    const root = {
        RadarExcelExportBootstrap: {
            async start() { startCalls += 1; }
        }
    };
    const guard = guardApi.createGuard({
        root,
        loadScript: async () => { loadCalls += 1; }
    });

    await guard.start();

    assert.equal(loadCalls, 0);
    assert.equal(startCalls, 1);
    assert.equal(guard.getState(), 'ready');
});

test('repete o carregamento do arquivo inicial após falha transitória', async () => {
    let loadCalls = 0;
    let startCalls = 0;
    const root = {};
    const guard = guardApi.createGuard({
        root,
        attempts: 2,
        loadScript: async (src, target) => {
            loadCalls += 1;
            if (loadCalls === 1) throw new Error('falha transitória');
            assert.match(src, /retry=/);
            target.RadarExcelExportBootstrap = {
                async start() { startCalls += 1; }
            };
        }
    });

    await guard.start();

    assert.equal(loadCalls, 2);
    assert.equal(startCalls, 1);
    assert.equal(guard.getState(), 'ready');
});

test('falha com código estável quando o arquivo não publica o contrato esperado', async () => {
    const root = {};
    const guard = guardApi.createGuard({
        root,
        attempts: 1,
        loadScript: async () => {}
    });

    await assert.rejects(
        guard.start(),
        error => error?.code === 'EXCEL_BOOTSTRAP_GUARD_CONTRACT_INVALID'
    );
    assert.equal(guard.getState(), 'failed');
});

test('deduplica chamadas simultâneas do guard', async () => {
    let loadCalls = 0;
    let release;
    const root = {};
    const gate = new Promise(resolve => { release = resolve; });
    const guard = guardApi.createGuard({
        root,
        loadScript: async (_src, target) => {
            loadCalls += 1;
            await gate;
            target.RadarExcelExportBootstrap = { async start() {} };
        }
    });

    const first = guard.start();
    const second = guard.start();
    release();
    await Promise.all([first, second]);

    assert.equal(loadCalls, 1);
    assert.equal(guard.getState(), 'ready');
});

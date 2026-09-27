'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { mkdtemp, mkdir, rm, writeFile } = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');

async function loadServer() {
    return import(pathToFileURL(path.join(ROOT, 'scripts/serve-radar.mjs')).href);
}

test('servidor canônico preserva rotas SPA, assets profundos, HEAD e no-store', async t => {
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'radar-serve-'));
    await mkdir(path.join(fixtureRoot, 'src'), { recursive: true });
    await writeFile(path.join(fixtureRoot, 'index.html'), '<!doctype html><title>RADAR fixture</title>');
    await writeFile(path.join(fixtureRoot, 'src/demo.js'), 'window.__radarFixture = true;');

    const { startRadarServer } = await loadServer();
    const server = await startRadarServer({ root: fixtureRoot, host: '127.0.0.1', port: 0, log: false });
    t.after(async () => {
        await new Promise(resolve => server.close(resolve));
        await rm(fixtureRoot, { recursive: true, force: true });
    });

    const address = server.address();
    assert.equal(typeof address, 'object');
    const origin = `http://127.0.0.1:${address.port}`;

    const dashboard = await fetch(`${origin}/dashboard?competencia=2026-08`);
    assert.equal(dashboard.status, 200);
    assert.match(await dashboard.text(), /RADAR fixture/);
    assert.equal(dashboard.headers.get('cache-control'), 'no-store');
    assert.match(dashboard.headers.get('content-type'), /^text\/html/);

    const deepAsset = await fetch(`${origin}/escolas/04.11.999/src/demo.js`);
    assert.equal(deepAsset.status, 200);
    assert.match(await deepAsset.text(), /radarFixture/);
    assert.match(deepAsset.headers.get('content-type'), /^application\/javascript/);

    const head = await fetch(`${origin}/index.html`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');

    const missing = await fetch(`${origin}/arquivo-inexistente.txt`);
    assert.equal(missing.status, 404);
});

test('servidor canônico impede raiz e arquivo fora do diretório autorizado', async () => {
    const { resolveServeRoot, safeFilePath } = await loadServer();
    const fakeRepo = path.join(os.tmpdir(), 'radar-repo');

    assert.equal(resolveServeRoot('dist', fakeRepo), path.join(fakeRepo, 'dist'));
    assert.throws(() => resolveServeRoot('../fora', fakeRepo), /deve permanecer dentro do repositório/);
    assert.equal(safeFilePath(path.join(fakeRepo, 'dist'), '../segredo.txt'), null);
});

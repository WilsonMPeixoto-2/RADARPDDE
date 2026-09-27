'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { mkdtemp, mkdir, rm, writeFile } = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs/promises');

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

async function fileFixture(t) {
    const root = await mkdtemp(path.join(os.tmpdir(), 'radar-serve-security-'));
    const file = path.join(root, 'example.txt');
    await writeFile(file, 'conteúdo original');
    const { startRadarServer } = await loadServer();
    const server = await startRadarServer({ root, port: 0, log: false });
    t.after(async () => {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        await rm(root, { recursive: true, force: true });
    });
    return { root, file, origin: `http://127.0.0.1:${server.address().port}` };
}

test('leitura preserva o arquivo aberto se o caminho for substituído durante a requisição', async t => {
    const { file, origin } = await fileFixture(t);
    let replaced = false;
    let opened;
    const replace = async () => {
        if (replaced) return;
        replaced = true;
        await fs.rename(file, `${file}.original`);
        await writeFile(file, 'conteúdo substituído');
    };
    // Reproduz a mesma troca de caminho nas duas implementações: depois da
    // verificação antiga por pathname ou depois da abertura por descritor.
    const originalStat = fs.stat.bind(fs);
    const originalOpen = fs.open.bind(fs);
    t.mock.method(fs, 'stat', async (...args) => {
        const result = await originalStat(...args);
        if (args[0] === file) await replace();
        return result;
    });
    t.mock.method(fs, 'open', async (...args) => {
        const result = await originalOpen(...args);
        if (args[0] === file) {
            opened = result;
            await replace();
        }
        return result;
    });
    const response = await fetch(`${origin}/example.txt`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.equal(replaced, true, 'a troca de arquivo deve realmente ocorrer');
    assert.equal(await response.text(), 'conteúdo original');
    assert.equal(await fs.readFile(file, 'utf8'), 'conteúdo substituído');
    assert.ok(opened);
    await assert.rejects(opened.stat(), { code: 'EBADF' });
});

test('falha de leitura retorna 500 genérico, fecha o arquivo e preserva a próxima requisição', async t => {
    const { file, origin } = await fileFixture(t);
    const sensitiveMessage = `EIO: falha de leitura em ${file}; detalhe interno restrito`;
    const failure = () => { throw Object.assign(new Error(sensitiveMessage), { code: 'EIO' }); };
    let failedHandle;
    const originalRead = fs.readFile.bind(fs);
    const originalOpen = fs.open.bind(fs);
    t.mock.method(fs, 'readFile', async (...args) => {
        if (args[0] === file) return failure();
        return originalRead(...args);
    });
    t.mock.method(fs, 'open', async (...args) => {
        const handle = await originalOpen(...args);
        if (args[0] === file) {
            failedHandle = handle;
            t.mock.method(handle, 'readFile', failure);
        }
        return handle;
    });
    const response = await fetch(`${origin}/example.txt`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 500);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(await response.text(), 'Internal Server Error');
    assert.ok(failedHandle);
    await assert.rejects(failedHandle.stat(), { code: 'EBADF' });
    t.mock.restoreAll();
    const recovered = await fetch(`${origin}/example.txt`);
    assert.equal(recovered.status, 200);
    assert.equal(await recovered.text(), 'conteúdo original');
});

test('HEAD e diretório não deixam descritor aberto; caminho inválido não expõe erro interno', async t => {
    const { root, file, origin } = await fileFixture(t);
    const handles = [];
    const originalOpen = fs.open.bind(fs);
    t.mock.method(fs, 'open', async (...args) => {
        const handle = await originalOpen(...args);
        handles.push(handle);
        return handle;
    });
    await mkdir(path.join(root, 'directory'));
    const head = await fetch(`${origin}/example.txt`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const directory = await fetch(`${origin}/directory`);
    assert.equal(directory.status, 404);
    assert.equal(await directory.text(), 'Not Found');
    const invalid = await fetch(`${origin}/%E0%A4%A`);
    assert.equal(invalid.status, 500);
    assert.equal(await invalid.text(), 'Internal Server Error');
    assert.equal(handles.length, 2);
    for (const handle of handles) await assert.rejects(handle.stat(), { code: 'EBADF' });
    assert.equal(await fs.readFile(file, 'utf8'), 'conteúdo original');
});

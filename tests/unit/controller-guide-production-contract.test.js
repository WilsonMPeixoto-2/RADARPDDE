'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const projectRoot = path.resolve(__dirname, '../..');
const builderUrl = pathToFileURL(path.join(projectRoot, 'scripts/build-vercel.mjs')).href;

const GUIDE_SCREENSHOTS = Object.freeze([
    'controlador__dashboard__padrao__desktop.png',
    'controlador__carteira__padrao__desktop.png',
    'controlador__competencia__padrao__desktop.png',
    'controlador__prontuario__dados__desktop.png',
    'controlador__pendencias__padrao__desktop.png',
    'controlador__inventario__padrao__desktop.png'
]);

async function createOutputDirectory(context) {
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'radar-vercel-build-'));
    context.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));
    return path.join(temporaryRoot, 'dist');
}

test('publica os seis prints do Guia no artefato real da Vercel', async context => {
    const { buildVercelArtifact } = await import(builderUrl);
    const outputDir = await createOutputDirectory(context);

    await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: { VERCEL_ENV: 'production' }
    });

    for (const filename of GUIDE_SCREENSHOTS) {
        await fs.access(path.join(outputDir, 'assets/guide', filename));
    }
});

test('Guia usa diretamente os tokens visuais vigentes do RADAR', async () => {
    const css = await fs.readFile(path.join(projectRoot, 'src/styles/controller-guide.css'), 'utf8');

    assert.match(css, /--guide-primary:\s*var\(--primary\)/);
    assert.match(css, /--guide-accent:\s*var\(--accent-plum\)/);
    assert.match(css, /--guide-ink:\s*var\(--text-main\)/);
    assert.match(css, /--guide-surface:\s*var\(--bg-card\)/);
    assert.match(css, /var\(--primary-dark\)/);
    assert.match(css, /var\(--primary\)/);

    assert.doesNotMatch(css, /--primary-color|--accent-color|--text-primary|--card-bg/);
    assert.doesNotMatch(css, /#133f57|#1d5d69|#397b70/i);
});

test('índice do Guia navega internamente sem escrever fragmento na rota canônica', async () => {
    const script = await fs.readFile(path.join(projectRoot, 'src/integration/controller-guide.js'), 'utf8');

    assert.doesNotMatch(script, /href=["']#guia-/);
    assert.match(script, /data-guide-target/);
    assert.match(script, /scrollIntoView/);
    assert.match(script, /preventDefault/);
});

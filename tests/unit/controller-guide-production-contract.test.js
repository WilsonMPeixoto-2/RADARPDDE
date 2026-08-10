'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const projectRoot = path.resolve(__dirname, '../..');
const builderUrl = pathToFileURL(path.join(projectRoot, 'scripts/build-vercel.mjs')).href;
const guideAssetsBuilderUrl = pathToFileURL(path.join(projectRoot, 'scripts/copy-controller-guide-assets.mjs')).href;
const guideAssetRoot = path.join('docs', 'evidence', 'global-baseline', 'desktop');

const GUIDE_SCREENSHOTS = Object.freeze([
    'controlador__dashboard__padrao__desktop.png',
    'controlador__carteira__resultado__desktop.png',
    'controlador__competencias__padrao__desktop.png',
    'controlador__pendencias__padrao__desktop.png',
    'controlador__inventario__padrao__desktop.png',
    'controlador__registros-internos__padrao__desktop.png'
]);

async function createOutputDirectory(context) {
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'radar-vercel-build-'));
    context.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));
    return path.join(temporaryRoot, 'dist');
}

test('publica os seis prints usados pelo Guia no artefato real da Vercel', async context => {
    const { buildVercelArtifact } = await import(builderUrl);
    const { copyControllerGuideAssets } = await import(guideAssetsBuilderUrl);
    const outputDir = await createOutputDirectory(context);

    await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: { VERCEL_ENV: 'production' }
    });
    await copyControllerGuideAssets({ rootDir: projectRoot, outputDir });

    for (const filename of GUIDE_SCREENSHOTS) {
        await fs.access(path.join(outputDir, guideAssetRoot, filename));
    }

    const vercel = JSON.parse(await fs.readFile(path.join(projectRoot, 'vercel.json'), 'utf8'));
    assert.match(
        vercel.buildCommand,
        /build-vercel\.mjs.*copy-controller-guide-assets\.mjs.*build-vercel-output\.mjs/
    );
});

test('Guia herda os tokens visuais vigentes do RADAR', async () => {
    const theme = await fs.readFile(path.join(projectRoot, 'src/styles/controller-guide-theme.css'), 'utf8');
    const bootstrap = await fs.readFile(path.join(projectRoot, 'src/integration/product-extensions-bootstrap.js'), 'utf8');

    assert.match(theme, /--guide-primary:\s*var\(--primary\)/);
    assert.match(theme, /--guide-accent:\s*var\(--accent-plum\)/);
    assert.match(theme, /--guide-ink:\s*var\(--text-main\)/);
    assert.match(theme, /--guide-surface:\s*var\(--bg-card\)/);
    assert.match(theme, /var\(--primary-dark\)/);
    assert.match(theme, /var\(--primary\)/);
    assert.doesNotMatch(theme, /#133f57|#1d5d69|#397b70/i);

    const baseThemeIndex = bootstrap.indexOf('/src/styles/controller-guide.css');
    const radarThemeIndex = bootstrap.indexOf('/src/styles/controller-guide-theme.css');
    assert.ok(baseThemeIndex >= 0, 'stylesheet estrutural do Guia deve continuar carregado');
    assert.ok(radarThemeIndex > baseThemeIndex, 'tema do Guia deve carregar depois do stylesheet estrutural');
});

test('índice do Guia navega internamente sem escrever fragmento na rota canônica', async () => {
    const script = await fs.readFile(path.join(projectRoot, 'src/integration/controller-guide-ready.js'), 'utf8');

    assert.match(script, /data-guide-target/);
    assert.match(script, /removeAttribute\(['"]href['"]\)/);
    assert.match(script, /scrollIntoView/);
    assert.match(script, /preventDefault/);
    assert.match(script, /MutationObserver/);
});

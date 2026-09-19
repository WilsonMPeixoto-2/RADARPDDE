'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const optimizerUrl = pathToFileURL(
    path.join(root, 'scripts/optimize-public-assets.mjs')
).href;

test('otimização reduz o artefato sem renomear contratos globais nem tocar vendor', async t => {
    const { optimizePublicAssets } = await import(optimizerUrl);
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'radar-public-opt-'));
    t.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));

    await fs.mkdir(path.join(temporaryRoot, 'src'), { recursive: true });
    await fs.mkdir(path.join(temporaryRoot, 'vendor'), { recursive: true });

    const appSource = `
        function renderDashboardControlador(container) {
            if (container) {
                container.textContent = 'Dashboard';
            }
            return true;
        }
        window.renderDashboardControlador = renderDashboardControlador;
    `;
    const integrationSource = `
        window.RadarFixture = Object.freeze({
            install: function installRadarFixture() {
                return typeof renderDashboardControlador === 'function';
            }
        });
    `;
    const cssSource = `
        .fixture {
            color: rgb(255, 255, 0);
            margin: 0px 0px 0px 0px;
        }
    `;
    const vendorSource = 'window.VendorFixture = function VendorFixture () { return 1; };\n';

    await fs.writeFile(path.join(temporaryRoot, 'app.js'), appSource);
    await fs.writeFile(path.join(temporaryRoot, 'src', 'fixture.js'), integrationSource);
    await fs.writeFile(path.join(temporaryRoot, 'styles.css'), cssSource);
    await fs.writeFile(path.join(temporaryRoot, 'vendor', 'fixture.js'), vendorSource);

    const result = await optimizePublicAssets(temporaryRoot);
    const optimizedApp = await fs.readFile(path.join(temporaryRoot, 'app.js'), 'utf8');
    const optimizedIntegration = await fs.readFile(path.join(temporaryRoot, 'src', 'fixture.js'), 'utf8');
    const optimizedCss = await fs.readFile(path.join(temporaryRoot, 'styles.css'), 'utf8');
    const untouchedVendor = await fs.readFile(path.join(temporaryRoot, 'vendor', 'fixture.js'), 'utf8');

    assert.ok(result.totals.savedBytes > 0);
    assert.ok(Buffer.byteLength(optimizedApp) < Buffer.byteLength(appSource));
    assert.ok(Buffer.byteLength(optimizedIntegration) < Buffer.byteLength(integrationSource));
    assert.ok(Buffer.byteLength(optimizedCss) < Buffer.byteLength(cssSource));
    assert.match(optimizedApp, /renderDashboardControlador/);
    assert.match(optimizedIntegration, /renderDashboardControlador/);
    assert.match(optimizedIntegration, /RadarFixture/);
    assert.equal(untouchedVendor, vendorSource);
    assert.equal(result.files.some(record => record.path.startsWith('vendor/')), false);
});

test('build real reduz app.js e preserva nomes globais usados entre arquivos', async t => {
    const { buildVercelArtifact } = await import('../../scripts/build-vercel.mjs');
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'radar-vercel-build-'));
    const outputDir = path.join(temporaryRoot, 'dist');
    t.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));

    const sourceApp = await fs.readFile(path.join(root, 'app.js'), 'utf8');
    const result = await buildVercelArtifact({
        rootDir: root,
        outputDir,
        environment: {
            RADAR_DATA_MODE: 'local',
            RADAR_ENVIRONMENT: 'local',
            RADAR_SUPABASE_REPOSITORY_ENABLED: 'false'
        }
    });
    const publicApp = await fs.readFile(path.join(outputDir, 'app.js'), 'utf8');

    assert.ok(result.optimization.totals.savedBytes > 100 * 1024);
    assert.ok(Buffer.byteLength(publicApp) < Buffer.byteLength(sourceApp));
    assert.match(publicApp, /renderDashboardControlador/);
    assert.match(publicApp, /switchView/);
    assert.match(publicApp, /initializeRadarData/);
});

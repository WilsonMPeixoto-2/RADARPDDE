'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const projectRoot = path.resolve(__dirname, '../..');
const buildArtifactUrl = pathToFileURL(
    path.join(projectRoot, 'scripts/build-vercel.mjs')
).href;
const buildOutputUrl = pathToFileURL(
    path.join(projectRoot, 'scripts/build-vercel-output.mjs')
).href;
const verifierUrl = pathToFileURL(
    path.join(projectRoot, 'scripts/verify-excel-sme-template.mjs')
).href;
const guardPath = 'src/integration/excel-export-bootstrap-guard.js';

async function createTemporaryLayout(context) {
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'radar-vercel-build-'));
    context.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));
    return {
        temporaryRoot,
        distDirectory: path.join(temporaryRoot, 'dist'),
        outputDirectory: path.join(temporaryRoot, '.vercel', 'output')
    };
}

async function buildTemporaryOutput(context) {
    const layout = await createTemporaryLayout(context);
    const { buildVercelArtifact } = await import(buildArtifactUrl);
    const { buildVercelOutput } = await import(buildOutputUrl);

    await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir: layout.distDirectory,
        environment: {
            VERCEL_ENV: 'production',
            VERCEL_GIT_COMMIT_SHA: '0123456789abcdef0123456789abcdef01234567'
        }
    });

    const result = await buildVercelOutput({
        rootDir: projectRoot,
        sourceDir: layout.distDirectory,
        outputDir: layout.outputDirectory
    });

    return { ...layout, result };
}

async function startStaticServer(context, staticDirectory) {
    const server = http.createServer(async (request, response) => {
        try {
            const requestUrl = new URL(request.url, 'http://127.0.0.1');
            const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
            const candidate = path.resolve(staticDirectory, relativePath);
            const relative = path.relative(staticDirectory, candidate);

            if (relative.startsWith('..') || path.isAbsolute(relative)) {
                response.writeHead(403).end('Forbidden');
                return;
            }

            const body = await fs.readFile(candidate);
            const contentType = relativePath.endsWith('.xlsx')
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : relativePath.endsWith('.json')
                    ? 'application/json; charset=utf-8'
                    : relativePath.endsWith('.js')
                        ? 'application/javascript; charset=utf-8'
                        : 'application/octet-stream';
            response.writeHead(200, {
                'content-type': contentType,
                'content-length': String(body.length)
            });
            response.end(body);
        } catch {
            response.writeHead(404).end('Not Found');
        }
    });

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    context.after(() => new Promise(resolve => server.close(resolve)));

    const address = server.address();
    return `http://127.0.0.1:${address.port}`;
}

test('gera .vercel/output/static com template, manifesto, guard e configuração v3', async context => {
    const { result, outputDirectory } = await buildTemporaryOutput(context);
    const config = JSON.parse(
        await fs.readFile(path.join(outputDirectory, 'config.json'), 'utf8')
    );
    const indexHtml = await fs.readFile(
        path.join(result.staticDirectory, 'index.html'),
        'utf8'
    );
    const assetManifest = JSON.parse(await fs.readFile(
        path.join(result.staticDirectory, 'excel-sme-assets.json'),
        'utf8'
    ));

    assert.equal(config.version, 3);
    assert.ok(config.routes.some(route => route.handle === 'filesystem'));
    assert.ok(config.routes.some(route => (
        route.src?.includes('CRE_04_CONTROLE_ONEDRIVE2026')
        && route.headers?.['content-type']
            === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )));
    assert.equal(result.templateVerification.signature, 'PK\\x03\\x04');
    assert.ok(result.templateVerification.entryCount > 0);
    assert.ok(result.templateVerification.worksheetCount > 0);
    assert.equal(assetManifest.schemaVersion, 1);
    assert.match(assetManifest.template.sha256, /^[0-9a-f]{64}$/);
    assert.match(assetManifest.exceljs.sha256, /^[0-9a-f]{64}$/);
    assert.match(indexHtml, /excel-export-bootstrap-guard\.js/);
    await fs.access(path.join(result.staticDirectory, guardPath));
    await fs.access(result.templatePath);
});

test('serve template, manifesto e guard pelos caminhos públicos exatos', async context => {
    const { result } = await buildTemporaryOutput(context);
    const baseUrl = await startStaticServer(context, result.staticDirectory);
    const { fetchExcelSmeTemplate } = await import(verifierUrl);

    const verification = await fetchExcelSmeTemplate(
        `${baseUrl}/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx`
    );
    const manifestResponse = await fetch(`${baseUrl}/excel-sme-assets.json`);
    const guardResponse = await fetch(`${baseUrl}/${guardPath}`);
    const manifest = await manifestResponse.json();
    const guardSource = await guardResponse.text();

    assert.equal(verification.status, 200);
    assert.equal(verification.signature, 'PK\\x03\\x04');
    assert.ok(verification.byteLength > 0);
    assert.ok(verification.worksheetCount > 0);
    assert.match(
        verification.contentType,
        /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/u
    );
    assert.equal(manifestResponse.status, 200);
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(guardResponse.status, 200);
    assert.match(guardSource, /RadarExcelExportBootstrapGuard/);
});

test('recusa apagar destino que não seja .vercel/output em área segura', async context => {
    const { assertSafeVercelOutputDirectory } = await import(buildOutputUrl);
    const { temporaryRoot, outputDirectory } = await createTemporaryLayout(context);

    assert.equal(
        assertSafeVercelOutputDirectory(projectRoot, outputDirectory),
        path.resolve(outputDirectory)
    );
    assert.throws(
        () => assertSafeVercelOutputDirectory(projectRoot, projectRoot),
        /deve se chamar output/i
    );
    assert.throws(
        () => assertSafeVercelOutputDirectory(
            projectRoot,
            path.join(temporaryRoot, 'output')
        ),
        /sob \.vercel\/output/i
    );
    assert.throws(
        () => assertSafeVercelOutputDirectory(
            projectRoot,
            path.join(os.tmpdir(), '.vercel', 'output')
        ),
        /área temporária isolada/i
    );
});

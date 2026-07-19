'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const projectRoot = path.resolve(__dirname, '../..');
const builderUrl = pathToFileURL(
    path.join(projectRoot, 'scripts/build-vercel.mjs')
).href;

async function loadBuilder() {
    return import(builderUrl);
}

async function createOutputDirectory(context) {
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'radar-vercel-build-'));
    context.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));
    return path.join(temporaryRoot, 'dist');
}

test('gera artefato local fail-closed sem publicar credenciais fornecidas', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'production',
            VERCEL_GIT_COMMIT_SHA: '0123456789abcdef0123456789abcdef01234567',
            RADAR_DATA_MODE: 'local',
            RADAR_ENVIRONMENT: 'local',
            RADAR_SUPABASE_REPOSITORY_ENABLED: 'false',
            RADAR_SUPABASE_URL: 'https://discarded.supabase.co',
            RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_discarded'
        }
    });

    const runtimeSource = await fs.readFile(path.join(outputDir, 'config.runtime.js'), 'utf8');
    const manifest = JSON.parse(
        await fs.readFile(path.join(outputDir, 'radar-build-manifest.json'), 'utf8')
    );

    assert.equal(result.runtimeInput.dataMode, 'local');
    assert.equal(manifest.vercelEnvironment, 'production');
    assert.equal(manifest.supabaseRepositoryEnabled, false);
    assert.equal(manifest.commitSha, '0123456789abcdef0123456789abcdef01234567');
    assert.doesNotMatch(runtimeSource, /discarded/);
    await fs.access(path.join(outputDir, 'index.html'));
    await fs.access(path.join(outputDir, 'src/data/supabase-repository.js'));
    await fs.access(path.join(outputDir, 'vendor/supabase-client.js'));
    await assert.rejects(fs.access(path.join(outputDir, 'package.json')));
    await assert.rejects(fs.access(path.join(outputDir, 'supabase')));
});

test('gera artefato de Preview com configuração pública e manifesto sem a chave', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);
    const publishableKey = 'sb_publishable_preview_example';

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'preview',
            RADAR_DATA_MODE: 'supabase-preview',
            RADAR_ENVIRONMENT: 'preview',
            RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
            RADAR_SUPABASE_URL: 'https://example.supabase.co',
            RADAR_SUPABASE_PUBLISHABLE_KEY: publishableKey,
            RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'false'
        }
    });

    const runtimeSource = await fs.readFile(path.join(outputDir, 'config.runtime.js'), 'utf8');
    const manifestSource = await fs.readFile(
        path.join(outputDir, 'radar-build-manifest.json'),
        'utf8'
    );

    assert.equal(result.runtimeInput.dataMode, 'supabase-preview');
    assert.equal(result.manifest.vercelEnvironment, 'preview');
    assert.equal(result.manifest.supabaseRepositoryEnabled, true);
    assert.match(runtimeSource, /supabase-preview/);
    assert.match(runtimeSource, new RegExp(publishableKey));
    assert.doesNotMatch(manifestSource, new RegExp(publishableKey));
    assert.doesNotMatch(manifestSource, /supabase\.co/);
});

test('bloqueia Preview Supabase quando o alvo real da Vercel é produção', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    await assert.rejects(
        buildVercelArtifact({
            rootDir: projectRoot,
            outputDir,
            environment: {
                VERCEL_ENV: 'production',
                RADAR_DATA_MODE: 'supabase-preview',
                RADAR_ENVIRONMENT: 'preview',
                RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
                RADAR_SUPABASE_URL: 'https://example.supabase.co',
                RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_preview_example'
            }
        }),
        /Preview.*production/i
    );
});

test('bloqueia ambiente público divergente do alvo real da Vercel', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    await assert.rejects(
        buildVercelArtifact({
            rootDir: projectRoot,
            outputDir,
            environment: {
                VERCEL_ENV: 'production',
                RADAR_DATA_MODE: 'local',
                RADAR_ENVIRONMENT: 'preview'
            }
        }),
        /produção.*RADAR_ENVIRONMENT=local/i
    );

    await assert.rejects(
        buildVercelArtifact({
            rootDir: projectRoot,
            outputDir,
            environment: {
                VERCEL_ENV: 'preview',
                RADAR_DATA_MODE: 'supabase-preview',
                RADAR_ENVIRONMENT: 'test',
                RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
                RADAR_SUPABASE_URL: 'https://example.supabase.co',
                RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_preview_example'
            }
        }),
        /Preview.*RADAR_ENVIRONMENT=preview/i
    );
});

test('bloqueia artefato Supabase de produção fora do alvo production da Vercel', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    await assert.rejects(
        buildVercelArtifact({
            rootDir: projectRoot,
            outputDir,
            environment: {
                VERCEL_ENV: 'preview',
                RADAR_DATA_MODE: 'supabase-production',
                RADAR_ENVIRONMENT: 'production',
                RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
                RADAR_SUPABASE_URL: 'https://example.supabase.co',
                RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_production_example',
                RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'true'
            }
        }),
        /produção.*production/i
    );
});

test('recusa limpeza de diretório amplo ou de saída com nome inesperado', async context => {
    const { assertSafeOutputDirectory } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    assert.equal(assertSafeOutputDirectory(projectRoot, outputDir), path.resolve(outputDir));
    assert.throws(
        () => assertSafeOutputDirectory(projectRoot, projectRoot),
        /deve se chamar dist/i
    );
    assert.throws(
        () => assertSafeOutputDirectory(projectRoot, path.join(projectRoot, 'public-build')),
        /deve se chamar dist/i
    );
    assert.throws(
        () => assertSafeOutputDirectory(projectRoot, path.parse(projectRoot).root),
        /deve se chamar dist/i
    );
    assert.throws(
        () => assertSafeOutputDirectory(projectRoot, path.join(os.tmpdir(), 'dist')),
        /temporária isolada/i
    );
});

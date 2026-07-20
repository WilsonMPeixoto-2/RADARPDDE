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

test('Preview automático da Vercel usa o Supabase público sem segredos operacionais', async context => {
    const { buildVercelArtifact, PREVIEW_SUPABASE_PUBLIC_RUNTIME } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'preview',
            VERCEL_GIT_COMMIT_SHA: '0123456789abcdef0123456789abcdef01234567'
        }
    });

    const runtimeSource = await fs.readFile(path.join(outputDir, 'config.runtime.js'), 'utf8');
    const manifestSource = await fs.readFile(
        path.join(outputDir, 'radar-build-manifest.json'),
        'utf8'
    );

    assert.equal(result.runtimeInput.environment, 'preview');
    assert.equal(result.runtimeInput.dataMode, 'supabase-preview');
    assert.equal(result.runtimeInput.features.supabaseRepositoryEnabled, true);
    assert.equal(result.runtimeInput.productionActivationApproved, false);
    assert.equal(
        result.runtimeInput.supabase.url,
        PREVIEW_SUPABASE_PUBLIC_RUNTIME.RADAR_SUPABASE_URL
    );
    assert.equal(
        result.runtimeInput.supabase.publishableKey,
        PREVIEW_SUPABASE_PUBLIC_RUNTIME.RADAR_SUPABASE_PUBLISHABLE_KEY
    );
    assert.match(runtimeSource, /scnryinorqeucbfkioxo\.supabase\.co/);
    assert.match(runtimeSource, /sb_publishable_/);
    assert.doesNotMatch(manifestSource, /sb_publishable_|supabase\.co/);
});

test('Production automática da Vercel continua local sem configuração explícita', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'production',
            VERCEL_GIT_COMMIT_SHA: 'fedcba9876543210fedcba9876543210fedcba98'
        }
    });

    assert.equal(result.runtimeInput.environment, 'local');
    assert.equal(result.runtimeInput.dataMode, 'local');
    assert.equal(result.runtimeInput.features.supabaseRepositoryEnabled, false);
    assert.equal(result.runtimeInput.supabase.url, '');
    assert.equal(result.runtimeInput.supabase.publishableKey, '');
    assert.equal(result.manifest.productionActivationApproved, false);
});

test('configuração RADAR explícita não é substituída pelos padrões do Preview', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'preview',
            RADAR_DATA_MODE: 'local',
            RADAR_ENVIRONMENT: 'local',
            RADAR_SUPABASE_REPOSITORY_ENABLED: 'false'
        }
    });

    assert.equal(result.runtimeInput.dataMode, 'local');
    assert.equal(result.runtimeInput.features.supabaseRepositoryEnabled, false);
});

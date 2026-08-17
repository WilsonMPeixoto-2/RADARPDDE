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

test('Preview automático da Vercel fica isolado do Supabase institucional', async context => {
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
    assert.equal(result.runtimeInput.dataMode, 'local');
    assert.equal(result.runtimeInput.features.supabaseRepositoryEnabled, false);
    assert.equal(result.runtimeInput.productionActivationApproved, false);
    assert.equal(result.runtimeInput.supabase.url, PREVIEW_SUPABASE_PUBLIC_RUNTIME.RADAR_SUPABASE_URL);
    assert.equal(result.runtimeInput.supabase.publishableKey, '');
    assert.doesNotMatch(runtimeSource, /scnryinorqeucbfkioxo\.supabase\.co|sb_publishable_/);
    assert.doesNotMatch(manifestSource, /sb_publishable_|supabase\.co/);
});

test('Preview explícito aceita somente um Supabase separado de desenvolvimento', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'preview',
            RADAR_DATA_MODE: 'supabase-preview',
            RADAR_ENVIRONMENT: 'preview',
            RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
            RADAR_SUPABASE_URL: 'https://previewseguro.supabase.co',
            RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_preview_seguro',
            RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'false'
        }
    });

    assert.equal(result.runtimeInput.dataMode, 'supabase-preview');
    assert.equal(result.runtimeInput.supabase.url, 'https://previewseguro.supabase.co');
    assert.equal(result.runtimeInput.features.supabaseRepositoryEnabled, true);
});

test('Preview explícito rejeita o Supabase Production do RADAR', async context => {
    const { buildVercelArtifact, PRODUCTION_SUPABASE_PUBLIC_RUNTIME } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    await assert.rejects(
        buildVercelArtifact({
            rootDir: projectRoot,
            outputDir,
            environment: {
                VERCEL_ENV: 'preview',
                RADAR_DATA_MODE: 'supabase-preview',
                RADAR_ENVIRONMENT: 'preview',
                RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
                RADAR_SUPABASE_URL: PRODUCTION_SUPABASE_PUBLIC_RUNTIME.RADAR_SUPABASE_URL,
                RADAR_SUPABASE_PUBLISHABLE_KEY: PRODUCTION_SUPABASE_PUBLIC_RUNTIME.RADAR_SUPABASE_PUBLISHABLE_KEY,
                RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'false'
            }
        }),
        /Preview da Vercel não pode apontar para o Supabase Production/
    );
});

test('Production automática da Vercel usa Supabase Production aprovado', async context => {
    const { buildVercelArtifact, PRODUCTION_SUPABASE_PUBLIC_RUNTIME } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'production',
            VERCEL_GIT_COMMIT_SHA: 'fedcba9876543210fedcba9876543210fedcba98'
        }
    });

    const runtimeSource = await fs.readFile(path.join(outputDir, 'config.runtime.js'), 'utf8');
    const manifestSource = await fs.readFile(
        path.join(outputDir, 'radar-build-manifest.json'),
        'utf8'
    );

    assert.equal(result.runtimeInput.environment, 'production');
    assert.equal(result.runtimeInput.dataMode, 'supabase-production');
    assert.equal(result.runtimeInput.features.supabaseRepositoryEnabled, true);
    assert.equal(result.runtimeInput.productionActivationApproved, true);
    assert.equal(
        result.runtimeInput.supabase.url,
        PRODUCTION_SUPABASE_PUBLIC_RUNTIME.RADAR_SUPABASE_URL
    );
    assert.equal(
        result.runtimeInput.supabase.publishableKey,
        PRODUCTION_SUPABASE_PUBLIC_RUNTIME.RADAR_SUPABASE_PUBLISHABLE_KEY
    );
    assert.match(runtimeSource, /supabase-production/);
    assert.match(runtimeSource, /scnryinorqeucbfkioxo\.supabase\.co/);
    assert.doesNotMatch(manifestSource, /sb_publishable_|supabase\.co/);
});

test('Production ignora configuração local antiga quando a ativação está vigente', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'production',
            RADAR_DATA_MODE: 'local',
            RADAR_ENVIRONMENT: 'local',
            RADAR_SUPABASE_REPOSITORY_ENABLED: 'false',
            RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'false'
        }
    });

    assert.equal(result.runtimeInput.environment, 'production');
    assert.equal(result.runtimeInput.dataMode, 'supabase-production');
    assert.equal(result.runtimeInput.features.supabaseRepositoryEnabled, true);
    assert.equal(result.runtimeInput.productionActivationApproved, true);
});

test('Production ignora antigo sinal de rollback local e permanece fail-closed', async context => {
    const { buildVercelArtifact } = await loadBuilder();
    const outputDir = await createOutputDirectory(context);

    const result = await buildVercelArtifact({
        rootDir: projectRoot,
        outputDir,
        environment: {
            VERCEL_ENV: 'production',
            RADAR_PRODUCTION_FORCE_LOCAL: 'true'
        }
    });

    assert.equal(result.runtimeInput.environment, 'production');
    assert.equal(result.runtimeInput.dataMode, 'supabase-production');
    assert.equal(result.runtimeInput.features.supabaseRepositoryEnabled, true);
    assert.equal(result.runtimeInput.productionActivationApproved, true);
});

test('configuração RADAR local explícita não é substituída pelos padrões do Preview', async context => {
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

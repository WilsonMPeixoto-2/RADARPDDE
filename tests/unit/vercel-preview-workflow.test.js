'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const buildPath = path.resolve(
    __dirname,
    '../../scripts/build-vercel.mjs'
);

function readBuild() {
    return fs.readFileSync(buildPath, 'utf8');
}

test('build automático configura exclusivamente deployments Preview com Supabase', () => {
    const source = readBuild();

    assert.match(source, /PREVIEW_SUPABASE_PUBLIC_RUNTIME/);
    assert.match(source, /RADAR_DATA_MODE:\s*['"]supabase-preview['"]/);
    assert.match(source, /RADAR_ENVIRONMENT:\s*['"]preview['"]/);
    assert.match(source, /RADAR_SUPABASE_REPOSITORY_ENABLED:\s*['"]true['"]/);
    assert.match(source, /scnryinorqeucbfkioxo\.supabase\.co/);
    assert.match(source, /RADAR_SUPABASE_PUBLISHABLE_KEY:\s*['"]sb_publishable_/);
    assert.match(source, /RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED:\s*['"]false['"]/);
    assert.match(source, /vercelEnvironment\s*!==\s*['"]preview['"]/);
    assert.match(source, /hasExplicitRadarRuntime\(environment\)/);
});

test('build Preview não depende de token nem de credencial administrativa', () => {
    const source = readBuild();

    assert.doesNotMatch(source, /VERCEL_TOKEN|VERCEL_ORG_ID|VERCEL_PROJECT_ID/);
    assert.doesNotMatch(source, /sb_secret_/i);
    assert.doesNotMatch(source, /service_role/i);
    assert.doesNotMatch(source, /DATABASE_PASSWORD|DB_PASSWORD/i);
});

test('manifesto público não recebe URL ou chave do Supabase', () => {
    const source = readBuild();
    const manifestBlock = source.match(
        /function createPublicBuildManifest[\s\S]*?\n\}/
    )?.[0] || '';

    assert.match(manifestBlock, /vercelEnvironment/);
    assert.match(manifestBlock, /runtimeEnvironment/);
    assert.match(manifestBlock, /dataMode/);
    assert.match(manifestBlock, /supabaseRepositoryEnabled/);
    assert.match(manifestBlock, /productionActivationApproved/);
    assert.doesNotMatch(manifestBlock, /publishableKey|supabaseUrl|RADAR_SUPABASE_URL/);
});

test('Production continua protegida pelo alvo real da Vercel', () => {
    const source = readBuild();

    assert.match(source, /vercelEnvironment === ['"]production['"][\s\S]*runtimeInput\.dataMode === ['"]supabase-preview['"]/);
    assert.match(source, /vercelEnvironment !== ['"]production['"][\s\S]*runtimeInput\.dataMode === ['"]supabase-production['"]/);
    assert.match(source, /Produção em modo local exige RADAR_ENVIRONMENT=local/);
});

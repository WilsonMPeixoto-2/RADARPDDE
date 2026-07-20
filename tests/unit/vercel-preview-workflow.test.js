'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.resolve(
    __dirname,
    '../../.github/workflows/configurar-e-publicar-preview-supabase.yml'
);

function readWorkflow() {
    return fs.readFileSync(workflowPath, 'utf8');
}

test('workflow configura exclusivamente o ambiente Preview do RADAR', () => {
    const workflow = readWorkflow();

    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /publishable_key:/);
    assert.match(workflow, /PUBLICAR_PREVIEW_SUPABASE_RADAR_PDDE/);
    assert.match(workflow, /scnryinorqeucbfkioxo\.supabase\.co/);
    assert.match(workflow, /RADAR_DATA_MODE[\s\S]*supabase-preview/);
    assert.match(workflow, /RADAR_ENVIRONMENT[\s\S]*preview/);
    assert.match(workflow, /RADAR_SUPABASE_REPOSITORY_ENABLED[\s\S]*true/);
    assert.match(workflow, /RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED[\s\S]*false/);

    [
        'RADAR_DATA_MODE',
        'RADAR_ENVIRONMENT',
        'RADAR_SUPABASE_REPOSITORY_ENABLED',
        'RADAR_SUPABASE_URL',
        'RADAR_SUPABASE_PUBLISHABLE_KEY',
        'RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED'
    ].forEach(name => {
        assert.match(
            workflow,
            new RegExp(`env add ["']?${name}["']? preview [^\\n]*--force`, 'i'),
            `${name} deve ser configurada somente em Preview.`
        );
    });

    assert.doesNotMatch(workflow, /env add[^\n]+production/i);
    assert.doesNotMatch(workflow, /RADAR_SUPABASE_SERVICE_ROLE_KEY|sb_secret_|service_role/i);
});

test('workflow publica artefato prebuilt e valida o manifesto antes e depois do deploy', () => {
    const workflow = readWorkflow();

    assert.match(workflow, /vercel(?:@56\.2\.0)?\s+pull[^\n]+--environment=preview/i);
    assert.match(workflow, /vercel(?:@56\.2\.0)?\s+build/i);
    assert.match(workflow, /dist\/radar-build-manifest\.json/);
    assert.match(workflow, /vercel(?:@56\.2\.0)?\s+deploy[^\n]+--prebuilt/i);
    assert.match(workflow, /runtimeEnvironment:\s*['"]preview['"]/);
    assert.match(workflow, /dataMode:\s*['"]supabase-preview['"]/);
    assert.match(workflow, /supabaseRepositoryEnabled:\s*true/);
    assert.match(workflow, /productionActivationApproved:\s*false/);
    assert.match(workflow, /radarpdde-fix\.vercel\.app\/radar-build-manifest\.json/);
    assert.match(workflow, /runtimeEnvironment:\s*['"]local['"]/);
    assert.match(workflow, /dataMode:\s*['"]local['"]/);
    assert.doesNotMatch(workflow, /\s--prod(?:\s|$)/i);
    assert.doesNotMatch(workflow, /--environment=production/i);
});

test('workflow usa apenas segredos operacionais da Vercel e não os publica', () => {
    const workflow = readWorkflow();

    ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'].forEach(secret => {
        assert.match(workflow, new RegExp(`secrets\\.${secret}`));
    });

    const artifactBlock = workflow.match(/upload-artifact[\s\S]*?(?=\n\s{6}- name:|$)/i)?.[0] || '';
    assert.match(artifactBlock, /radar-build-manifest\.json/);
    assert.doesNotMatch(artifactBlock, /\.vercel|\.env|config\.runtime|token/i);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.resolve(
    __dirname,
    '../../.github/workflows/vercel-preview-prebuilt.yml'
);

test('Preview Vercel executa build versionado e deploy prebuilt', () => {
    const workflow = fs.readFileSync(workflowPath, 'utf8');

    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /PUBLICAR_PREVIEW_PREBUILT/);
    assert.match(workflow, /vercel(?:@56\.2\.0)?\s+pull[^\n]+--environment=preview/i);
    assert.match(workflow, /vercel(?:@56\.2\.0)?\s+build/i);
    assert.match(workflow, /dist\/radar-build-manifest\.json/);
    assert.match(workflow, /vercel(?:@56\.2\.0)?\s+deploy[^\n]+--prebuilt/i);
    assert.doesNotMatch(workflow, /\s--prod(?:\s|$)/i);
    assert.doesNotMatch(workflow, /--environment=production/i);
});

test('workflow valida o conteúdo semântico do manifesto antes do deploy', () => {
    const workflow = fs.readFileSync(workflowPath, 'utf8');

    assert.match(workflow, /vercelEnvironment:\s*['"]preview['"]/);
    assert.match(workflow, /runtimeEnvironment:\s*['"]preview['"]/);
    assert.match(workflow, /dataMode:\s*['"]supabase-preview['"]/);
    assert.match(workflow, /supabaseRepositoryEnabled:\s*true/);
    assert.match(workflow, /productionActivationApproved:\s*false/);
    assert.match(workflow, /sb_secret_\|service_role\|password/);
    assert.ok(
        workflow.indexOf('Confirmar manifesto público do Preview')
            < workflow.indexOf('Publicar somente o artefato prebuilt de Preview'),
        'O manifesto deve ser validado antes do deployment.'
    );
});

test('workflow exige segredos operacionais sem publicá-los como artefato', () => {
    const workflow = fs.readFileSync(workflowPath, 'utf8');

    ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'].forEach(secret => {
        assert.match(workflow, new RegExp(`secrets\\.${secret}`));
    });
    const artifactBlock = workflow.match(/upload-artifact[\s\S]*?(?=\n\s{6}- name:|$)/i)?.[0] || '';
    assert.match(artifactBlock, /radar-build-manifest\.json/);
    assert.doesNotMatch(artifactBlock, /\.vercel|config\.runtime|env/i);
});

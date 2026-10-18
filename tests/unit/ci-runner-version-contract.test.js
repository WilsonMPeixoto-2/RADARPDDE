'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const workflowsDir = path.join(root, '.github/workflows');
const auditedFiles = [
    'codeql.yml',
    'validate.yml',
    'playwright-mobile.yml',
    'retification-targeted.yml',
    'snapshot-canonico-radar.yml',
    'vercel-preview-prebuilt.yml',
    'export-remediation-source.yml',
    'supabase-remote-validation.yml',
    'backup-restore-disposable.yml',
    'supabase-readiness.yml',
    'homologacao-deployment-perfis.yml',
    'production-team-account-preflight.yml',
    'importar-snapshot-canonico-supabase.yml',
    'supabase-remote-post-apply.yml',
    'gate-remoto-perfis-viewports.yml'
];

test('nenhum workflow legado muda de Ubuntu 24 para 26 silenciosamente durante rollout', () => {
    const files = fs.readdirSync(workflowsDir).filter(file => /\.ya?ml$/.test(file));
    for (const file of files) {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        assert.doesNotMatch(content, /^\s*runs-on:\s*ubuntu-latest\s*$/m,
            file + ': runner sem pin explícito durante rollout');
    }
    for (const file of auditedFiles) {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        assert.match(content, /^\s*runs-on:\s*ubuntu-24\.04\s*$/m,
            file + ': baseline Ubuntu 24.04 deve continuar determinístico');
    }
});

test('compatibilidade Ubuntu 26 é testada isoladamente sem operações remotas', () => {
    const source = fs.readFileSync(
        path.join(workflowsDir, 'ubuntu-26-compatibility.yml'), 'utf8'
    );
    assert.match(source, /os: \[ubuntu-24\.04, ubuntu-26\.04\]/);
    assert.match(source, /fail-fast:\s*false/);
    assert.match(source, /node-version:\s*'24'/);
    assert.match(source, /docker pull ghcr\.io\/supabase\/postgres-meta:v0\.97\.0/);
    assert.doesNotMatch(source, /supabase db push|--linked|--prod|service_role|RADAR_SUPABASE_ADMIN_KEY/);
});

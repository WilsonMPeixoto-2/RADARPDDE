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

const fullPilotWorkflows = [
    'preproduction-full-validation.yml',
    'supabase-readiness.yml',
    'functional-reliability-supabase.yml',
    'functional-reliability-lifecycle.yml',
    'visual-regression.yml',
    'validate.yml'
];

test('piloto Ubuntu 26 usa runners explícitos, preservando demais workflows', () => {
    const files = fs.readdirSync(workflowsDir).filter(file => /\.ya?ml$/.test(file));
    for (const file of files) {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        assert.doesNotMatch(content, /^\s*runs-on:\s*ubuntu-latest\s*$/m,
            file + ': runner sem versão explícita durante rollout');
    }
    for (const file of auditedFiles) {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        const expected = fullPilotWorkflows.includes(file) ? 'ubuntu-26.04' : 'ubuntu-24.04';
        assert.ok(content.includes('runs-on: ' + expected),
            file + ': runner deve ser ' + expected);
    }
    for (const file of fullPilotWorkflows) {
        const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        const runnerLines = content.split('\n').filter(line => line.trim().startsWith('runs-on:'));
        assert.ok(runnerLines.length > 0, file + ': sem jobs');
        assert.ok(runnerLines.every(line => line.trim() === 'runs-on: ubuntu-26.04'),
            file + ': todos os jobs do piloto devem ser Ubuntu 26.04');
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

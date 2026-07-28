'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
    return JSON.parse(read(relativePath));
}

test('mantém o renderer XLSX interno sem ExcelJS e fixa o toolchain aprovado', () => {
    const packageJson = readJson('package.json');
    const lockfile = read('package-lock.json');

    assert.equal(packageJson.dependencies?.exceljs, undefined);
    assert.doesNotMatch(lockfile, /"node_modules\/exceljs"/);
    assert.doesNotMatch(lockfile, /"node_modules\/@lhci\/cli"/);
    assert.equal(packageJson.devDependencies.prettier, '3.9.6');
    assert.equal(packageJson.devDependencies.knip, '6.29.0');
    assert.equal(packageJson.devDependencies['eslint-plugin-no-unsanitized'], '4.1.5');
    assert.equal(packageJson.devDependencies['eslint-plugin-playwright'], '2.10.5');
    assert.equal(packageJson.devDependencies.lighthouse, '13.4.1');
    assert.equal(packageJson.devDependencies['@lhci/cli'], undefined);
    assert.equal(packageJson.overrides['brace-expansion@5.0.7'], '5.0.8');
});

test('mantém scripts de segurança, dependências e desempenho como gates úteis', () => {
    const packageJson = readJson('package.json');

    assert.match(packageJson.scripts['test:readiness'], /lint:security/);
    assert.match(packageJson.scripts['test:readiness'], /lint:e2e/);
    assert.match(packageJson.scripts['analyze:unused'], /knip/);
    assert.match(packageJson.scripts['audit:lighthouse'], /run-lighthouse-baseline\.mjs/);
    assert.match(packageJson.scripts['lint:security'], /--max-warnings 42/);

    for (const relativePath of [
        'eslint.config.js',
        'knip.json',
        'lighthouserc.cjs',
        'scripts/run-lighthouse-baseline.mjs',
        '.github/workflows/lighthouse-ci.yml'
    ]) {
        assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `${relativePath} deve existir`);
    }
});

test('alinha a Edge Function à versão estável fixada do Supabase JS', () => {
    const packageJson = readJson('package.json');
    const edgeFunction = read('supabase/functions/team-account-management/index.ts');
    const expectedVersion = packageJson.devDependencies['@supabase/supabase-js'];

    assert.match(edgeFunction, new RegExp(`npm:@supabase/supabase-js@${expectedVersion.replaceAll('.', '\\.')}`));
    assert.doesNotMatch(edgeFunction, /npm:@supabase\/supabase-js@2\.110\.7/);
});

test('configura Knip para analisar o projeto híbrido sem falsos positivos de runtime', () => {
    const knip = readJson('knip.json');
    const dependencyWorkflow = read('.github/workflows/dependency-health.yml');

    assert.deepEqual(knip.playwright?.config, []);
    assert.deepEqual(knip.playwright?.entry, ['tests/e2e/**/*.spec.js']);
    assert.ok(knip.ignoreDependencies.includes('jsr'));
    assert.ok(knip.ignoreDependencies.includes('npm'));
    assert.equal(knip.entry.includes('eslint.config.js'), false);
    assert.match(dependencyWorkflow, /Inventariar dependências e imports com Knip/);
    assert.doesNotMatch(dependencyWorkflow, /id: knip-audit\s+continue-on-error: true/);
    assert.match(dependencyWorkflow, /Knip: bloqueante/);
});

test('Lighthouse mede métricas, oportunidades e bloqueia regressões graves', () => {
    const lighthouseConfig = read('lighthouserc.cjs');
    const lighthouseRunner = read('scripts/run-lighthouse-baseline.mjs');
    const lighthouseWorkflow = read('.github/workflows/lighthouse-ci.yml');

    assert.match(lighthouseConfig, /metricBudgets/);
    assert.match(lighthouseConfig, /thresholds/);
    assert.match(lighthouseRunner, /import\.meta\.resolve\('lighthouse\/cli\/index\.js'\)/);
    assert.match(lighthouseRunner, /accessibilityFindings/);
    assert.match(lighthouseRunner, /opportunities/);
    assert.match(lighthouseRunner, /summary\.md/);
    assert.match(lighthouseWorkflow, /Executar baseline mobile/);
    assert.match(lighthouseWorkflow, /Executar baseline desktop/);
    assert.match(lighthouseWorkflow, /Validar pisos de qualidade Lighthouse/);
    assert.match(lighthouseWorkflow, /summary\.md/);
});

test('não mantém workflows temporários de diagnóstico', () => {
    assert.equal(
        fs.existsSync(path.join(ROOT, '.github/workflows/tooling-supabase-diagnostic.yml')),
        false
    );
});

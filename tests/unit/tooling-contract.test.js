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

test('mantém o renderer institucional interno e fixa ExcelJS somente para o produto SME', () => {
    const packageJson = readJson('package.json');
    const lockfile = read('package-lock.json');
    const initialLoader = read('src/integration/load-excel-export.js');
    const runtimeLoader = read('src/integration/excel-sme-runtime-loader.js');

    assert.equal(packageJson.dependencies?.exceljs, '4.4.0');
    assert.match(lockfile, /"node_modules\/exceljs"/);
    assert.equal(fs.existsSync(path.join(ROOT, 'vendor/exceljs.min.js')), true);
    assert.doesNotMatch(initialLoader, /vendor\/exceljs\.min\.js/);
    assert.match(runtimeLoader, /\/vendor\/exceljs\.min\.js/);
    assert.doesNotMatch(lockfile, /"node_modules\/@lhci\/cli"/);
    assert.equal(packageJson.devDependencies.prettier, '3.9.6');
    assert.equal(packageJson.scripts.format, 'prettier . --write --ignore-unknown');
    assert.equal(packageJson.scripts['format:check'], 'prettier . --check --ignore-unknown');
    const prettierIgnore = read('.prettierignore');
    assert.match(prettierIgnore, /^vendor\/$/m);
    assert.equal(packageJson.devDependencies.eslint, '10.10.0');
    assert.equal(packageJson.devDependencies.knip, '6.35.1');
    assert.equal(packageJson.devDependencies['eslint-plugin-no-unsanitized'], '4.1.5');
    assert.equal(packageJson.devDependencies['eslint-plugin-playwright'], '2.11.0');
    assert.equal(packageJson.devDependencies.lighthouse, '13.4.1');
    assert.equal(packageJson.devDependencies['@lhci/cli'], undefined);
    assert.equal(packageJson.overrides['brace-expansion@5.0.8'], '5.0.9');
    assert.equal(packageJson.overrides['fast-uri'], '^3.1.6');
    assert.equal(packageJson.overrides.qs, '^6.16.0');
    assert.match(lockfile, /"node_modules\/fast-uri": \{\s+"version": "3\.1\.6"/);
    assert.match(lockfile, /"node_modules\/qs": \{\s+"version": "6\.16\.0"/);
    assert.doesNotMatch(lockfile, /"node_modules\/fast-uri": \{\s+"version": "4\.1\.2"/);
    assert.equal(
        packageJson.allowScripts[`esbuild@${packageJson.devDependencies.esbuild}`],
        true,
        'allowScripts deve acompanhar a versão efetivamente fixada do esbuild'
    );
});

test('mantém scripts de segurança, dependências e desempenho como gates úteis', () => {
    const packageJson = readJson('package.json');

    assert.match(packageJson.scripts['test:readiness'], /lint:security/);
    assert.match(packageJson.scripts['test:readiness'], /lint:e2e/);
    assert.match(packageJson.scripts['analyze:unused'], /knip\.config\.cjs/);
    assert.match(packageJson.scripts['audit:lighthouse'], /run-lighthouse-baseline\.mjs/);
    assert.match(packageJson.scripts['lint:security'], /--max-warnings 42/);

    for (const relativePath of [
        'eslint.config.js',
        'knip.config.cjs',
        'lighthouserc.cjs',
        'scripts/run-lighthouse-baseline.mjs',
        '.github/workflows/lighthouse-ci.yml'
    ]) {
        assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `${relativePath} deve existir`);
    }
    assert.equal(fs.existsSync(path.join(ROOT, 'knip.json')), false);
});

test('alinha a Edge Function à versão estável fixada do Supabase JS', () => {
    const packageJson = readJson('package.json');
    const edgeFunction = read('supabase/functions/team-account-management/index.ts');
    const expectedVersion = packageJson.devDependencies['@supabase/supabase-js'];

    assert.match(edgeFunction, new RegExp(`npm:@supabase/supabase-js@${expectedVersion.replaceAll('.', '\\.')}`));
    assert.doesNotMatch(edgeFunction, /npm:@supabase\/supabase-js@2\.110\.7/);
});

test('configura Knip para analisar o projeto híbrido sem falsos positivos de runtime', () => {
    const configPath = path.join(ROOT, 'knip.config.cjs');
    const configSource = read('knip.config.cjs');
    const dependencyWorkflow = read('.github/workflows/dependency-health.yml');
    const previousDeploymentUrl = process.env.RADAR_DEPLOYMENT_URL;

    delete process.env.RADAR_DEPLOYMENT_URL;
    delete require.cache[require.resolve(configPath)];
    const knip = require(configPath);

    try {
        assert.equal(process.env.RADAR_DEPLOYMENT_URL, 'http://127.0.0.1:4175');
        assert.deepEqual(knip.playwright?.config, []);
        assert.deepEqual(knip.playwright?.entry, ['tests/e2e/**/*.spec.js']);
        assert.ok(knip.ignoreDependencies.includes('jsr'));
        assert.ok(knip.ignoreDependencies.includes('npm'));
        assert.equal(knip.entry.includes('eslint.config.js'), false);
        assert.match(configSource, /RADAR_DEPLOYMENT_URL \|\|=/);
        assert.match(dependencyWorkflow, /Inventariar dependências e imports com Knip/);
        assert.doesNotMatch(dependencyWorkflow, /id: knip-audit\s+continue-on-error: true/);
        assert.match(dependencyWorkflow, /Error loading/);
        assert.match(dependencyWorkflow, /Knip: bloqueante/);
    } finally {
        if (previousDeploymentUrl === undefined) delete process.env.RADAR_DEPLOYMENT_URL;
        else process.env.RADAR_DEPLOYMENT_URL = previousDeploymentUrl;
        delete require.cache[require.resolve(configPath)];
    }
});

test('Lighthouse desktop mede métricas, oportunidades e bloqueia regressões graves', () => {
    const lighthouseConfig = read('lighthouserc.cjs');
    const lighthouseRunner = read('scripts/run-lighthouse-baseline.mjs');
    const lighthouseWorkflow = read('.github/workflows/lighthouse-ci.yml');

    assert.match(lighthouseConfig, /numberOfRuns:\s*3/);
    assert.match(lighthouseConfig, /metricBudgets/);
    assert.match(lighthouseConfig, /thresholds/);
    assert.match(lighthouseRunner, /import\.meta\.resolve\('lighthouse'\)/);
    assert.match(lighthouseRunner, /function median\(/);
    assert.match(lighthouseRunner, /aggregation:\s*'median'/);
    assert.match(lighthouseRunner, /accessibilityFindings/);
    assert.match(lighthouseRunner, /opportunities/);
    assert.match(lighthouseWorkflow, /Executar baseline desktop/);
    assert.match(lighthouseWorkflow, /Validar piso de qualidade Lighthouse desktop/);
    assert.doesNotMatch(lighthouseWorkflow, /Executar baseline mobile/);
    assert.doesNotMatch(lighthouseWorkflow, /LHCI_PROFILE=mobile/);
    assert.match(lighthouseWorkflow, /summary\.md/);
});

test('CI homologado permanece restrito ao desktop', () => {
    const playwrightWorkflow = read('.github/workflows/playwright-mobile.yml');
    const preproductionWorkflow = read('.github/workflows/preproduction-full-validation.yml');

    assert.match(playwrightWorkflow, /name: Desktop homologado/);
    assert.match(playwrightWorkflow, /--project=desktop-chromium/);
    assert.doesNotMatch(playwrightWorkflow, /--project=mobile-/);
    assert.doesNotMatch(playwrightWorkflow, /install --with-deps chromium webkit/);

    assert.match(preproductionWorkflow, /name: Playwright completo desktop/);
    assert.match(preproductionWorkflow, /name: Lighthouse CI desktop/);
    assert.match(preproductionWorkflow, /--project=desktop-chromium/);
    assert.match(preproductionWorkflow, /Gerar artefato público otimizado/);
    assert.match(preproductionWorkflow, /npm run build:vercel/);
    assert.match(preproductionWorkflow, /http-server dist -p 4175 -c-1/);
    assert.doesNotMatch(preproductionWorkflow, /npm run start > preproduction-lighthouse-server/);
    assert.doesNotMatch(preproductionWorkflow, /Auditar perfil móvel/);
    assert.doesNotMatch(preproductionWorkflow, /LHCI_PROFILE:\s*mobile/);
});

test('não mantém workflows temporários de diagnóstico', () => {
    assert.equal(
        fs.existsSync(path.join(ROOT, '.github/workflows/tooling-supabase-diagnostic.yml')),
        false
    );
});


test('Vercel limita deploy automático à main e preserva filtro do Dependabot', () => {
    const vercel = readJson('vercel.json');

    assert.match(vercel.ignoreCommand, /VERCEL_GIT_COMMIT_REF/);
    assert.match(vercel.ignoreCommand, /dependabot\/\*/);
    assert.deepEqual(vercel.git?.deploymentEnabled, {
        '*': false,
        main: true
    });
});


test('Dependabot não reabre versões do Supabase CLI já rejeitadas por RLS', () => {
    const dependabot = read('.github/dependabot.yml');

    for (const version of ['2.116.0', '2.117.0']) {
        const escaped = version.replaceAll('.', '\\.');
        assert.match(
            dependabot,
            new RegExp(`dependency-name:\\s*"supabase"[\\s\\S]*?versions:\\s*[\\s\\S]*?-\\s*"${escaped}"`),
            `Supabase CLI ${version} deve permanecer bloqueado após reprovação pgTAP/RLS`
        );
    }
    assert.doesNotMatch(
        dependabot,
        /dependency-name:\s*"supabase"[\s\S]*?version-update:semver-(?:minor|patch)/,
        'o bloqueio não deve impedir versões futuras do Supabase CLI de serem avaliadas'
    );
});

test('Supabase readiness e pré-production toleram apenas falha transitória conhecida do registry', () => {
    const readinessWorkflow = read('.github/workflows/supabase-readiness.yml');
    const preproductionWorkflow = read('.github/workflows/preproduction-full-validation.yml');

    for (const workflow of [readinessWorkflow, preproductionWorkflow]) {
        assert.match(workflow, /gen_types_with_registry_retry/);
        assert.match(
            workflow,
            /toomanyrequests\|rate exceeded\|postgres-meta\|error running container: exit 125/i
        );
        assert.match(workflow, /max_attempts=3/);
        assert.match(workflow, /if ! grep -Eiq/);
        assert.match(workflow, /return "\$\{status\}"/);
        assert.match(workflow, /npm run supabase:gen:types/);
    }

    assert.equal(
        (preproductionWorkflow.match(/bash scripts\/start-disposable-supabase-ci\.sh/g) || []).length,
        2,
        'os dois jobs pré-production que sobem Supabase devem usar o starter resiliente'
    );
});

test('tooling A/B fixa ambiente, qualidade CSS, revisão de dependências e regressão visual', () => {
    const packageJson = readJson('package.json');
    const dependabot = read('.github/dependabot.yml');
    const visualWorkflow = read('.github/workflows/visual-regression.yml');
    const dependencyReview = read('.github/workflows/dependency-review.yml');
    const visualConfig = read('playwright.visual.config.js');

    assert.equal(packageJson.devDependencies['@supabase/supabase-js'], '2.117.2');
    assert.equal(packageJson.devDependencies.stylelint, '17.15.0');
    assert.equal(packageJson.devDependencies['stylelint-config-recommended'], '18.0.0');
    assert.equal(packageJson.scripts['lint:css'], 'stylelint "styles.css" "src/styles/**/*.css"');
    assert.match(packageJson.scripts['test:readiness'], /lint:css/);
    assert.equal(packageJson.scripts['test:visual'], 'playwright test --config=playwright.visual.config.js');
    assert.deepEqual(packageJson.devEngines, {
        runtime: { name: 'node', version: '^24.0.0', onFail: 'error' },
        packageManager: { name: 'npm', version: '^11.0.0', onFail: 'error' }
    });

    assert.match(dependabot, /supabase-sdk:/);
    assert.match(dependabot, /supabase-cli:/);
    assert.match(dependabot, /css-quality:/);
    assert.match(dependencyReview, /actions\/dependency-review-action@[0-9a-f]{40}/);
    assert.match(visualWorkflow, /npm run test:visual/);
    assert.match(visualConfig, /workers:\s*2/);
    const visual = require('../../playwright.visual.config');
    for (const project of visual.projects) {
        assert.deepEqual({ ...visual.use, ...project.use }.viewport, { width: 1440, height: 900 });
    }
    const functional = require('../../playwright.config');
    const desktop = functional.projects.find(project => project.name === 'desktop-chromium');
    assert.ok(desktop.testIgnore.test('unidentified-expense-visual.spec.js'));
    assert.ok(!desktop.testIgnore.test('unidentified-expense-user-journey.spec.js'));
    assert.match(visualConfig, /timeout:\s*90000/);
    assert.match(visualConfig, /snapshots:\s*\{\s*dom:\s*true,\s*aria:\s*true,\s*screen:\s*true\s*\}/);
    assert.equal(fs.existsSync(path.join(ROOT, 'stylelint.config.mjs')), true);
});

test('checker de workflows exige SHA imutável para Actions externas', () => {
    const checker = read('scripts/check-workflow-references.mjs');
    const checkerTests = read('tests/unit/workflow-references.test.js');

    assert.match(checker, /UNPINNED_EXTERNAL_ACTION/);
    assert.match(checker, /\^\[0-9a-f\]\{40\}\$/i);
    assert.match(checkerTests, /actions\/checkout@v7/);
});

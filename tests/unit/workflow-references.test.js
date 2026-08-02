'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const CHECKER_URL = pathToFileURL(
    path.resolve(__dirname, '../../scripts/check-workflow-references.mjs')
).href;

function write(root, relativePath, content = '') {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
}

function createRepository() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-workflow-references-'));
    write(root, 'package.json', JSON.stringify({
        scripts: {
            'check:local': 'node scripts/existing.mjs'
        }
    }, null, 2));
    write(root, 'package-lock.json', '{}');
    write(root, 'scripts/existing.mjs', 'export const ok = true;\n');
    write(root, 'tests/unit/existing.test.js', "'use strict';\n");
    write(root, 'tests/e2e/example.spec.js', "'use strict';\n");
    write(root, 'playwright.config.js', 'module.exports = {};\n');
    write(root, '.github/actions/example/action.yml', 'name: Example\nruns:\n  using: composite\n  steps: []\n');
    return root;
}

test('aceita scripts, testes, globs, configuração Playwright e ação local existentes', async () => {
    const checker = await import(CHECKER_URL);
    const root = createRepository();

    write(root, '.github/workflows/valid.yml', `name: Valid\non:\n  pull_request:\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: ./.github/actions/example\n      - uses: actions/setup-node@sha\n        with:\n          cache-dependency-path: package-lock.json\n      - working-directory: scripts\n        run: pwd\n      - run: node --check scripts/existing.mjs\n      - run: |\n          node --test \\\n            tests/unit/*.test.js\n          npm run check:local\n          npx playwright test tests/e2e/example.spec.js --config=playwright.config.js\n`);

    const result = checker.analyzeWorkflowReferences(root);

    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
    assert.ok(result.references.some(item => item.reference === 'tests/unit/*.test.js'));
    assert.ok(result.references.some(item => item.reference === 'playwright.config.js'));
    assert.ok(result.references.some(item => item.kind === 'working-directory' && item.reference === 'scripts'));
});

test('bloqueia arquivo de teste inexistente chamado por node --test', async () => {
    const checker = await import(CHECKER_URL);
    const root = createRepository();

    write(root, '.github/workflows/invalid-test.yml', `name: Invalid\non: workflow_dispatch\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node --test tests/unit/missing.test.js\n`);

    const result = checker.analyzeWorkflowReferences(root);

    assert.equal(result.passed, false);
    assert.deepEqual(result.violations, [{
        workflow: '.github/workflows/invalid-test.yml',
        kind: 'node-test',
        reference: 'tests/unit/missing.test.js',
        code: 'MISSING_LOCAL_REFERENCE'
    }]);
});

test('bloqueia npm script inexistente', async () => {
    const checker = await import(CHECKER_URL);
    const root = createRepository();

    write(root, '.github/workflows/invalid-script.yml', `name: Invalid\non: workflow_dispatch\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm run missing:script\n`);

    const result = checker.analyzeWorkflowReferences(root);

    assert.equal(result.passed, false);
    assert.ok(result.violations.some(item => item.code === 'MISSING_NPM_SCRIPT'));
});

test('ignora heredoc, expressões dinâmicas e artefatos gerados em runtime', async () => {
    const checker = await import(CHECKER_URL);
    const root = createRepository();

    write(root, '.github/workflows/dynamic.yml', `name: Dynamic\non: workflow_dispatch\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: |\n          node --input-type=module <<'NODE'\n          process.stdout.write('ok');\n          NODE\n          mkdir -p artifacts\n          echo '{}' > artifacts/output.json\n      - run: npx playwright test --config=\${{ matrix.config }}\n`);

    const result = checker.analyzeWorkflowReferences(root);

    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
});

test('bloqueia caminhos YAML locais inexistentes', async () => {
    const checker = await import(CHECKER_URL);
    const root = createRepository();

    write(root, '.github/workflows/invalid-yaml-path.yml', `name: Invalid\non: workflow_dispatch\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: ./.github/actions/missing\n      - uses: actions/setup-node@sha\n        with:\n          cache-dependency-path: missing-lock.json\n      - working-directory: missing-directory\n        run: pwd\n`);

    const result = checker.analyzeWorkflowReferences(root);

    assert.equal(result.passed, false);
    assert.deepEqual(
        new Set(result.violations.map(item => item.kind)),
        new Set(['local-action', 'cache-dependency-path', 'working-directory'])
    );
});

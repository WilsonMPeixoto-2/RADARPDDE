const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test('Node 24 fica fixado no projeto, lockfile e ambientes de desenvolvimento', () => {
  const packageJson = readJson('package.json');
  const lockfile = readJson('package-lock.json');

  assert.equal(packageJson.engines?.node, '24.x');
  assert.equal(lockfile.packages?.['']?.engines?.node, '24.x');
  assert.equal(read('.nvmrc').trim(), '24');
  assert.equal(read('.node-version').trim(), '24');

  const workflowDir = path.join(ROOT, '.github/workflows');
  const workflowPaths = fs.readdirSync(workflowDir)
    .filter(name => /\.ya?ml$/i.test(name))
    .map(name => path.join(workflowDir, name));
  const setupNodeWorkflows = workflowPaths.filter(file => read(path.relative(ROOT, file)).includes('actions/setup-node@'));

  assert.ok(setupNodeWorkflows.length >= 10, 'esperava ao menos dez workflows com setup-node');
  for (const workflowPath of setupNodeWorkflows) {
    const source = fs.readFileSync(workflowPath, 'utf8');
    assert.match(source, /node-version:\s*['"]?24(?:\.x)?['"]?\s*(?:#.*)?$/m, path.basename(workflowPath));
    assert.doesNotMatch(source, /node-version:\s*['"]?(?:20|22|26)(?:\.x)?['"]?/m, path.basename(workflowPath));
  }
});

test('gate remoto cobre todos os perfis em desktop, Android e iPhone sobre o código do PR', () => {
  const workflow = read('.github/workflows/homologacao-supabase-preview-remoto.yml');
  const config = read('playwright.supabase-preview.config.js');
  const spec = read('tests/e2e/supabase-preview-remote.spec.js');

  for (const requiredPath of ["'app.js'", "'src/**'", "'supabase/migrations/**'", "'package.json'"]) {
    assert.match(workflow, new RegExp(requiredPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(workflow, /npm run generate:runtime-config/);
  assert.match(workflow, /playwright install --with-deps chromium webkit/);

  for (const project of [
    'supabase-preview-desktop-chromium',
    'supabase-preview-mobile-chromium',
    'supabase-preview-mobile-webkit'
  ]) {
    assert.match(config, new RegExp(project));
  }
  assert.match(config, /Desktop Chrome/);
  assert.match(config, /Pixel 7/);
  assert.match(config, /iPhone 15/);
  assert.match(config, /webServer/);

  for (const profile of [
    'technicalAdmin',
    'assistant',
    'controllerTuane',
    'controllerAlzira',
    'inventory',
    'sme'
  ]) {
    assert.match(spec, new RegExp(profile));
  }
  assert.match(spec, /contextOptionsForProject/);
  assert.match(spec, /isDesktopProject/);
  assert.match(spec, /ensureNavigationOpen/);
});

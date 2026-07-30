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

test('gate remoto cobre papéis institucionais e três viewports no código do PR', () => {
  const workflow = read('.github/workflows/gate-remoto-perfis-viewports.yml');
  const config = read('playwright.supabase-preview.config.js');
  const matrixSpec = read('tests/e2e/supabase-preview-profile-viewport.spec.js');

  for (const requiredPath of ["'app.js'", "'src/**'", "'supabase/migrations/**'", "'package.json'"]) {
    assert.match(workflow, new RegExp(requiredPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(workflow, /npm run supabase:start/);
  assert.match(workflow, /npm run supabase:reset/);
  assert.match(workflow, /npm run bootstrap:auth-fixtures/);
  assert.match(workflow, /npm run generate:runtime-config/);
  assert.match(workflow, /supabase-auth-local\.spec\.js/);
  assert.match(workflow, /supabase-full-contract\.spec\.js/);
  assert.match(workflow, /playwright install --with-deps chromium webkit/);
  assert.match(workflow, /RADAR_E2E_PROFILE_VIEWPORT_GATE/);
  assert.match(workflow, /http:\/\/127\.0\.0\.1:4175/);
  assert.doesNotMatch(workflow, /secrets\.RADAR_SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(workflow, /RADAR_REFERENCE_PREVIEW_URL/);

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
  assert.match(config, /supabase-preview-profile-viewport/);

  for (const profile of ['technicalAdmin', 'assistant', 'controller', 'inventory', 'sme']) {
    assert.match(matrixSpec, new RegExp(profile));
  }
  assert.match(matrixSpec, /isDesktopProject/);
  assert.match(matrixSpec, /ensureNavigationOpen/);
  assert.match(matrixSpec, /documentWidth/);
  assert.match(matrixSpec, /hasSessionInPublicContext/);
  assert.match(matrixSpec, /RADAR_AUTH_FIXTURE_PASSWORD/);
});

test('cabeçalho móvel reserva posições distintas para perfil técnico e logout', () => {
  const mobileCss = read('src/styles/mobile-rendering-hotfix.css');

  assert.match(mobileCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+repeat\(4,\s*44px\)/);
  assert.match(mobileCss, /"exercise theme alerts session profile"/);
  assert.match(mobileCss, /\.auth-logout-button\s*\{[^}]*grid-area:\s*session/s);
  assert.match(mobileCss, /\.profile-switcher\s*\{[^}]*grid-area:\s*profile/s);
  assert.doesNotMatch(mobileCss, /\.auth-logout-button,\s*\n\s*\.profile-switcher\s*\{[^}]*grid-area:\s*session/s);
});

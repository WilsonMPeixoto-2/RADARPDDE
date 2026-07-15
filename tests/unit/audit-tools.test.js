const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const rootDir = path.resolve(__dirname, '../..');

async function importAuditModule(name) {
  return import(pathToFileURL(path.join(rootDir, `scripts/audit/${name}`)).href);
}

test('inventário técnico é determinístico e reconhece a arquitetura vigente', async () => {
  const { generateRepositoryInventory } = await importAuditModule('generate-repository-inventory.mjs');
  const first = await generateRepositoryInventory(rootDir);
  const second = await generateRepositoryInventory(rootDir);

  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.package.name, 'radar-pdde');
  assert.equal(first.package.scripts.start, 'http-server . -p 4175 -c-1');
  assert.ok(first.files.some(file => file.path === 'app.js' && file.category === 'frontend-core'));
  assert.ok(first.files.some(file => file.path === 'config.js' && file.category === 'configuration'));
  assert.ok(first.files.some(file => file.path.startsWith('src/styles/') && file.category === 'styles'));
  assert.ok(first.files.some(file => file.path.startsWith('tests/e2e/') && file.category === 'e2e-tests'));
  assert.equal(first.runtimeExtensions.styles[0], 'src/styles/mobile-responsive.css');
  assert.ok(first.runtimeExtensions.scripts.includes('src/integration/cycle-b-dashboard.js'));
  assert.equal(first.supabase.migrationCount, 12);
});

test('nome de captura visual é determinístico', () => {
  const valid = /^(controlador|sme)__[a-z0-9-]+__[a-z0-9-]+__(desktop|android|iphone)\.png$/;
  assert.match('controlador__dashboard__padrao__desktop.png', valid);
  assert.match('sme__configuracoes__padrao__iphone.png', valid);
  assert.doesNotMatch('Dashboard Final.png', valid);
});

test('validador aceita o conjunto completo do Ciclo A', async () => {
  const { validateCycleAArtifacts } = await importAuditModule('validate-cycle-a-artifacts.mjs');
  const result = await validateCycleAArtifacts(rootDir);
  assert.equal(result.errors.length, 0, result.errors.join('\n'));
  assert.ok(result.surfaceCount >= 18);
  assert.equal(result.captureCount, 24);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { mkdir, mkdtemp, writeFile } = require('node:fs/promises');
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
  assert.equal(first.supabase.migrationCount, 16);
});

test('nome de captura visual é determinístico', () => {
  const valid = /^(controlador|sme)__[a-z0-9-]+__[a-z0-9-]+__(desktop|android|iphone)\.png$/;
  assert.match('controlador__dashboard__padrao__desktop.png', valid);
  assert.match('sme__configuracoes__padrao__iphone.png', valid);
  assert.doesNotMatch('Dashboard Final.png', valid);
});

test('validador aceita um conjunto completo e reproduzível do Ciclo A', async () => {
  const { REQUIRED_FILES, validateCycleAArtifacts } = await importAuditModule('validate-cycle-a-artifacts.mjs');
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'radar-cycle-a-'));

  for (const relativePath of REQUIRED_FILES) {
    const absolutePath = path.join(fixtureRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    if (relativePath.endsWith('PRODUCT_SURFACE_CATALOG.md')) {
      await writeFile(absolutePath, Array.from({ length: 18 }, (_, index) => `## S-${String(index + 1).padStart(2, '0')} — Superfície\n`).join('\n'));
    } else if (relativePath.endsWith('manifest.json')) {
      const captures = Array.from({ length: 24 }, (_, index) => ({ file: `desktop/capture-${index + 1}.png` }));
      await writeFile(absolutePath, JSON.stringify({ captures }));
      for (const capture of captures) {
        const capturePath = path.join(fixtureRoot, 'docs/evidence/global-baseline', capture.file);
        await mkdir(path.dirname(capturePath), { recursive: true });
        await writeFile(capturePath, 'fixture');
      }
    } else if (relativePath.endsWith('.json')) {
      await writeFile(absolutePath, '{}');
    } else {
      await writeFile(absolutePath, '# Documento de teste\n');
    }
  }

  const result = await validateCycleAArtifacts(fixtureRoot);
  assert.equal(result.errors.length, 0, result.errors.join('\n'));
  assert.equal(result.surfaceCount, 18);
  assert.equal(result.captureCount, 24);
});

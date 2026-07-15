const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const { mkdir, mkdtemp, writeFile } = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

const repositoryRoot = path.resolve(__dirname, '../..');

async function importAnalyzer() {
  return import(pathToFileURL(path.join(repositoryRoot, 'scripts/audit/analyze-frontend-precedence.mjs')).href);
}

async function writeFixture(rootDir, relativePath, source) {
  const absolutePath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, source, 'utf8');
}

async function createFixture() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'radar-frontend-precedence-'));

  await writeFixture(rootDir, 'index.html', `<!doctype html>
<html><head><link rel="stylesheet" href="styles.css"></head><body>
<script src="core.js"></script>
<script src="shared.js" data-radar-extension="shared.js"></script>
<script src="config.js"></script>
<script src="app.js"></script>
</body></html>`);

  await writeFixture(rootDir, 'config.js', `
function loadStylesheet(href) { return href; }
function loadScript(src, async) { return { src, async }; }
loadStylesheet('override.css');
loadScript('shared.js', false);
loadScript('extensions/first.js', false);
loadScript('extensions/second.js', false);
loadScript('extensions/load-excel.js', true);
`);

  await writeFixture(rootDir, 'extensions/load-excel.js', `
const scripts = ['excel/model.js', 'excel/integration.js'];
async function start() { for (const src of scripts) await loadScript(src); }
`);

  await writeFixture(rootDir, 'extensions/first.js', `
(function (root) {
  if (typeof root.renderPendencias !== 'function') return;
  root.renderPendencias = function firstWrapper() {};
  root.RadarFirst = Object.freeze({ version: 1 });
}(window));
`);

  await writeFixture(rootDir, 'extensions/second.js', `
(function (root) {
  if (typeof root.renderPendencias !== 'function') return;
  if (typeof root.openPendencyDetail !== 'function') return;
  root.renderPendencias = function secondWrapper() {};
}(window));
`);

  await writeFixture(rootDir, 'shared.js', '(function (root) { root.Shared = true; }(window));\n');
  await writeFixture(rootDir, 'excel/model.js', '(function (root) { root.ExcelModel = {}; }(window));\n');
  await writeFixture(rootDir, 'excel/integration.js', '(function (root) { root.ExcelIntegration = {}; }(window));\n');

  await writeFixture(rootDir, 'styles.css', `
.card { color: red; padding: 1rem; }
.only-responsive { display: block; }
@media (max-width: 900px) {
  .card { padding: .5rem; }
}
`);

  await writeFixture(rootDir, 'override.css', `
.card { color: blue; }
@media (max-width: 900px) {
  .card { padding: .25rem; }
  .only-responsive { display: none; }
}
.notice { display: block !important; }
`);

  return rootDir;
}

test('analisa ordem estática, extensões, deduplicação e carregamento encadeado', async () => {
  const { analyzeFrontendPrecedence } = await importAnalyzer();
  const rootDir = await createFixture();
  const manifest = await analyzeFrontendPrecedence(rootDir, {
    excelLoaderPath: 'extensions/load-excel.js'
  });

  assert.deepEqual(manifest.styles.loadOrder, ['styles.css', 'override.css']);
  assert.deepEqual(manifest.scripts.staticOrder, ['core.js', 'shared.js', 'config.js', 'app.js']);
  assert.deepEqual(manifest.scripts.declaredExtensions.map(item => item.src), [
    'shared.js',
    'extensions/first.js',
    'extensions/second.js',
    'extensions/load-excel.js'
  ]);
  assert.deepEqual(manifest.scripts.deduplicated, ['shared.js']);
  assert.deepEqual(manifest.scripts.effectiveExtensions, [
    'extensions/first.js',
    'extensions/second.js',
    'extensions/load-excel.js'
  ]);
  assert.deepEqual(manifest.scripts.chainedScripts, ['excel/model.js', 'excel/integration.js']);
  assert.deepEqual(manifest.scripts.expectedExecutionOrder, [
    'core.js',
    'shared.js',
    'config.js',
    'app.js',
    'extensions/first.js',
    'extensions/second.js',
    'extensions/load-excel.js',
    'excel/model.js',
    'excel/integration.js'
  ]);
});

test('distingue contextos CSS e encontra colisões apenas na mesma condição', async () => {
  const { analyzeFrontendPrecedence } = await importAnalyzer();
  const rootDir = await createFixture();
  const manifest = await analyzeFrontendPrecedence(rootDir, {
    excelLoaderPath: 'extensions/load-excel.js'
  });

  const globalCard = manifest.css.sameContextCollisions.find(item => item.selector === '.card' && item.context === 'global');
  const mobileCard = manifest.css.sameContextCollisions.find(item => item.selector === '.card' && item.context === '@media (max-width: 900px)');
  const responsiveOnly = manifest.css.sameContextCollisions.find(item => item.selector === '.only-responsive');

  assert.deepEqual(globalCard.conflictingProperties.map(item => item.property), ['color']);
  assert.deepEqual(mobileCard.conflictingProperties.map(item => item.property), ['padding']);
  assert.equal(responsiveOnly, undefined);
  assert.equal(manifest.css.files.find(item => item.path === 'override.css').importantDeclarations, 1);
  assert.ok(manifest.css.crossContextSelectors.some(item => item.selector === '.only-responsive'));
});

test('identifica escritores globais múltiplos e pré-requisitos das extensões', async () => {
  const { analyzeFrontendPrecedence } = await importAnalyzer();
  const rootDir = await createFixture();
  const manifest = await analyzeFrontendPrecedence(rootDir, {
    excelLoaderPath: 'extensions/load-excel.js'
  });

  const first = manifest.javascript.extensions.find(item => item.path === 'extensions/first.js');
  const second = manifest.javascript.extensions.find(item => item.path === 'extensions/second.js');
  const shared = manifest.javascript.sharedWriters.find(item => item.global === 'renderPendencias');

  assert.deepEqual(first.requiresGlobals, ['renderPendencias']);
  assert.deepEqual(first.writesGlobals, ['RadarFirst', 'renderPendencias']);
  assert.deepEqual(second.requiresGlobals, ['openPendencyDetail', 'renderPendencias']);
  assert.deepEqual(shared.writers, ['extensions/first.js', 'extensions/second.js']);
});

test('resultado é determinístico e não expõe o caminho absoluto da execução', async () => {
  const { analyzeFrontendPrecedence } = await importAnalyzer();
  const rootDir = await createFixture();
  const options = { excelLoaderPath: 'extensions/load-excel.js' };
  const first = await analyzeFrontendPrecedence(rootDir, options);
  const second = await analyzeFrontendPrecedence(rootDir, options);

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first).includes(rootDir), false);
});

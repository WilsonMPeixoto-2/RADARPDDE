const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const moduleUrl = pathToFileURL(
  path.resolve(__dirname, '../../scripts/lib/production-system-smoke.mjs')
).href;

async function subject() {
  return import(moduleUrl);
}

function expectCode(fn, code) {
  assert.throws(fn, error => {
    assert.equal(error?.code, code);
    return true;
  });
}

test('descobre assets locais referenciados e ignora URLs externas, data e navegação', async () => {
  const { extractLocalAssetPaths } = await subject();
  const html = `
    <script src="app.js?v=7"></script>
    <script src="/src/application/data-service.js#boot"></script>
    <script src="https://cdn.example.test/vendor.js"></script>
    <img src="assets/logo.svg">
    <link rel="stylesheet" href="styles.css?v=2">
    <link rel="icon" href="data:,">
    <a href="/escolas">Escolas</a>
    <a href="#conteudo">Conteúdo</a>
  `;

  assert.deepEqual(extractLocalAssetPaths(html), [
    '/app.js',
    '/src/application/data-service.js',
    '/assets/logo.svg',
    '/styles.css'
  ]);
});

test('elimina assets duplicados preservando a ordem de publicação', async () => {
  const { extractLocalAssetPaths } = await subject();
  assert.deepEqual(
    extractLocalAssetPaths('<script src="app.js"></script><script src="/app.js?v=2"></script>'),
    ['/app.js']
  );
});

test('aceita somente manifesto do deployment de Production no commit esperado', async () => {
  const { validateProductionManifest } = await subject();
  const manifest = validateProductionManifest({
    schemaVersion: 1,
    commitSha: '41c0b8412d36c4feb05a5ddba31471c6c883b7ce',
    vercelEnvironment: 'production',
    runtimeEnvironment: 'production',
    dataMode: 'supabase-production',
    supabaseRepositoryEnabled: true,
    productionActivationApproved: true
  }, '41c0b8412d36c4feb05a5ddba31471c6c883b7ce');

  assert.equal(manifest.commitSha, '41c0b8412d36c4feb05a5ddba31471c6c883b7ce');
  assert.equal(manifest.dataMode, 'supabase-production');
});

test('trata commit ainda não propagado como condição temporária e não como contrato inválido', async () => {
  const { validateProductionManifest } = await subject();
  expectCode(() => validateProductionManifest({
    schemaVersion: 1,
    commitSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    vercelEnvironment: 'production',
    runtimeEnvironment: 'production',
    dataMode: 'supabase-production',
    supabaseRepositoryEnabled: true,
    productionActivationApproved: true
  }, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'), 'PRODUCTION_COMMIT_PENDING');
});

test('rejeita manifesto que não representa Supabase Production aprovado', async () => {
  const { validateProductionManifest } = await subject();
  expectCode(() => validateProductionManifest({
    schemaVersion: 1,
    commitSha: '41c0b8412d36c4feb05a5ddba31471c6c883b7ce',
    vercelEnvironment: 'preview',
    runtimeEnvironment: 'production',
    dataMode: 'supabase-production',
    supabaseRepositoryEnabled: true,
    productionActivationApproved: true
  }), 'PRODUCTION_MANIFEST_INVALID');
});

test('valida o shell público de login e rejeita páginas de erro', async () => {
  const { validateProductionShell } = await subject();
  assert.doesNotThrow(() => validateProductionShell(`
    <!doctype html>
    <html lang="pt-BR">
      <head><title>RADAR PDDE</title></head>
      <body><form id="radar-auth-form"><input id="radar-auth-email"><input id="radar-auth-password"></form></body>
    </html>
  `));

  expectCode(
    () => validateProductionShell('<html><title>Application error</title><body>Internal Server Error</body></html>'),
    'PRODUCTION_SHELL_INVALID'
  );
});

test('rejeita asset ausente, vazio ou substituído por fallback HTML', async () => {
  const { validateAssetResponse } = await subject();

  assert.doesNotThrow(() => validateAssetResponse('/app.js', {
    status: 200,
    contentType: 'text/javascript; charset=utf-8',
    bytes: 120,
    textSample: 'const ready = true;'
  }));

  expectCode(() => validateAssetResponse('/app.js', {
    status: 200,
    contentType: 'text/html; charset=utf-8',
    bytes: 120,
    textSample: '<!doctype html>'
  }), 'PRODUCTION_ASSET_HTML_FALLBACK');

  expectCode(() => validateAssetResponse('/styles.css', {
    status: 404,
    contentType: 'text/plain',
    bytes: 9,
    textSample: 'Not found'
  }), 'PRODUCTION_ASSET_HTTP_FAILED');

  expectCode(() => validateAssetResponse('/assets/logo.svg', {
    status: 200,
    contentType: 'image/svg+xml',
    bytes: 0,
    textSample: ''
  }), 'PRODUCTION_ASSET_EMPTY');
});

test('aceita argumentos válidos e limita repetição a propagação temporária', async () => {
  const {
    isRetryableProductionSmokeError,
    parseProductionSmokeArguments
  } = await subject();

  assert.deepEqual(parseProductionSmokeArguments([
    '--base-url', 'https://radarpdde-fix.vercel.app',
    '--expected-commit', '41c0b8412d36c4feb05a5ddba31471c6c883b7ce',
    '--attempts', '60',
    '--interval-ms', '10000'
  ]), {
    baseUrl: 'https://radarpdde-fix.vercel.app/',
    expectedCommitSha: '41c0b8412d36c4feb05a5ddba31471c6c883b7ce',
    attempts: 60,
    intervalMs: 10000
  });

  assert.equal(isRetryableProductionSmokeError(Object.assign(new Error('aguardando'), {
    code: 'PRODUCTION_COMMIT_PENDING'
  })), true);
  assert.equal(isRetryableProductionSmokeError(Object.assign(new Error('quebrado'), {
    code: 'PRODUCTION_ASSET_HTTP_FAILED'
  })), false);
});

test('rejeita argumentos incompletos ou numéricos inválidos', async () => {
  const { parseProductionSmokeArguments } = await subject();
  assert.throws(() => parseProductionSmokeArguments(['--base-url', 'https://radarpdde-fix.vercel.app']));
  assert.throws(() => parseProductionSmokeArguments([
    '--base-url', 'https://radarpdde-fix.vercel.app',
    '--expected-commit', '41c0b8412d36c4feb05a5ddba31471c6c883b7ce',
    '--attempts', '0'
  ]));
});

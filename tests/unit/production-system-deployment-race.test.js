const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const moduleUrl = pathToFileURL(
  path.resolve(__dirname, '../../scripts/check-production-system.mjs')
).href;

async function subject() {
  return import(moduleUrl);
}

test('permite validar Production íntegra sem fixar SHA quando não houve mudança no artefato web', async () => {
  const { parseCheckProductionSystemArguments } = await subject();

  assert.deepEqual(parseCheckProductionSystemArguments([
    '--base-url', 'https://radarpdde-fix.vercel.app',
    '--allow-any-commit',
    '--attempts', '1',
    '--interval-ms', '10000'
  ]), {
    baseUrl: 'https://radarpdde-fix.vercel.app/',
    expectedCommitSha: '',
    attempts: 1,
    intervalMs: 10000
  });
});

test('não permite combinar modo livre com SHA obrigatório', async () => {
  const { parseCheckProductionSystemArguments } = await subject();

  assert.throws(() => parseCheckProductionSystemArguments([
    '--base-url', 'https://radarpdde-fix.vercel.app',
    '--allow-any-commit',
    '--expected-commit', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ]));
});

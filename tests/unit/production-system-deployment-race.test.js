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

test('permite validar Production íntegra sem fixar SHA quando não houve mudança no artefato web', async () => {
  const { parseProductionSmokeArguments } = await subject();

  assert.deepEqual(parseProductionSmokeArguments([
    '--base-url', 'https://radarpdde-fix.vercel.app',
    '--attempts', '1',
    '--interval-ms', '10000'
  ]), {
    baseUrl: 'https://radarpdde-fix.vercel.app/',
    expectedCommitSha: '',
    attempts: 1,
    intervalMs: 10000
  });
});

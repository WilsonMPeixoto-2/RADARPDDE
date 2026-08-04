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

test('considera 401 e 403 provas válidas de bloqueio anônimo', async () => {
  const { validateAnonymousRlsResponse } = await subject();
  assert.equal(validateAnonymousRlsResponse({ status: 401, value: null }), 'blocked-401');
  assert.equal(validateAnonymousRlsResponse({ status: 403, value: null }), 'blocked-403');
});

test('aceita 200 somente quando nenhuma escola é exposta', async () => {
  const { validateAnonymousRlsResponse } = await subject();
  assert.equal(validateAnonymousRlsResponse({ status: 200, value: [] }), 'empty-200');

  expectCode(
    () => validateAnonymousRlsResponse({ status: 200, value: [{ id: '04.10.001' }] }),
    'PRODUCTION_ANON_RLS_FAILED'
  );
});

test('rejeita respostas anônimas inesperadas ou malformadas', async () => {
  const { validateAnonymousRlsResponse } = await subject();
  expectCode(
    () => validateAnonymousRlsResponse({ status: 500, value: null }),
    'PRODUCTION_ANON_RLS_FAILED'
  );
  expectCode(
    () => validateAnonymousRlsResponse({ status: 200, value: { id: null } }),
    'PRODUCTION_ANON_RLS_FAILED'
  );
});

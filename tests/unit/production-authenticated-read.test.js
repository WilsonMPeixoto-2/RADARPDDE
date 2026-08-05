'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  REQUIRED_PROFILES,
  validateAccountsDocument,
  isSuspiciousMutationRequest,
  sanitizeObservedError
} = require('../support/production-authenticated-read.js');

function validAccounts() {
  return {
    accounts: REQUIRED_PROFILES.map((profileId, index) => ({
      profileId,
      email: `radar-smoke-${index}@example.invalid`,
      password: `Senha-Tecnica-${index}-Com-24-Caracteres!`
    }))
  };
}

test('aceita exatamente uma conta técnica por perfil', () => {
  const result = validateAccountsDocument(validAccounts());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.accounts.map(account => account.profileId), REQUIRED_PROFILES);
});

test('rejeita perfil ausente, duplicidade e senha insuficiente sem expor a senha', () => {
  const document = validAccounts();
  document.accounts.pop();
  document.accounts[1] = {
    ...document.accounts[0],
    password: 'curta'
  };

  const result = validateAccountsDocument(document);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /contas técnicas|duplicado|ausente|insuficiente/i);
  assert.doesNotMatch(result.errors.join(' '), /curta/);
});

test('classifica apenas chamadas potencialmente mutantes', () => {
  assert.equal(isSuspiciousMutationRequest('GET', 'https://example.test/rest/v1/schools'), false);
  assert.equal(isSuspiciousMutationRequest('POST', 'https://example.test/auth/v1/token?grant_type=password'), false);
  assert.equal(isSuspiciousMutationRequest('POST', 'https://example.test/rest/v1/rpc/read_context'), false);
  assert.equal(isSuspiciousMutationRequest('POST', 'https://example.test/rest/v1/pendencies'), true);
  assert.equal(isSuspiciousMutationRequest('POST', 'https://example.test/functions/v1/team-account-management'), true);
  assert.equal(isSuspiciousMutationRequest('PATCH', 'https://example.test/rest/v1/schools?id=eq.1'), true);
  assert.equal(isSuspiciousMutationRequest('DELETE', 'https://example.test/rest/v1/assets?id=eq.1'), true);
});

test('remove e-mails e tokens de erros observados', () => {
  const result = sanitizeObservedError('Falha para tecnico@example.com com Bearer abc.def.ghi');
  assert.equal(result.includes('tecnico@example.com'), false);
  assert.equal(result.includes('abc.def.ghi'), false);
  assert.match(result, /email oculto/);
  assert.match(result, /token oculto/);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SUPPORTED_PROFILES,
  WRITE_PROFILES,
  ALLOWED_READ_RPC_PATHS,
  validateAccountsDocument,
  isSuspiciousMutationRequest,
  sanitizeObservedError
} = require('../support/production-authenticated-read.js');

function account(profileId, index = 0, overrides = {}) {
  return {
    profileId,
    email: `usuario-${index}@rioeduca.net`,
    password: `senha-real-${index}`,
    ...overrides
  };
}

function allProfiles() {
  return {
    accounts: SUPPORTED_PROFILES.map((profileId, index) => account(profileId, index))
  };
}

test('aceita de uma a cinco contas reais com perfis distintos', () => {
  const one = validateAccountsDocument({ accounts: [account('controller')] });
  assert.equal(one.ok, true);
  assert.deepEqual(one.accounts.map(item => item.profileId), ['controller']);

  const all = validateAccountsDocument(allProfiles());
  assert.equal(all.ok, true);
  assert.deepEqual(all.accounts.map(item => item.profileId), SUPPORTED_PROFILES);
});

test('não impõe política de tamanho à senha real e exige apenas credencial presente', () => {
  const valid = validateAccountsDocument({
    accounts: [account('controller', 0, { password: 'abc' })]
  });
  assert.equal(valid.ok, true);

  const invalid = validateAccountsDocument({
    accounts: [account('controller', 0, { password: '' })]
  });
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(' '), /senha ausente/i);
});

test('rejeita perfil/e-mail duplicado sem expor a senha', () => {
  const document = {
    accounts: [
      account('controller', 0, { password: 'segredo-um' }),
      account('controller', 0, { password: 'segredo-dois' })
    ]
  };
  const result = validateAccountsDocument(document);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /perfil duplicado|e-mail duplicado/i);
  assert.doesNotMatch(result.errors.join(' '), /segredo-/);
});

test('ciclo de escrita exige exatamente um Controlador ou Assistente marcado', () => {
  assert.deepEqual(WRITE_PROFILES, ['controller', 'federal_assistant']);

  const controller = validateAccountsDocument({
    accounts: [account('controller', 0, { allowWrite: true })]
  }, { requireWrite: true });
  assert.equal(controller.ok, true);

  const inventory = validateAccountsDocument({
    accounts: [account('inventory', 0, { allowWrite: true })]
  }, { requireWrite: true });
  assert.equal(inventory.ok, false);
  assert.match(inventory.errors.join(' '), /não pode ser escolhido/i);

  const missing = validateAccountsDocument({
    accounts: [account('controller')]
  }, { requireWrite: true });
  assert.equal(missing.ok, false);
  assert.match(missing.errors.join(' '), /allowWrite=true/i);
});

test('classifica somente autenticação e RPC expressamente somente leitura como POST permitido', () => {
  assert.deepEqual([...ALLOWED_READ_RPC_PATHS], ['/rest/v1/rpc/current_app_role']);
  assert.equal(isSuspiciousMutationRequest('GET', 'https://example.test/rest/v1/schools'), false);
  assert.equal(isSuspiciousMutationRequest('POST', 'https://example.test/auth/v1/token?grant_type=password'), false);
  assert.equal(isSuspiciousMutationRequest('POST', 'https://example.test/rest/v1/rpc/current_app_role'), false);
  assert.equal(isSuspiciousMutationRequest('POST', 'https://example.test/rest/v1/rpc/save_school_with_programs'), true);
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

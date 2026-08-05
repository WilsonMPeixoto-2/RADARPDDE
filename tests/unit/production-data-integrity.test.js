const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const moduleUrl = pathToFileURL(
  path.resolve(__dirname, '../../scripts/check-production-data-integrity.mjs')
).href;

async function subject() {
  return import(moduleUrl);
}

const healthyPayload = {
  schemaVersion: 1,
  status: 'healthy',
  totalIssues: 0,
  checks: {
    active_controllers_without_user_id: 0,
    active_inventory_without_user_id: 0,
    active_schools_without_active_controller: 0,
    active_user_profiles_without_auth_user: 0,
    active_user_profiles_with_inactive_profile: 0,
    controller_profiles_without_valid_controller: 0,
    inventory_profiles_without_valid_member: 0,
    controller_profile_user_id_mismatch: 0,
    inventory_profile_user_id_mismatch: 0,
    users_with_multiple_active_profiles: 0,
    active_controllers_sharing_user_id: 0,
    active_inventory_members_sharing_user_id: 0,
    active_school_programs_with_inactive_endpoint: 0,
    resolved_pendencies_without_resolved_at: 0,
    canceled_pendencies_without_canceled_at: 0,
    open_pendencies_on_inactive_school_or_program: 0,
    inventoried_assets_missing_inventory_metadata: 0,
    non_inventoried_assets_with_inventory_metadata: 0,
    permanent_invoices_without_linked_asset: 0,
    linked_invoice_asset_context_mismatch: 0
  }
};

test('aceita somente payload completo e saudável', async () => {
  const { validateIntegrityPayload } = await subject();
  const result = validateIntegrityPayload(healthyPayload);
  assert.equal(result.status, 'healthy');
  assert.equal(result.totalIssues, 0);
  assert.equal(Object.keys(result.checks).length, 20);
});

test('rejeita divergência entre total, status e contagens', async () => {
  const { validateIntegrityPayload } = await subject();
  assert.throws(() => validateIntegrityPayload({
    ...healthyPayload,
    status: 'issues_detected',
    totalIssues: 0
  }), /status/u);
  assert.throws(() => validateIntegrityPayload({
    ...healthyPayload,
    totalIssues: 1
  }), /totalIssues/u);
  assert.throws(() => validateIntegrityPayload({
    ...healthyPayload,
    checks: { ...healthyPayload.checks, unexpected_check: 0 }
  }), /unexpected_check/u);
});

test('retorna erro operacional quando qualquer invariante tem ocorrência', async () => {
  const { assertHealthyIntegrity } = await subject();
  const payload = {
    ...healthyPayload,
    status: 'issues_detected',
    totalIssues: 2,
    checks: {
      ...healthyPayload.checks,
      active_controllers_without_user_id: 2
    }
  };

  assert.throws(() => assertHealthyIntegrity(payload), error => {
    assert.equal(error.code, 'PRODUCTION_DATA_INTEGRITY_FAILED');
    assert.deepEqual(error.details, {
      totalIssues: 2,
      failedChecks: [{ code: 'active_controllers_without_user_id', count: 2 }]
    });
    return true;
  });
});

test('consulta a RPC com service role sem expor a chave no resumo', async () => {
  const { runProductionDataIntegrityCheck } = await subject();
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(healthyPayload), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  const result = await runProductionDataIntegrityCheck({
    supabaseUrl: 'https://project-ref.supabase.co',
    serviceRoleKey: 'service-role-secret-test',
    fetchImpl,
    timeoutMs: 5000,
    now: (() => {
      let value = 1000;
      return () => value += 10;
    })()
  });

  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url).pathname, '/rest/v1/rpc/production_integrity_check');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret-test');
  assert.equal(result.totalIssues, 0);
  assert.equal(result.status, 'healthy');
  assert.equal(result.checkCount, 20);
  assert.doesNotMatch(JSON.stringify(result), /service-role-secret-test/u);
});

test('rejeita URL insegura, credencial ausente e resposta HTTP inválida', async () => {
  const { runProductionDataIntegrityCheck } = await subject();
  await assert.rejects(() => runProductionDataIntegrityCheck({
    supabaseUrl: 'http://project-ref.supabase.co',
    serviceRoleKey: 'secret',
    fetchImpl: fetch
  }), /HTTPS/u);
  await assert.rejects(() => runProductionDataIntegrityCheck({
    supabaseUrl: 'https://project-ref.supabase.co',
    serviceRoleKey: '',
    fetchImpl: fetch
  }), /service role/u);
  await assert.rejects(() => runProductionDataIntegrityCheck({
    supabaseUrl: 'https://project-ref.supabase.co',
    serviceRoleKey: 'secret',
    fetchImpl: async () => new Response('{"message":"failed"}', { status: 500 })
  }), error => {
    assert.equal(error.code, 'PRODUCTION_DATA_INTEGRITY_HTTP_FAILED');
    return true;
  });
});

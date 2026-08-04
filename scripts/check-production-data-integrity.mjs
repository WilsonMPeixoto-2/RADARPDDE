#!/usr/bin/env node

import process from 'node:process';
import { pathToFileURL } from 'node:url';

const INTEGRITY_CHECK_CODES = Object.freeze([
  'active_controllers_without_user_id',
  'active_inventory_without_user_id',
  'active_schools_without_active_controller',
  'active_user_profiles_without_auth_user',
  'active_user_profiles_with_inactive_profile',
  'controller_profiles_without_valid_controller',
  'inventory_profiles_without_valid_member',
  'controller_profile_user_id_mismatch',
  'inventory_profile_user_id_mismatch',
  'users_with_multiple_active_profiles',
  'active_controllers_sharing_user_id',
  'active_inventory_members_sharing_user_id',
  'active_school_programs_with_inactive_endpoint',
  'resolved_pendencies_without_resolved_at',
  'canceled_pendencies_without_canceled_at',
  'open_pendencies_on_inactive_school_or_program',
  'inventoried_assets_missing_inventory_metadata',
  'non_inventoried_assets_with_inventory_metadata',
  'permanent_invoices_without_linked_asset',
  'linked_invoice_asset_context_mismatch'
]);

function integrityError(code, message, details = null, cause = null) {
  const error = new Error(message);
  error.code = code;
  if (details) error.details = details;
  if (cause) error.cause = cause;
  return error;
}

function nonNegativeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw integrityError('PRODUCTION_DATA_INTEGRITY_PAYLOAD_INVALID', `${name} deve ser um inteiro não negativo.`);
  }
  return value;
}

function validateIntegrityPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw integrityError('PRODUCTION_DATA_INTEGRITY_PAYLOAD_INVALID', 'O payload da auditoria deve ser um objeto.');
  }
  if (value.schemaVersion !== 1) {
    throw integrityError('PRODUCTION_DATA_INTEGRITY_PAYLOAD_INVALID', 'schemaVersion inválida.');
  }
  if (!value.checks || typeof value.checks !== 'object' || Array.isArray(value.checks)) {
    throw integrityError('PRODUCTION_DATA_INTEGRITY_PAYLOAD_INVALID', 'checks deve ser um objeto.');
  }

  const receivedCodes = Object.keys(value.checks).sort();
  const expectedCodes = [...INTEGRITY_CHECK_CODES].sort();
  const missing = expectedCodes.filter(code => !receivedCodes.includes(code));
  const unexpected = receivedCodes.filter(code => !expectedCodes.includes(code));
  if (missing.length || unexpected.length) {
    throw integrityError(
      'PRODUCTION_DATA_INTEGRITY_PAYLOAD_INVALID',
      `Contrato de checks inválido; ausentes=${missing.join(',') || 'nenhum'}; inesperados=${unexpected.join(',') || 'nenhum'}.`,
      { missing, unexpected }
    );
  }

  const checks = {};
  let computedTotal = 0;
  for (const code of INTEGRITY_CHECK_CODES) {
    const count = nonNegativeInteger(value.checks[code], `checks.${code}`);
    checks[code] = count;
    computedTotal += count;
  }
  const declaredTotal = nonNegativeInteger(value.totalIssues, 'totalIssues');
  if (declaredTotal !== computedTotal) {
    throw integrityError(
      'PRODUCTION_DATA_INTEGRITY_PAYLOAD_INVALID',
      `totalIssues diverge da soma das contagens: declarado=${declaredTotal}, calculado=${computedTotal}.`
    );
  }
  const expectedStatus = declaredTotal === 0 ? 'healthy' : 'issues_detected';
  if (value.status !== expectedStatus) {
    throw integrityError(
      'PRODUCTION_DATA_INTEGRITY_PAYLOAD_INVALID',
      `status deveria ser ${expectedStatus} para totalIssues=${declaredTotal}.`
    );
  }

  return Object.freeze({
    schemaVersion: 1,
    status: expectedStatus,
    totalIssues: declaredTotal,
    checks: Object.freeze(checks)
  });
}

function assertHealthyIntegrity(value) {
  const payload = validateIntegrityPayload(value);
  if (payload.totalIssues === 0) return payload;
  const failedChecks = INTEGRITY_CHECK_CODES
    .filter(code => payload.checks[code] > 0)
    .map(code => ({ code, count: payload.checks[code] }));
  throw integrityError(
    'PRODUCTION_DATA_INTEGRITY_FAILED',
    `A auditoria encontrou ${payload.totalIssues} inconsistência(s) em ${failedChecks.length} verificação(ões).`,
    { totalIssues: payload.totalIssues, failedChecks }
  );
}

function normalizedSupabaseUrl(value) {
  let url;
  try {
    url = new URL(String(value || ''));
  } catch (_error) {
    throw new Error('RADAR_SUPABASE_URL deve ser uma URL HTTPS válida.');
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || url.username || url.password) {
    throw new Error('RADAR_SUPABASE_URL deve ser uma URL HTTPS do Supabase sem credenciais.');
  }
  return new URL('/', url).toString();
}

function requiredServiceRoleKey(value) {
  const key = String(value || '').trim();
  if (!key) throw new Error('A chave service role é obrigatória para a auditoria de integridade.');
  return key;
}

async function runProductionDataIntegrityCheck({
  supabaseUrl,
  serviceRoleKey,
  fetchImpl = fetch,
  timeoutMs = 20_000,
  now = Date.now
}) {
  const baseUrl = normalizedSupabaseUrl(supabaseUrl);
  const credential = requiredServiceRoleKey(serviceRoleKey);
  const startedAt = now();
  const rpcUrl = new URL('/rest/v1/rpc/production_integrity_check', baseUrl);
  let response;
  try {
    response = await fetchImpl(rpcUrl, {
      method: 'POST',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        apikey: credential,
        authorization: `Bearer ${credential}`,
        accept: 'application/json',
        'content-type': 'application/json',
        'cache-control': 'no-cache'
      },
      body: '{}'
    });
  } catch (error) {
    throw integrityError(
      'PRODUCTION_DATA_INTEGRITY_NETWORK_FAILED',
      'Falha de rede ao consultar a auditoria de integridade.',
      null,
      error
    );
  }
  if (!response.ok) {
    throw integrityError(
      'PRODUCTION_DATA_INTEGRITY_HTTP_FAILED',
      `A RPC de integridade respondeu HTTP ${response.status}.`,
      { status: response.status }
    );
  }

  let value;
  try {
    value = JSON.parse(await response.text());
  } catch (error) {
    throw integrityError(
      'PRODUCTION_DATA_INTEGRITY_PAYLOAD_INVALID',
      'A RPC de integridade retornou JSON inválido.',
      null,
      error
    );
  }
  const payload = assertHealthyIntegrity(value);
  return Object.freeze({
    status: payload.status,
    totalIssues: payload.totalIssues,
    checkCount: INTEGRITY_CHECK_CODES.length,
    durationMs: Math.max(0, now() - startedAt)
  });
}

async function main() {
  const result = await runProductionDataIntegrityCheck({
    supabaseUrl: process.env.RADAR_SUPABASE_URL,
    serviceRoleKey: process.env.RADAR_SUPABASE_SERVICE_ROLE_KEY
  });
  console.log(JSON.stringify({
    check: 'production-data-integrity',
    ...result
  }, null, 2));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(JSON.stringify({
      check: 'production-data-integrity',
      status: 'failed',
      code: String(error?.code || 'PRODUCTION_DATA_INTEGRITY_CHECK_FAILED'),
      message: String(error?.message || 'Falha desconhecida na auditoria de integridade.'),
      details: error?.details || null
    }, null, 2));
    process.exitCode = 1;
  });
}

export {
  INTEGRITY_CHECK_CODES,
  assertHealthyIntegrity,
  main,
  runProductionDataIntegrityCheck,
  validateIntegrityPayload
};

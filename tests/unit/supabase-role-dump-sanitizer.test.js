'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const moduleUrl = pathToFileURL(
  path.resolve(__dirname, '../../scripts/lib/sanitize-supabase-role-dump.mjs')
).href;

test('remove somente configuração e privilégio de log_min_messages incompatíveis da restauração descartável', async () => {
  const { sanitizeSupabaseRoleDump } = await import(moduleUrl);
  const input = [
    'ALTER ROLE "postgres" WITH SUPERUSER;',
    'ALTER ROLE "postgres" SET "log_min_messages" TO \'fatal\';',
    'ALTER ROLE "authenticator" SET statement_timeout TO \'8s\';',
    'GRANT SET ON PARAMETER "log_min_messages" TO "supabase_realtime_admin";',
    'GRANT "authenticated" TO "authenticator";',
    ''
  ].join('\n');

  const output = sanitizeSupabaseRoleDump(input);

  assert.match(output, /ALTER ROLE "postgres" WITH SUPERUSER;/);
  assert.doesNotMatch(output, /log_min_messages/i);
  assert.match(output, /SET statement_timeout TO '8s';/);
  assert.match(output, /GRANT "authenticated" TO "authenticator";/);
});

test('aceita sintaxe sem aspas e com sinal de igual', async () => {
  const { sanitizeSupabaseRoleDump } = await import(moduleUrl);
  const input = [
    'ALTER ROLE postgres SET log_min_messages = warning;',
    'GRANT SET ON PARAMETER log_min_messages TO supabase_realtime_admin;',
    ''
  ].join('\n');
  assert.equal(sanitizeSupabaseRoleDump(input), '');
});

test('não remove outros privilégios de parâmetro nem grants de papéis', async () => {
  const { sanitizeSupabaseRoleDump } = await import(moduleUrl);
  const input = [
    'GRANT SET ON PARAMETER statement_timeout TO "app_admin";',
    'GRANT "authenticated" TO "authenticator";',
    ''
  ].join('\n');
  const output = sanitizeSupabaseRoleDump(input);
  assert.match(output, /PARAMETER statement_timeout/);
  assert.match(output, /GRANT "authenticated" TO "authenticator"/);
});

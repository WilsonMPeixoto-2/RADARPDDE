#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const EXPECTED_HOST = 'scnryinorqeucbfkioxo.supabase.co';

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} ausente.`);
  return value;
}

const url = required('RADAR_SUPABASE_URL');
const serviceRole = required('RADAR_SUPABASE_SERVICE_ROLE_KEY');
const fixtureFile = path.resolve(required('RADAR_HML_FIXTURE_FILE'));

const target = new URL(url);
if (target.protocol !== 'https:' || target.hostname !== EXPECTED_HOST) {
  throw new Error('Projeto remoto de homologação não autorizado.');
}
if (process.env.RADAR_ALLOW_REMOTE_HOMOLOGATION !== 'true') {
  throw new Error('Limpeza remota sem autorização explícita.');
}
if (!fs.existsSync(fixtureFile)) {
  process.stdout.write(`${JSON.stringify({ ok: true, skipped: true, reason: 'fixture ausente' })}\n`);
  process.exit(0);
}

const fixture = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
const users = Array.isArray(fixture.users) ? fixture.users : [];
const userIds = users.map(user => user.userId).filter(Boolean);
const profileRowIds = users.map(user => user.profileRowId).filter(Boolean);
const recordIds = Object.values(fixture.records || {}).filter(Boolean);

const client = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

async function removeByIds(table, ids) {
  if (!ids.length) return;
  const result = await client.from(table).delete().in('id', ids);
  if (result.error) throw new Error(`Falha na limpeza de ${table}.`);
}

await removeByIds('pendency_contacts', recordIds.filter(id => id.includes('CONTACT') || id.includes('DENIED')));
await removeByIds('assets', recordIds.filter(id => id.includes('ASSET')));

if (userIds.length) {
  const logs = await client.from('administrative_logs').delete().in('actor_user_id', userIds);
  if (logs.error) throw new Error('Falha na limpeza de administrative_logs.');

  const scopes = await client.from('user_school_scopes').delete().in('user_id', userIds);
  if (scopes.error) throw new Error('Falha na limpeza de user_school_scopes.');

  const profiles = await client.from('user_profiles').delete().in('user_id', userIds);
  if (profiles.error) throw new Error('Falha na limpeza de user_profiles.');
}

const auditRecordIds = [...profileRowIds, ...recordIds];
if (userIds.length) {
  const actorEvents = await client.from('audit_events').delete().in('actor_user_id', userIds);
  if (actorEvents.error) throw new Error('Falha na limpeza dos eventos de auditoria por ator.');
}
if (auditRecordIds.length) {
  const recordEvents = await client.from('audit_events').delete().in('record_id', auditRecordIds);
  if (recordEvents.error) throw new Error('Falha na limpeza dos eventos de auditoria por registro.');
}

for (const user of [...users].reverse()) {
  const removed = await client.auth.admin.deleteUser(user.userId);
  if (removed.error && removed.error.status !== 404) {
    throw new Error(`Falha ao remover identidade temporária ${user.key || 'desconhecida'}.`);
  }
}

const remainingProfiles = userIds.length
  ? await client.from('user_profiles').select('id', { count: 'exact', head: true }).in('user_id', userIds)
  : { count: 0, error: null };
if (remainingProfiles.error || Number(remainingProfiles.count || 0) !== 0) {
  throw new Error('A limpeza deixou perfis temporários residuais.');
}

process.stdout.write(`${JSON.stringify({ ok: true, removedIdentities: users.length, runId: fixture.runId || null })}\n`);

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
const schoolId = fixture.school?.id || null;

const client = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

async function ensure(result, message) {
  if (result?.error) throw new Error(message);
  return result;
}

const recordIds = new Set(profileRowIds);
if (schoolId) {
  for (const table of ['pendency_contacts', 'registered_invoices', 'assets', 'pendencies', 'verifications', 'school_programs', 'administrative_logs']) {
    const rows = await ensure(
      await client.from(table).select('id').eq('school_id', schoolId),
      `Falha ao localizar registros temporários em ${table}.`
    );
    for (const row of rows.data || []) recordIds.add(row.id);
  }
  recordIds.add(schoolId);
}

if (schoolId) {
  await ensure(await client.from('pendency_contacts').delete().eq('school_id', schoolId), 'Falha na limpeza de pendency_contacts.');
  await ensure(await client.from('registered_invoices').delete().eq('school_id', schoolId), 'Falha na limpeza de registered_invoices.');
  await ensure(await client.from('assets').delete().eq('school_id', schoolId), 'Falha na limpeza de assets.');
  await ensure(await client.from('pendencies').delete().eq('school_id', schoolId), 'Falha na limpeza de pendencies.');
  await ensure(await client.from('verifications').delete().eq('school_id', schoolId), 'Falha na limpeza de verifications.');
  await ensure(await client.from('administrative_logs').delete().eq('school_id', schoolId), 'Falha na limpeza de administrative_logs.');
  await ensure(await client.from('school_programs').delete().eq('school_id', schoolId), 'Falha na limpeza de school_programs.');
}

if (userIds.length) {
  await ensure(await client.from('administrative_logs').delete().in('actor_user_id', userIds), 'Falha na limpeza de administrative_logs por ator.');
  await ensure(await client.from('user_school_scopes').delete().in('user_id', userIds), 'Falha na limpeza de user_school_scopes.');
  await ensure(await client.from('user_profiles').delete().in('user_id', userIds), 'Falha na limpeza de user_profiles.');
  await ensure(await client.from('audit_events').delete().in('actor_user_id', userIds), 'Falha na limpeza de audit_events por ator.');
}

if (recordIds.size) {
  await ensure(await client.from('audit_events').delete().in('record_id', [...recordIds]), 'Falha na limpeza de audit_events por registro.');
}

if (schoolId) {
  await ensure(await client.from('schools').delete().eq('id', schoolId), 'Falha na limpeza da escola temporária.');
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

const remainingSchool = schoolId
  ? await client.from('schools').select('id', { count: 'exact', head: true }).eq('id', schoolId)
  : { count: 0, error: null };
if (remainingSchool.error || Number(remainingSchool.count || 0) !== 0) {
  throw new Error('A limpeza deixou a escola temporária residual.');
}

process.stdout.write(`${JSON.stringify({ ok: true, removedIdentities: users.length, removedSchool: schoolId, runId: fixture.runId || null })}\n`);

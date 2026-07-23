#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const EXPECTED_HOST = 'scnryinorqeucbfkioxo.supabase.co';

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} ausente.`);
  return value;
}

function assertTarget(url) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== EXPECTED_HOST) {
    throw new Error('Projeto remoto de homologação não autorizado.');
  }
  if (process.env.RADAR_ALLOW_REMOTE_HOMOLOGATION !== 'true') {
    throw new Error('Homologação remota sem autorização explícita.');
  }
}

const url = required('RADAR_SUPABASE_URL');
const serviceRole = required('RADAR_SUPABASE_SERVICE_ROLE_KEY');
const password = required('RADAR_HML_PASSWORD');
const outputFile = path.resolve(required('RADAR_HML_FIXTURE_FILE'));
const runId = required('RADAR_HML_RUN_ID').replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 48);
const suffix = runId.slice(-12);

assertTarget(url);
if (password.length < 24) throw new Error('Senha efêmera de homologação insuficiente.');

const client = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const definitions = [
  { key: 'technicalAdmin', profileId: 'technical_admin', name: 'HML Administrador técnico', controllerId: null, inventoryMemberId: null, creScope: null },
  { key: 'assistant', profileId: 'federal_assistant', name: 'HML Assistente federal', controllerId: null, inventoryMemberId: null, creScope: '4ª CRE' },
  { key: 'controllerTuane', profileId: 'controller', name: 'HML Controladora Tuane', controllerId: 'tuane_coutinho', inventoryMemberId: null, creScope: '4ª CRE' },
  { key: 'controllerAlzira', profileId: 'controller', name: 'HML Controladora Alzira', controllerId: 'alzira_de_souza', inventoryMemberId: null, creScope: '4ª CRE' },
  { key: 'inventory', profileId: 'inventory', name: 'HML Inventário', controllerId: null, inventoryMemberId: 'aylane', creScope: '4ª CRE' },
  { key: 'sme', profileId: 'sme_management', name: 'HML Gestão SME', controllerId: null, inventoryMemberId: null, creScope: null }
];

const schoolId = `HML-SCHOOL-${runId}`;
const fixture = {
  runId,
  createdAt: new Date().toISOString(),
  users: [],
  school: {
    id: schoolId,
    designation: `04.11.HML-${suffix}`,
    denomination: `Unidade Temporária de Homologação ${suffix}`,
    siciBefore: `HML-SICI-${suffix}`,
    siciAfter: `HML-SICI-OK-${suffix}`,
    inventoryProcess: `HML-INV-${suffix}`,
    programId: 'BASIC',
    initialCompetence: '2026-01'
  },
  records: {
    schoolProgram: `${schoolId}::BASIC`,
    deniedSmeContact: `HML-E2E-${runId}-SME-DENIED`
  },
  values: {
    invoiceDescription: `Material de homologação ${suffix}`,
    invoiceNumber: `HML-NF-${suffix}`,
    assetDescription: `Computador de homologação ${suffix}`,
    assetInvoiceNumber: `HML-CAP-${suffix}`,
    pendencyNote: `Documento ilegível identificado na homologação ${suffix}.`,
    contactDescription: `Contato operacional confirmado na homologação ${suffix}.`,
    inventoryNote: `Tombamento validado pela homologação ${suffix}.`
  }
};

async function removeFixtureData() {
  const userIds = fixture.users.map(user => user.userId).filter(Boolean);
  if (userIds.length) {
    await client.from('administrative_logs').delete().in('actor_user_id', userIds);
    await client.from('audit_events').delete().in('actor_user_id', userIds);
    await client.from('user_school_scopes').delete().in('user_id', userIds);
    await client.from('user_profiles').delete().in('user_id', userIds);
  }
  await client.from('pendency_contacts').delete().eq('school_id', schoolId);
  await client.from('registered_invoices').delete().eq('school_id', schoolId);
  await client.from('assets').delete().eq('school_id', schoolId);
  await client.from('pendencies').delete().eq('school_id', schoolId);
  await client.from('verifications').delete().eq('school_id', schoolId);
  await client.from('administrative_logs').delete().eq('school_id', schoolId);
  await client.from('school_programs').delete().eq('school_id', schoolId);
  await client.from('audit_events').delete().eq('record_id', schoolId);
  await client.from('schools').delete().eq('id', schoolId);
  for (const user of [...fixture.users].reverse()) {
    await client.auth.admin.deleteUser(user.userId).catch(() => undefined);
  }
}

try {
  for (const definition of definitions) {
    const email = `hml-${runId}-${definition.key.toLowerCase()}@radar.local`;
    const created = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: definition.name, hmlRunId: runId }
    });
    if (created.error || !created.data.user?.id) {
      throw new Error(`Falha ao criar identidade temporária ${definition.key}.`);
    }
    fixture.users.push({
      ...definition,
      email,
      userId: created.data.user.id,
      profileRowId: randomUUID()
    });
  }

  const profiles = fixture.users.map(user => ({
    id: user.profileRowId,
    user_id: user.userId,
    profile_id: user.profileId,
    controller_id: user.controllerId,
    inventory_member_id: user.inventoryMemberId,
    cre_scope: user.creScope,
    active: true
  }));
  const linked = await client.from('user_profiles').insert(profiles).select('id');
  if (linked.error || linked.data?.length !== profiles.length) {
    throw new Error('Falha ao vincular perfis temporários de homologação.');
  }

  const school = await client.from('schools').insert({
    id: fixture.school.id,
    designation: fixture.school.designation,
    denomination: fixture.school.denomination,
    phone: '2100000000',
    institutional_mobile: '21900000000',
    email: `hml-${suffix}@rioeduca.net`,
    director_name: 'Direção HML',
    director_phone: '21911111111',
    deputy_director_name: 'Direção Adjunta HML',
    deputy_director_phone: '21922222222',
    inep: `HML${suffix}`,
    cnpj: '',
    cre: '4ª CRE',
    ra: '11ª R.A.',
    sici: fixture.school.siciBefore,
    controller_id: 'tuane_coutinho',
    inventory_process: fixture.school.inventoryProcess,
    initial_competence: fixture.school.initialCompetence,
    active: true
  }).select('id').single();
  if (school.error || school.data?.id !== fixture.school.id) {
    throw new Error('Falha ao criar a escola temporária isolada.');
  }

  const program = await client.from('school_programs').insert({
    id: fixture.records.schoolProgram,
    school_id: fixture.school.id,
    program_id: fixture.school.programId,
    active: true,
    starts_on: '2026-01-01'
  }).select('id').single();
  if (program.error || program.data?.id !== fixture.records.schoolProgram) {
    throw new Error('Falha ao vincular o programa da escola temporária.');
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(fixture, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`${JSON.stringify({ ok: true, runId, identities: fixture.users.length, schoolId })}\n`);
} catch (error) {
  await removeFixtureData();
  throw error;
}

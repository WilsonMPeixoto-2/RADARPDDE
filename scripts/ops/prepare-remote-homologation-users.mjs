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

const fixture = {
  runId,
  createdAt: new Date().toISOString(),
  users: [],
  records: {
    tuaneContact: `HML-E2E-${runId}-TUANE-CONTACT`,
    tuaneDeniedContact: `HML-E2E-${runId}-TUANE-DENIED`,
    alziraContact: `HML-E2E-${runId}-ALZIRA-CONTACT`,
    assistantContact: `HML-E2E-${runId}-ASSISTANT-CONTACT`,
    inventoryAsset: `HML-E2E-${runId}-INVENTORY-ASSET`,
    inventoryDeniedAsset: `HML-E2E-${runId}-INVENTORY-DENIED`,
    smeDeniedContact: `HML-E2E-${runId}-SME-DENIED`
  },
  expectations: {
    tuaneSchools: ['04.11.001', '04.11.002'],
    alziraSchools: ['04.31.601', '04.31.602'],
    inventorySchools: ['04.11.001', '04.31.601'],
    allHmlPendencies: [
      'HML-PEN-TUANE-OPEN',
      'HML-PEN-TUANE-REANALYSIS',
      'HML-PEN-ALZIRA-RESOLVED',
      'HML-PEN-ALZIRA-CANCELED'
    ]
  }
};

async function removeCreatedUsers() {
  const ids = fixture.users.map(user => user.userId);
  if (ids.length) {
    await client.from('user_school_scopes').delete().in('user_id', ids);
    await client.from('user_profiles').delete().in('user_id', ids);
  }
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

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(fixture, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`${JSON.stringify({ ok: true, runId, identities: fixture.users.length })}\n`);
} catch (error) {
  await removeCreatedUsers();
  throw error;
}

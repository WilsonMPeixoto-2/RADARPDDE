#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fixtures from '../supabase/fixtures/auth-users.json' with { type: 'json' };

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} ausente.`);
  return value;
}

const url = required('RADAR_SUPABASE_URL');
const publishableKey = required('RADAR_SUPABASE_PUBLISHABLE_KEY');
const password = required('RADAR_AUTH_FIXTURE_PASSWORD');

async function callAs(profileId) {
  const fixture = fixtures.find(item => item.profileId === profileId && item.active);
  if (!fixture) throw new Error(`Fixture ativa ausente para ${profileId}.`);
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({
    email: fixture.email,
    password
  });
  if (signInError || !signIn.session?.access_token) {
    throw signInError || new Error(`Sessão ausente para ${profileId}.`);
  }
  const response = await fetch(`${url}/functions/v1/team-account-management`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${signIn.session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  const body = await response.json().catch(() => ({}));
  await client.auth.signOut({ scope: 'local' });
  return { status: response.status, body };
}

const assistant = await callAs('federal_assistant');
if (assistant.status !== 400 || assistant.body?.code !== 'VALIDATION_FAILED') {
  throw new Error(`Assistente não alcançou a validação protegida: ${JSON.stringify({
    status: assistant.status,
    code: assistant.body?.code
  })}`);
}

const sme = await callAs('sme_management');
if (sme.status !== 403 || sme.body?.code !== 'PERMISSION_DENIED') {
  throw new Error(`Gestão SME não foi bloqueada corretamente: ${JSON.stringify({
    status: sme.status,
    code: sme.body?.code
  })}`);
}

console.log('Edge Function de Gestão de Equipe: compilada e autorização validada.');

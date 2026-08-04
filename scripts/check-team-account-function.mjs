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
const allowedOrigin = required('RADAR_ALLOWED_ORIGIN');
const functionUrl = `${url}/functions/v1/team-account-management`;
const hostname = new URL(url).hostname;
const isLocalStack = hostname === '127.0.0.1' || hostname === 'localhost';

async function callPreflight(origin) {
  const response = await fetch(functionUrl, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,apikey,content-type,x-client-info'
    }
  });
  const rawBody = await response.text();
  let body = {};
  try {
    body = JSON.parse(rawBody || '{}');
  } catch (_error) {
    body = { text: rawBody };
  }
  return {
    status: response.status,
    body,
    allowOrigin: response.headers.get('access-control-allow-origin'),
    allowMethods: response.headers.get('access-control-allow-methods'),
    allowHeaders: response.headers.get('access-control-allow-headers'),
    maxAge: response.headers.get('access-control-max-age'),
    vary: response.headers.get('vary')
  };
}

function supportsBrowserInvocation(preflight) {
  const methods = String(preflight.allowMethods || '').toUpperCase();
  const headers = String(preflight.allowHeaders || '').toLowerCase();
  return preflight.status === 200
    && methods.includes('POST')
    && methods.includes('OPTIONS')
    && headers.includes('authorization')
    && headers.includes('content-type');
}

async function validatePreflight() {
  const allowed = await callPreflight(allowedOrigin);
  if (!supportsBrowserInvocation(allowed)) {
    throw new Error(`Preflight autorizado inválido: ${JSON.stringify(allowed)}`);
  }

  // No ambiente local, o Kong responde ao OPTIONS antes da Edge Function e usa
  // os cabeçalhos permissivos próprios do gateway descartável. A política
  // fail-closed da função é validada por teste unitário e pelo smoke remoto de
  // produção, onde a requisição alcança efetivamente o código publicado.
  if (isLocalStack) return;

  if (allowed.allowOrigin !== allowedOrigin
      || allowed.maxAge !== '86400'
      || !String(allowed.vary || '').toLowerCase().includes('origin')) {
    throw new Error(`Política CORS remota divergente: ${JSON.stringify(allowed)}`);
  }

  const deniedOrigin = 'https://origem-nao-autorizada.invalid';
  const denied = await callPreflight(deniedOrigin);
  if (denied.status !== 403
      || denied.body?.code !== 'ORIGIN_DENIED'
      || denied.allowOrigin) {
    throw new Error(`Preflight de origem indevida não foi bloqueado: ${JSON.stringify(denied)}`);
  }
}

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
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${signIn.session.access_token}`,
      'Content-Type': 'application/json',
      Origin: allowedOrigin
    },
    body: '{}'
  });
  const body = await response.json().catch(() => ({}));
  await client.auth.signOut({ scope: 'local' });
  return { status: response.status, body };
}

await validatePreflight();

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

console.log(`Edge Function de Gestão de Equipe: preflight ${isLocalStack ? 'do gateway local' : 'remoto'}, compilação e autorização validados.`);

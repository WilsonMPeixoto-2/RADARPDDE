#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

function localServiceRoleKey() {
  const configured = String(
    process.env.RADAR_SUPABASE_SERVICE_ROLE_KEY
      || process.env.RADAR_SUPABASE_ADMIN_KEY
      || ''
  ).trim();
  if (configured) return configured;
  if (!isLocalStack) return '';

  const output = execFileSync('npx', ['supabase', 'status', '-o', 'env'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  const match = output.match(/^SERVICE_ROLE_KEY="?([^"\r\n]+)"?$/m);
  if (!match?.[1]) throw new Error('SERVICE_ROLE_KEY local não pôde ser resolvida.');
  return match[1];
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlUuid(value) {
  return `${sqlLiteral(value)}::uuid`;
}

function sqlTextArray(values) {
  return `array[${values.map(sqlLiteral).join(', ')}]::text[]`;
}

function sqlUuidArray(values) {
  return `array[${values.map(sqlUuid).join(', ')}]::uuid[]`;
}

function runLocalSql(sql) {
  if (!isLocalStack) throw new Error('SQL direto é permitido somente na pilha local descartável.');
  const directory = mkdtempSync(join(tmpdir(), 'radar-team-hml-'));
  const file = join(directory, 'query.sql');
  writeFileSync(file, sql, { encoding: 'utf8', mode: 0o600 });
  try {
    return execFileSync('npx', ['supabase', 'db', 'query', '--local', '--file', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    const detail = String(error?.stderr || error?.stdout || error?.message || error).trim();
    throw new Error(`SQL local da homologação falhou: ${detail}`, { cause: error });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

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
  // Production, onde a requisição alcança efetivamente o código publicado.
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

function fixtureFor(profileId) {
  const fixture = fixtures.find(item => item.profileId === profileId && item.active);
  if (!fixture) throw new Error(`Fixture ativa ausente para ${profileId}.`);
  return fixture;
}

function publicClient() {
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

async function signInAs(profileId) {
  const fixture = fixtureFor(profileId);
  const client = publicClient();
  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({
    email: fixture.email,
    password
  });
  if (signInError || !signIn.session?.access_token) {
    throw signInError || new Error(`Sessão ausente para ${profileId}.`);
  }
  return { client, accessToken: signIn.session.access_token };
}

async function callFunction(accessToken, payload) {
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Origin: allowedOrigin
    },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

async function callAs(profileId, payload = {}) {
  const session = await signInAs(profileId);
  try {
    return await callFunction(session.accessToken, payload);
  } finally {
    await session.client.auth.signOut({ scope: 'local' });
  }
}

function expectSuccess(response, operation) {
  assert.equal(
    response.status,
    200,
    `${operation} falhou: ${JSON.stringify({ status: response.status, body: response.body })}`
  );
  assert.equal(response.body?.ok, true, `${operation} não retornou ok=true.`);
  return response.body;
}

function insertSyntheticSchool(state) {
  runLocalSql(`
    begin;
    insert into public.schools (
      id,
      designation,
      denomination,
      cre,
      controller_id,
      active
    ) values (
      ${sqlLiteral(state.schoolId)},
      ${sqlLiteral(`99.99.${state.suffix}`)},
      ${sqlLiteral('Unidade sintética para transferência HML')},
      ${sqlLiteral('4ª CRE')},
      ${sqlLiteral(state.sourceControllerId)},
      true
    );
    commit;
  `);
}

function verifySyntheticState(state) {
  const targetUserId = state.userIds[0];
  runLocalSql(`
    do $$
    declare
      v_active_profiles integer;
      v_target_controller_active boolean;
      v_inventory_history_inactive boolean;
      v_school_controller text;
    begin
      select count(*)
      into v_active_profiles
      from public.user_profiles
      where user_id = ${sqlUuid(targetUserId)}
        and active is true;

      if v_active_profiles <> 1 then
        raise exception 'HML_ACTIVE_PROFILE_COUNT:%', v_active_profiles;
      end if;

      select exists (
        select 1
        from public.user_profiles
        where user_id = ${sqlUuid(targetUserId)}
          and profile_id = 'controller'
          and controller_id = ${sqlLiteral(state.targetControllerId)}
          and inventory_member_id is null
          and active is true
      ) into v_target_controller_active;

      if not v_target_controller_active then
        raise exception 'HML_TARGET_CONTROLLER_PROFILE_MISSING';
      end if;

      select exists (
        select 1
        from public.user_profiles
        where user_id = ${sqlUuid(targetUserId)}
          and profile_id = 'inventory'
          and inventory_member_id = ${sqlLiteral(state.inventoryMemberId)}
          and active is false
      ) into v_inventory_history_inactive;

      if not v_inventory_history_inactive then
        raise exception 'HML_INVENTORY_HISTORY_NOT_PRESERVED';
      end if;

      select controller_id
      into v_school_controller
      from public.schools
      where id = ${sqlLiteral(state.schoolId)};

      if v_school_controller is distinct from ${sqlLiteral(state.targetControllerId)} then
        raise exception 'HML_SCHOOL_NOT_REASSIGNED:%', coalesce(v_school_controller, 'null');
      end if;
    end
    $$;
  `);
}

async function cleanupSyntheticState(admin, state) {
  const failures = [];
  const recordIds = [
    state.schoolId,
    state.inventoryMemberId,
    state.targetControllerId,
    state.sourceControllerId,
    ...state.logIds
  ];

  try {
    if (state.userIds.length) {
      runLocalSql(`
        begin;
        delete from public.schools
        where id = ${sqlLiteral(state.schoolId)};

        delete from public.user_profiles
        where user_id = any(${sqlUuidArray(state.userIds)});

        delete from public.controllers
        where id = any(${sqlTextArray([state.targetControllerId, state.sourceControllerId])});

        delete from public.inventory_team_members
        where id = ${sqlLiteral(state.inventoryMemberId)};

        delete from public.administrative_logs
        where id = any(${sqlTextArray(state.logIds)});

        delete from public.audit_events
        where record_id = any(${sqlTextArray(recordIds)})
           or actor_user_id = any(${sqlUuidArray(state.userIds)})
           or coalesce(old_record ->> 'user_id', '') = any(${sqlTextArray(state.userIds)})
           or coalesce(new_record ->> 'user_id', '') = any(${sqlTextArray(state.userIds)});
        commit;
      `);
    }
  } catch (error) {
    failures.push(`dados sintéticos: ${String(error?.message || error)}`);
  }

  for (const userId of [...state.userIds].reverse()) {
    try {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    } catch (error) {
      failures.push(`usuário Auth sintético: ${String(error?.message || error)}`);
    }
  }

  if (failures.length) throw new Error(`Limpeza da homologação falhou: ${failures.join('; ')}`);
}

async function validateRoleTransitionLifecycle() {
  if (!isLocalStack) return;

  const serviceRoleKey = localServiceRoleKey();
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const suffix = randomUUID().slice(0, 8);
  const state = {
    suffix,
    targetEmail: `transicao-${suffix}@radar.local`,
    sourceEmail: `origem-${suffix}@radar.local`,
    inventoryMemberId: `hml-inventory-${suffix}`,
    targetControllerId: `hml-controller-target-${suffix}`,
    sourceControllerId: `hml-controller-source-${suffix}`,
    schoolId: `HML-SCHOOL-${suffix}`,
    userIds: [],
    logIds: [
      `hml-log-inventory-save-${suffix}`,
      `hml-log-inventory-deactivate-${suffix}`,
      `hml-log-target-controller-save-${suffix}`,
      `hml-log-source-controller-save-${suffix}`,
      `hml-log-source-controller-deactivate-${suffix}`
    ]
  };
  const session = await signInAs('federal_assistant');
  let lifecycleError = null;
  let cleanupError = null;

  try {
    for (const [email, name] of [
      [state.targetEmail, 'Pessoa em transição HML'],
      [state.sourceEmail, 'Controlador de origem HML']
    ]) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: name, radar_hml: true }
      });
      if (error || !data.user?.id) throw error || new Error('Usuário Auth sintético não foi criado.');
      state.userIds.push(data.user.id);
    }

    const targetUserId = state.userIds[0];
    const sourceUserId = state.userIds[1];

    const inventorySave = expectSuccess(await callFunction(session.accessToken, {
      operation: 'save_inventory_member',
      member: {
        id: state.inventoryMemberId,
        name: 'Pessoa em transição HML',
        email: state.targetEmail,
        cre_scope: '4ª CRE'
      },
      previousMember: null,
      administrativeLog: {
        id: state.logIds[0],
        action: 'HML — cadastrar no Inventário',
        details: { synthetic: true }
      }
    }), 'cadastro sintético no Inventário');
    assert.equal(inventorySave.userId, targetUserId);
    assert.equal(inventorySave.reusedExistingAccount, true);

    expectSuccess(await callFunction(session.accessToken, {
      operation: 'deactivate_inventory_member',
      memberId: state.inventoryMemberId,
      administrativeLog: {
        id: state.logIds[1],
        action: 'HML — desativar no Inventário',
        details: { synthetic: true }
      }
    }), 'desativação sintética no Inventário');

    const targetControllerSave = expectSuccess(await callFunction(session.accessToken, {
      operation: 'save_controller',
      controller: {
        id: state.targetControllerId,
        name: 'Pessoa em transição HML',
        email: state.targetEmail,
        cre_scope: '4ª CRE'
      },
      previousController: null,
      administrativeLog: {
        id: state.logIds[2],
        action: 'HML — converter Inventário em Controlador',
        details: { synthetic: true }
      }
    }), 'transição Inventário → Controlador');
    assert.equal(targetControllerSave.userId, targetUserId);
    assert.equal(targetControllerSave.reusedExistingAccount, true);
    assert.equal(targetControllerSave.invited, false);

    const sourceControllerSave = expectSuccess(await callFunction(session.accessToken, {
      operation: 'save_controller',
      controller: {
        id: state.sourceControllerId,
        name: 'Controlador de origem HML',
        email: state.sourceEmail,
        cre_scope: '4ª CRE'
      },
      previousController: null,
      administrativeLog: {
        id: state.logIds[3],
        action: 'HML — cadastrar controlador de origem',
        details: { synthetic: true }
      }
    }), 'cadastro do controlador de origem');
    assert.equal(sourceControllerSave.userId, sourceUserId);

    insertSyntheticSchool(state);

    const reassignment = expectSuccess(await callFunction(session.accessToken, {
      operation: 'deactivate_controller',
      controllerId: state.sourceControllerId,
      fallbackControllerId: state.targetControllerId,
      reassignedCount: 1,
      administrativeLog: {
        id: state.logIds[4],
        action: 'HML — transferir carteira e desativar origem',
        details: { synthetic: true }
      }
    }), 'transferência da carteira e desativação da origem');
    assert.equal(reassignment.result?.reassigned_count, 1);

    verifySyntheticState(state);

    const targetClient = publicClient();
    const { data: targetSignIn, error: targetSignInError } = await targetClient.auth.signInWithPassword({
      email: state.targetEmail,
      password
    });
    if (targetSignInError || !targetSignIn.session) {
      throw targetSignInError || new Error('Conta convertida não recuperou acesso.');
    }
    try {
      const { data: currentRole, error: roleError } = await targetClient.rpc('current_app_role');
      if (roleError) throw roleError;
      assert.equal(currentRole, 'controller');
    } finally {
      await targetClient.auth.signOut({ scope: 'local' });
    }
  } catch (error) {
    lifecycleError = error;
  } finally {
    await session.client.auth.signOut({ scope: 'local' });
    try {
      await cleanupSyntheticState(admin, state);
    } catch (error) {
      cleanupError = error;
    }
  }

  if (lifecycleError && cleanupError) {
    throw new AggregateError(
      [lifecycleError, cleanupError],
      `A homologação funcional falhou e a limpeza também encontrou erro: ${lifecycleError.message}`
    );
  }
  if (lifecycleError) throw lifecycleError;
  if (cleanupError) throw cleanupError;
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

await validateRoleTransitionLifecycle();

console.log(`Edge Function de Gestão de Equipe: preflight ${isLocalStack ? 'do gateway local' : 'remoto'}, autorização e transição integral de perfil validados.`);

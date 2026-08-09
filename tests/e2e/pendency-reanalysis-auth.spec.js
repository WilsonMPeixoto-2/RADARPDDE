const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local, Auth e RLS reais.');

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

function fixtureFor(profileId) {
  const fixture = fixtures.find(item => item.profileId === profileId && item.active);
  if (!fixture) throw new Error(`Fixture ativa ausente para ${profileId}.`);
  return fixture;
}

async function signInProfile(page, profileId) {
  const fixture = fixtureFor(profileId);
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(expectedRole => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === expectedRole
  ), profileId);
  return fixture;
}

async function signOut(page) {
  await page.evaluate(async () => {
    await window.RadarSessionContext?.service?.signOut();
    window.RadarAuthContext = null;
  });
  await page.reload();
  await page.waitForFunction(() => {
    const form = document.querySelector('#radar-auth-form');
    return form && form.hidden === false;
  });
}

async function seedAwaitingPendency(page, { schoolId, documentKey, suffix }) {
  return page.evaluate(async input => {
    if (typeof window.switchProfile === 'function') window.switchProfile('controlador');
    const services = window.RadarApplicationServices;
    const compKey = '2026-05_BASIC';
    const pendencyId = `E2E-PEND-${input.suffix}`;
    const attemptId = `E2E-ATT-${input.suffix}`;

    await services.verifications.setBonification({
      schoolId: input.schoolId,
      compKey,
      documentKey: input.documentKey,
      value: 'Sim'
    });
    await services.verifications.setTechnicalAnalysis({
      schoolId: input.schoolId,
      compKey,
      documentKey: input.documentKey,
      value: 'Incorreto'
    });
    await services.pendencies.open({
      id: pendencyId,
      schoolId: input.schoolId,
      competence: '2026-05',
      programId: 'BASIC',
      documentKey: input.documentKey,
      item: `Documento E2E ${input.suffix}`,
      errors: ['Sem assinatura'],
      observation: 'Pendência criada para validar reanálise autenticada.'
    });
    await services.pendencies.registerAttempt({
      pendencyId,
      attemptId,
      availabilityDate: '2026-08-09',
      observation: 'Documento corrigido e reenviado para reanálise.',
      link: `https://example.test/${input.suffix}`
    });

    const repository = services.data.repository;
    const [pendencies, attempts, verifications] = await Promise.all([
      repository.load('pendencies'),
      repository.load('pendencyAttempts'),
      repository.load('verifications')
    ]);
    const pendency = pendencies.find(row => row.id === pendencyId);
    const attempt = attempts.find(row => row.id === attemptId);
    const verification = verifications.find(row => (
      row.school_id === input.schoolId
      && row.competence_id === '2026-05'
      && row.program_id === 'BASIC'
    ));
    if (!pendency || !attempt || !verification) {
      throw new Error('Agregado E2E não foi persistido integralmente no Supabase local.');
    }

    return {
      pendencyId,
      attemptId,
      schoolId: input.schoolId,
      documentKey: input.documentKey,
      verificationId: verification.id,
      pendencyRecord: pendency,
      attemptRecord: attempt,
      verificationRecord: verification
    };
  }, { schoolId, documentKey, suffix });
}

async function refreshTargetSnapshot(page, target) {
  return page.evaluate(async current => {
    const repository = window.RadarApplicationServices?.data?.repository;
    if (!repository) throw new Error('Repositório Supabase indisponível para atualizar snapshot E2E.');
    const [pendencies, attempts, verifications] = await Promise.all([
      repository.load('pendencies'),
      repository.load('pendencyAttempts'),
      repository.load('verifications')
    ]);
    const pendency = pendencies.find(row => row.id === current.pendencyId);
    const attempt = attempts.find(row => row.id === current.attemptId);
    const verification = verifications.find(row => row.id === current.verificationId);
    if (!pendency || !attempt || !verification) {
      throw new Error('Não foi possível atualizar o snapshot E2E do agregado.');
    }
    return {
      ...current,
      pendencyRecord: pendency,
      attemptRecord: attempt,
      verificationRecord: verification
    };
  }, target);
}

async function expectDirectRpcDenied(page, ids) {
  const denial = await page.evaluate(async target => {
    const client = window.RadarSessionContext?.service?.client;
    if (!client) throw new Error('Cliente Supabase autenticado ausente.');

    // O payload e as versões são capturados após toda a preparação pelo Admin.
    // A própria RPC pode ocultar a pendência antes da checagem de escrita;
    // NOT_FOUND e AUTHORIZATION_DENIED são ambas recusas seguras da mutação.
    const pendency = target.pendencyRecord;
    const attempt = target.attemptRecord;
    const verification = target.verificationRecord;
    const now = new Date().toISOString();
    const role = window.RadarAuthContext?.authorization?.role || 'unknown';
    const { error } = await client.rpc('reanalyze_pendency_with_verification', {
      p_pendency: {
        ...pendency,
        status: 'Resolvida',
        resolved_at: now,
        payload: pendency.payload || {}
      },
      p_attempt: {
        ...attempt,
        analyzed_at: now,
        result: 'correto',
        observation: 'Tentativa de reanálise que deve ser negada pelo RLS.',
        errors: [],
        payload: attempt.payload || {}
      },
      p_verification_patch: {
        ...verification,
        analysis: {
          ...(verification.analysis || {}),
          [target.documentKey]: 'Correto'
        },
        bonification: verification.bonification || {},
        payload: verification.payload || {}
      },
      p_expected_pendency_version: pendency.row_version,
      p_expected_verification_version: verification.row_version,
      p_administrative_log: {
        id: crypto.randomUUID(),
        school_id: pendency.school_id,
        user_identifier: 'e2e-negative',
        profile_name: role,
        action: 'Reanálise E2E negada',
        details: { source: 'pendency-reanalysis-auth' },
        event_at: now
      }
    });

    return {
      code: error?.code || null,
      message: error?.message || null
    };
  }, ids);

  const safelyDenied = ['AUTHORIZATION_DENIED', 'NOT_FOUND']
    .some(token => denial.message?.includes(token));
  expect(safelyDenied, `RPC deveria negar a reanálise, mas retornou: ${denial.message || denial.code || 'sem erro'}`).toBe(true);
}

async function reanalyzeAndReload(page, ids, options = {}) {
  return page.evaluate(async ({ target, simulatedProfile }) => {
    if (simulatedProfile && typeof window.switchProfile === 'function') {
      window.switchProfile(simulatedProfile);
    }
    const effectiveProfile = typeof window.getRadarAccessProfile === 'function'
      ? window.getRadarAccessProfile()
      : null;
    const authenticatedUserId = window.RadarAuthContext?.user?.id || null;
    const authenticatedRole = window.RadarAuthContext?.authorization?.role || null;
    const services = window.RadarApplicationServices;
    await services.pendencies.reanalyze({
      pendencyId: target.pendencyId,
      result: 'correto',
      observation: `Reanálise autenticada concluída por ${authenticatedRole}.`
    });

    const repository = services.data.repository;
    const [pendencies, attempts, verifications, logs] = await Promise.all([
      repository.load('pendencies'),
      repository.load('pendencyAttempts'),
      repository.load('verifications'),
      repository.load('administrativeLogs')
    ]);
    const pendency = pendencies.find(row => row.id === target.pendencyId);
    const attempt = attempts.find(row => row.id === target.attemptId);
    const verification = verifications.find(row => row.id === target.verificationId);
    const log = logs.find(row => (
      row.school_id === target.schoolId
      && row.action === 'Reanálise registrada'
      && row.actor_user_id === authenticatedUserId
      && row.details?.authenticatedRole === authenticatedRole
    ));

    return {
      effectiveProfile,
      pendencyStatus: pendency?.status,
      attemptResult: attempt?.result,
      attemptAnalysisObservation: attempt?.payload?.observacaoAnalise,
      analysisValue: verification?.analysis?.[target.documentKey],
      actorUserId: log?.actor_user_id,
      profileName: log?.profile_name,
      auditAuthenticatedRole: log?.details?.authenticatedRole,
      auditSimulatedProfile: log?.details?.simulatedProfile ?? null
    };
  }, { target: ids, simulatedProfile: options.simulatedProfile || null });
}

test('reanálise autenticada respeita Controlador, Assistente, Admin e bloqueia SME/Inventário', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  await signInProfile(page, 'technical_admin');
  const controllerTarget = await seedAwaitingPendency(page, {
    schoolId: 'ESC-LOCAL',
    documentKey: `e2e-controller-${stamp}`,
    suffix: `controller-${stamp}`
  });
  const assistantTarget = await seedAwaitingPendency(page, {
    schoolId: 'ESC-OTHER',
    documentKey: `e2e-assistant-${stamp}`,
    suffix: `assistant-${stamp}`
  });
  const adminTarget = await seedAwaitingPendency(page, {
    schoolId: 'ESC-OTHER',
    documentKey: `e2e-admin-${stamp}`,
    suffix: `admin-${stamp}`
  });
  const restrictedTarget = await refreshTargetSnapshot(page, assistantTarget);
  await signOut(page);

  await signInProfile(page, 'sme_management');
  await expectDirectRpcDenied(page, restrictedTarget);
  await signOut(page);

  await signInProfile(page, 'inventory');
  await expectDirectRpcDenied(page, restrictedTarget);
  await signOut(page);

  const controllerFixture = await signInProfile(page, 'controller');
  const controllerResult = await reanalyzeAndReload(page, controllerTarget);
  expect(controllerResult.pendencyStatus).toBe('Resolvida');
  expect(controllerResult.attemptResult).toBe('correto');
  expect(controllerResult.attemptAnalysisObservation).toContain('Reanálise autenticada');
  expect(controllerResult.analysisValue).toContain('Correto');
  expect(controllerResult.actorUserId).toBe(controllerFixture.id);
  expect(controllerResult.profileName).toBe('Controlador');
  expect(controllerResult.auditAuthenticatedRole).toBe('controlador');
  expect(controllerResult.auditSimulatedProfile).toBeNull();
  await signOut(page);

  const assistantFixture = await signInProfile(page, 'federal_assistant');
  const assistantResult = await reanalyzeAndReload(page, assistantTarget);
  expect(assistantResult.pendencyStatus).toBe('Resolvida');
  expect(assistantResult.attemptResult).toBe('correto');
  expect(assistantResult.attemptAnalysisObservation).toContain('Reanálise autenticada');
  expect(assistantResult.analysisValue).toContain('Correto');
  expect(assistantResult.actorUserId).toBe(assistantFixture.id);
  expect(assistantResult.profileName).toBe('Assistente de Verbas Federais');
  expect(assistantResult.auditAuthenticatedRole).toBe('assistente');
  expect(assistantResult.auditSimulatedProfile).toBeNull();
  await signOut(page);

  const adminFixture = await signInProfile(page, 'technical_admin');
  const adminResult = await reanalyzeAndReload(page, adminTarget, { simulatedProfile: 'sme' });
  expect(adminResult.effectiveProfile).toBe('sme');
  expect(adminResult.pendencyStatus).toBe('Resolvida');
  expect(adminResult.attemptResult).toBe('correto');
  expect(adminResult.attemptAnalysisObservation).toContain('Reanálise autenticada');
  expect(adminResult.analysisValue).toContain('Correto');
  expect(adminResult.actorUserId).toBe(adminFixture.id);
  expect(adminResult.profileName).toBe('Administrador técnico');
  expect(adminResult.auditAuthenticatedRole).toBe('technical_admin');
  expect(adminResult.auditSimulatedProfile).toBe('sme');
});

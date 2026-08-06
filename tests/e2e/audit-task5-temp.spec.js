const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local, Auth e RLS reais.');
test.describe.configure({ mode: 'serial' });

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

async function signInProfile(page, profileId) {
  const fixture = fixtures.find(item => item.profileId === profileId && item.active);
  if (!fixture) throw new Error(`Fixture ativa ausente para ${profileId}.`);
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(expectedRole => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === expectedRole
  ), profileId);
  await expect(page.locator('#app-layout')).toBeVisible();
}

async function reloadAuthenticated(page, profileId) {
  await page.reload();
  await page.waitForFunction(expectedRole => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === expectedRole
  ), profileId);
}

test('CFG-01 a CFG-04 persistem, versionam, auditam e sobrevivem ao reload', async ({ page }) => {
  await signInProfile(page, 'sme_management');

  const created = await page.evaluate(async stamp => {
    const services = window.RadarApplicationServices;
    const repository = services.data.repository;
    const usedYears = new Set((config.exercicios || []).map(String));
    const year = ['2099', '2098', '2097', '2096', '2095']
      .find(candidate => !usedYears.has(candidate));
    if (!year) throw new Error('Não há exercício reservado disponível para a auditoria.');

    const exercise = await services.configuration.createExercise({
      year,
      initialMonth: '03'
    });
    const calendar = await services.configuration.saveCalendar({
      closingCompetence: `${year}-04`,
      bonusWindowExtended: true
    });
    const program = await services.directory.saveProgram({
      name: `AUDIT5 Programa ${stamp}`,
      description: 'Programa sintético da auditoria funcional.'
    });
    const programId = program.value.program.id;
    await services.directory.deactivateProgram({ programId });

    const [configs, competences, programs, logs] = await Promise.all([
      repository.load('appConfig'),
      repository.load('competences'),
      repository.load('programs'),
      repository.load('administrativeLogs')
    ]);
    const savedProgram = programs.find(item => item.id === programId);
    const savedConfig = configs.find(item => item.id === 'global');
    return {
      year,
      programId,
      initialCompetence: exercise.value.initialCompetence,
      closingCompetence: calendar.value.closingCompetence,
      programActive: savedProgram?.active,
      programVersion: savedProgram?.row_version,
      configClosing: savedConfig?.closing_competence,
      configVersion: savedConfig?.row_version,
      competenceCount: competences.filter(item => item.exercise === Number(year)).length,
      actions: logs.map(item => item.action)
    };
  }, Date.now());

  expect(created.initialCompetence).toBe(`${created.year}-03`);
  expect(created.closingCompetence).toBe(`${created.year}-04`);
  expect(created.programActive).toBe(false);
  expect(created.programVersion).toBeGreaterThanOrEqual(2);
  expect(created.configClosing).toBe(`${created.year}-04`);
  expect(created.configVersion).toBeGreaterThanOrEqual(3);
  expect(created.competenceCount).toBe(12);
  expect(created.actions).toEqual(expect.arrayContaining([
    'Exercício Criado',
    'Calendário Alterado',
    'Programa Cadastrado',
    'Programa Desativado'
  ]));

  await reloadAuthenticated(page, 'sme_management');
  const afterReload = await page.evaluate(async ids => {
    const repository = window.RadarApplicationServices.data.repository;
    const [configs, competences, programs] = await Promise.all([
      repository.load('appConfig'),
      repository.load('competences'),
      repository.load('programs')
    ]);
    return {
      closing: configs.find(item => item.id === 'global')?.closing_competence,
      competenceCount: competences.filter(item => item.exercise === Number(ids.year)).length,
      programActive: programs.find(item => item.id === ids.programId)?.active
    };
  }, created);
  expect(afterReload).toEqual({
    closing: `${created.year}-04`,
    competenceCount: 12,
    programActive: false
  });
});

test('VER-01 a VER-04 usam RPC atômica, versão, autoria e releitura', async ({ page }) => {
  await signInProfile(page, 'federal_assistant');

  const result = await page.evaluate(async stamp => {
    const services = window.RadarApplicationServices;
    const repository = services.data.repository;
    const futureYear = [...(config.exercicios || [])]
      .map(String)
      .filter(value => /^209[5-9]$/.test(value))
      .sort()
      .at(-1);
    if (!futureYear) throw new Error('Exercício reservado da Task 5 não localizado.');
    const competence = `${futureYear}-05`;
    const programId = 'BASIC';
    const activeStatuses = new Set(['Aberta', 'Aguardando reanálise']);
    const school = escolas.find(candidate => (
      candidate.programasIds?.includes(programId)
      && !pendencias.some(item => (
        item.escolaId === candidate.id
        && (item.competenciaOrigem || item.competencia) === competence
        && item.programaId === programId
        && activeStatuses.has(item.status)
      ))
    ));
    if (!school) throw new Error('Escola sem pendência ativa não localizada.');
    const compKey = `${competence}_${programId}`;
    const profile = 'assistente';

    await services.verifications.setBonification({
      profile, schoolId: school.id, compKey, documentKey: 'extCC', value: 'Sim'
    });
    await services.verifications.setTechnicalAnalysis({
      profile, schoolId: school.id, compKey, documentKey: 'extCC', value: 'Correto'
    });
    for (const [documentKey, value] of [
      ['extINV', 'Sim'],
      ['notaFiscal', 'Não se aplica'],
      ['consAssessoria', 'Não se aplica'],
      ['declBBAgil', 'Sim'],
      ['encampInventario', 'Não se aplica']
    ]) {
      await services.verifications.setBonification({
        profile, schoolId: school.id, compKey, documentKey, value
      });
    }
    const consolidated = await services.verifications.closeBonification({
      profile, schoolId: school.id, compKey
    });
    const current = verificacoes[school.id][compKey];
    const retifiedBonification = {
      ...current.bonificacao,
      extCC: 'Não'
    };
    await services.verifications.retify({
      profile,
      schoolId: school.id,
      compKey,
      programId,
      bonification: retifiedBonification,
      bonusResult: 'inapta',
      justification: `AUDIT5 retificação documentada ${stamp}`
    });

    const verificationId = `${school.id}::${competence}::${programId}`;
    const [verificationsRemote, logs] = await Promise.all([
      repository.load('verifications'),
      repository.load('administrativeLogs')
    ]);
    const saved = verificationsRemote.find(item => item.id === verificationId);
    const relatedLogs = logs.filter(item => item.school_id === school.id);
    return {
      schoolId: school.id,
      competence,
      programId,
      verificationId,
      consolidatedResult: consolidated.value.result,
      bonification: saved?.bonification,
      analysis: saved?.analysis,
      bonusResult: saved?.bonus_result,
      rowVersion: saved?.row_version,
      actions: relatedLogs.map(item => item.action),
      actorIds: relatedLogs
        .filter(item => [
          'Bonificação Alterada',
          'Análise Técnica Alterada',
          'Bonificação Consolidada',
          'Consolidação retificada'
        ].includes(item.action))
        .map(item => item.actor_user_id)
    };
  }, Date.now());

  expect(['apta', 'inapta']).toContain(result.consolidatedResult);
  expect(result.bonification.extCC).toBe('Não');
  expect(result.analysis.extCC).toMatch(/^Correto/);
  expect(result.bonusResult).toBe('inapta');
  expect(result.rowVersion).toBeGreaterThanOrEqual(8);
  expect(result.actions).toEqual(expect.arrayContaining([
    'Bonificação Alterada',
    'Análise Técnica Alterada',
    'Bonificação Consolidada',
    'Consolidação retificada'
  ]));
  expect(result.actorIds.length).toBeGreaterThanOrEqual(4);
  expect(result.actorIds.every(Boolean)).toBe(true);

  await reloadAuthenticated(page, 'federal_assistant');
  const afterReload = await page.evaluate(async verificationId => {
    const rows = await window.RadarApplicationServices.data.repository.load('verifications');
    const saved = rows.find(item => item.id === verificationId);
    return {
      extCC: saved?.bonification?.extCC,
      bonusResult: saved?.bonus_result,
      rowVersion: saved?.row_version
    };
  }, result.verificationId);
  expect(afterReload.extCC).toBe('Não');
  expect(afterReload.bonusResult).toBe('inapta');
  expect(afterReload.rowVersion).toBe(result.rowVersion);
});

test('PEND-01 a PEND-06 persistem transições, tentativas, contato e invariantes', async ({ page }) => {
  await signInProfile(page, 'controller');

  const result = await page.evaluate(async stamp => {
    const services = window.RadarApplicationServices;
    const repository = services.data.repository;
    const futureYear = [...(config.exercicios || [])]
      .map(String)
      .filter(value => /^209[5-9]$/.test(value))
      .sort()
      .at(-1);
    if (!futureYear) throw new Error('Exercício reservado da Task 5 não localizado.');
    const competence = `${futureYear}-06`;
    const programId = 'BASIC';
    const school = escolas.find(candidate => candidate.programasIds?.includes(programId));
    if (!school) throw new Error('Escola da carteira do Controlador não localizada.');
    const compKey = `${competence}_${programId}`;
    const profile = 'controlador';
    const firstId = `AUDIT5-PEND-RESOLVE-${stamp}`;
    const secondId = `AUDIT5-PEND-REOPEN-${stamp}`;

    for (const documentKey of ['extCC', 'extINV']) {
      await services.verifications.setBonification({
        profile, schoolId: school.id, compKey, documentKey, value: 'Sim'
      });
      await services.verifications.setTechnicalAnalysis({
        profile, schoolId: school.id, compKey, documentKey, value: 'Incorreto'
      });
    }

    await services.pendencies.open({
      id: firstId,
      schoolId: school.id,
      competence,
      programId,
      documentKey: 'extCC',
      item: 'Extrato Conta Corrente',
      errors: ['AUDIT5 documento ilegível'],
      observation: 'AUDIT5 abertura controlada.'
    });
    await services.pendencies.registerAttempt({
      pendencyId: firstId,
      attemptId: `AUDIT5-ATTEMPT-1-${stamp}`,
      availabilityDate: `${futureYear}-06-10`,
      observation: 'AUDIT5 primeiro envio.'
    });
    await services.pendencies.reanalyze({
      pendencyId: firstId,
      result: 'incorreto',
      errors: ['AUDIT5 divergência remanescente'],
      observation: 'AUDIT5 reanálise incorreta.'
    });
    await services.pendencies.registerAttempt({
      pendencyId: firstId,
      attemptId: `AUDIT5-ATTEMPT-2-${stamp}`,
      availabilityDate: `${futureYear}-06-11`,
      observation: 'AUDIT5 segundo envio.'
    });
    await services.pendencies.reanalyze({
      pendencyId: firstId,
      result: 'correto',
      observation: 'AUDIT5 regularização confirmada.'
    });

    await services.pendencies.open({
      id: secondId,
      schoolId: school.id,
      competence,
      programId,
      documentKey: 'extINV',
      item: 'Extrato Investimento',
      errors: ['AUDIT5 documento incompleto'],
      observation: 'AUDIT5 segunda abertura.'
    });
    await services.pendencies.cancel({
      pendencyId: secondId,
      justification: 'AUDIT5 cancelamento controlado.'
    });
    await services.pendencies.reopen({
      pendencyId: secondId,
      justification: 'AUDIT5 nova inconsistência confirmada.',
      errors: ['AUDIT5 documento incompleto novamente']
    });
    await services.pendencies.registerContact({
      id: `AUDIT5-CONTACT-${stamp}`,
      operationId: `AUDIT5-CONTACT-OP-${stamp}`,
      pendencyId: secondId,
      channel: 'E-mail',
      description: 'AUDIT5 direção comunicada.',
      serviceDate: `${futureYear}-06-12`
    });

    const [pendenciesRemote, attempts, contacts, verificationsRemote, logs] = await Promise.all([
      repository.load('pendencies'),
      repository.load('pendencyAttempts'),
      repository.load('pendencyContacts'),
      repository.load('verifications'),
      repository.load('administrativeLogs')
    ]);
    const first = pendenciesRemote.find(item => item.id === firstId);
    const second = pendenciesRemote.find(item => item.id === secondId);
    const verificationId = `${school.id}::${competence}::${programId}`;
    const verification = verificationsRemote.find(item => item.id === verificationId);
    const auditLogs = logs.filter(item => item.school_id === school.id && item.action);
    return {
      firstId,
      secondId,
      verificationId,
      firstStatus: first?.status,
      firstVersion: first?.row_version,
      secondStatus: second?.status,
      secondVersion: second?.row_version,
      attemptCount: attempts.filter(item => item.pendency_id === firstId).length,
      attemptResults: attempts.filter(item => item.pendency_id === firstId).map(item => item.result),
      contactCount: contacts.filter(item => item.pendency_id === secondId).length,
      contactOperationIds: contacts.filter(item => item.pendency_id === secondId).map(item => item.operation_id),
      analysisExtCC: verification?.analysis?.extCC,
      bonificationExtCC: verification?.bonification?.extCC,
      actions: auditLogs.map(item => item.action),
      actorIds: auditLogs
        .filter(item => item.action.includes('Pendência') || item.action.includes('envio')
          || item.action.includes('Reanálise') || item.action.includes('Contato'))
        .map(item => item.actor_user_id)
    };
  }, Date.now());

  expect(result.firstStatus).toBe('Resolvida');
  expect(result.firstVersion).toBeGreaterThanOrEqual(5);
  expect(result.secondStatus).toBe('Aberta');
  expect(result.secondVersion).toBeGreaterThanOrEqual(3);
  expect(result.attemptCount).toBe(2);
  expect(result.attemptResults).toEqual(expect.arrayContaining(['incorreto', 'correto']));
  expect(result.contactCount).toBe(1);
  expect(result.contactOperationIds[0]).toMatch(/^AUDIT5-CONTACT-OP-/);
  expect(result.analysisExtCC).toMatch(/^Correto/);
  expect(result.bonificationExtCC).toBe('Sim');
  expect(result.actions).toEqual(expect.arrayContaining([
    'Pendência Aberta',
    'Novo envio registrado',
    'Reanálise registrada',
    'Pendência Cancelada',
    'Pendência Reaberta',
    'Contato Registrado'
  ]));
  expect(result.actorIds.length).toBeGreaterThanOrEqual(8);
  expect(result.actorIds.every(Boolean)).toBe(true);

  await reloadAuthenticated(page, 'controller');
  const afterReload = await page.evaluate(async ids => {
    const repository = window.RadarApplicationServices.data.repository;
    const [pendenciesRemote, attempts, contacts] = await Promise.all([
      repository.load('pendencies'),
      repository.load('pendencyAttempts'),
      repository.load('pendencyContacts')
    ]);
    return {
      firstStatus: pendenciesRemote.find(item => item.id === ids.firstId)?.status,
      secondStatus: pendenciesRemote.find(item => item.id === ids.secondId)?.status,
      attempts: attempts.filter(item => item.pendency_id === ids.firstId).length,
      contacts: contacts.filter(item => item.pendency_id === ids.secondId).length
    };
  }, result);
  expect(afterReload).toEqual({
    firstStatus: 'Resolvida',
    secondStatus: 'Aberta',
    attempts: 2,
    contacts: 1
  });
});

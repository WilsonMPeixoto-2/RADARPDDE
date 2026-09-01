const { test, expect } = require('@playwright/test');

function programRows(page, programId = 'BASIC') {
  return page.locator(`#prontuario-verif-rows tr[data-program-id="${programId}"]`);
}

function documentRow(page, label, programId = 'BASIC') {
  return programRows(page, programId).filter({ hasText: label }).first();
}

async function markDeliveredAndCorrect(page, label, programId = 'BASIC') {
  const row = documentRow(page, label, programId);
  await row.getByRole('button', { name: 'Sim', exact: true }).click();
  await row.locator('select.select-analise').selectOption('Correto');
  await expect(row.locator('select.select-analise')).toHaveValue('Correto');
}

test('controlador lança agosto, consolida APTA e recupera o estado após nova sessão', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Jornada mensal completa validada no desktop.');

  const pageErrors = [];
  const dialogs = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });

  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.RadarCompetenceContext?.isInitialized?.()));
  await page.locator('#global-competence-select').selectOption('2026-08');

  const context = await page.evaluate(() => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    const compProgKey = `${competencia}_BASIC`;

    verificacoes[escola.id] = verificacoes[escola.id] || {};
    delete verificacoes[escola.id][compProgKey];
    pendencias = pendencias.filter(pendency => !(
      pendency.escolaId === escola.id
      && (pendency.competenciaOrigem || pendency.competencia) === competencia
      && (!pendency.programaId || pendency.programaId === 'BASIC')
    ));
    rebuildOperationalIndexes();
    persist();

    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);
    return { escolaId: escola.id, competencia, compProgKey };
  });

  expect(context.competencia).toBe('2026-08');
  await expect(programRows(page, 'BASIC')).toHaveCount(6);

  await markDeliveredAndCorrect(page, 'Extrato Conta Corrente');
  await markDeliveredAndCorrect(page, 'Extrato Investimento');
  await markDeliveredAndCorrect(page, 'Declaração BB Ágil');

  const fiscalRow = documentRow(page, 'Notas Fiscais');
  await fiscalRow.getByRole('button', { name: 'N/A', exact: true }).click();
  await expect(
    fiscalRow.locator('.invoice-bonification-toggle button.is-na.is-selected')
  ).toHaveText('N/A');
  await expect(
    fiscalRow.locator('.invoice-document-panel-summary').getByText('Situação técnica', { exact: true })
  ).toHaveCount(0);

  const basicProgramFirstRow = programRows(page, 'BASIC').first();
  await basicProgramFirstRow.getByRole('button', { name: 'Consolidar', exact: true }).click();
  await expect(basicProgramFirstRow.getByRole('button', { name: 'Consolidada', exact: true })).toBeVisible();

  const consolidated = await page.evaluate(({ escolaId, compProgKey }) => {
    const verification = verificacoes[escolaId][compProgKey];
    return {
      result: verification.resultadoBonif,
      evaluation: radarVerificationService.getMonthlyEvaluation({
        schoolId: escolaId,
        compKey: compProgKey
      }),
      persisted: JSON.parse(localStorage.getItem('radar_pdde_verificacoes'))[escolaId][compProgKey],
      logCount: logs.filter(log => (
        log.acao === 'Bonificação Consolidada'
        && (log.escolaId || log.school_id) === escolaId
      )).length
    };
  }, context);

  expect(consolidated.result).toBe('apta');
  expect(consolidated.evaluation).toMatchObject({
    canConsolidate: true,
    bonusResult: 'apta',
    bonificationStatus: 'apta',
    technicalStatus: 'correto',
    technicalCompletion: 'complete'
  });
  expect(consolidated.persisted.resultadoBonif).toBe('apta');
  expect(consolidated.logCount).toBeGreaterThanOrEqual(1);

  await page.reload();
  await page.waitForFunction(() => Boolean(window.RadarCompetenceContext?.isInitialized?.()));
  const currentCompetenceAfterReload = await page.evaluate(() => (
    window.RadarCompetencia.competenceKeyFromDate(new Date())
  ));
  await expect(page.locator('#global-competence-select')).toHaveValue(currentCompetenceAfterReload);
  await page.locator('#global-competence-select').selectOption('2026-08');

  await page.evaluate(({ escolaId, competencia }) => {
    switchProfile('controlador');
    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escolaId);
  }, context);

  await expect(programRows(page, 'BASIC').first().getByRole('button', {
    name: 'Consolidada',
    exact: true
  })).toBeVisible();
  expect(await page.evaluate(({ escolaId, compProgKey }) => ({
    result: verificacoes[escolaId][compProgKey].resultadoBonif,
    evaluation: radarVerificationService.getMonthlyEvaluation({
      schoolId: escolaId,
      compKey: compProgKey
    })
  }), context)).toMatchObject({
    result: 'apta',
    evaluation: {
      bonusResult: 'apta',
      technicalStatus: 'correto',
      technicalCompletion: 'complete'
    }
  });

  expect(dialogs.filter(message => message.includes('Preencha todos os itens')).length).toBe(0);
  expect(pageErrors).toEqual([]);
});

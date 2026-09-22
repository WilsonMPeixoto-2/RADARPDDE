const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

test.describe('Prontuário — preservação de rolagem na avaliação', () => {
  test('mantém a posição ao marcar Sim/Não/N/A em bonificação que exige re-render completo', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do alvo homologado desktop.');

    await page.goto('/');
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await selectFixtureCompetence(page);

    const context = await page.evaluate(() => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const escola = escolas
        .filter(candidate => (
          Array.isArray(candidate.programasIds)
          && candidate.programasIds.length >= 3
          && isCompetenceInScope(candidate.competenciaInicial, competencia)
        ))
        .sort((left, right) => right.programasIds.length - left.programasIds.length)[0];

      if (!escola) throw new Error('Fixture sem escola com programas suficientes para testar rolagem.');

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      escola.programasIds.forEach(programId => {
        delete verificacoes[escola.id][`${competencia}_${programId}`];
      });

      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);

      return {
        escolaId: escola.id,
        programaId: escola.programasIds[escola.programasIds.length - 1],
        competencia
      };
    });

    await expect.poll(() => page.evaluate(() => (
      Boolean(window.RadarProntuarioScrollPreservation)
      && window.__radarProntuarioScrollPreservationInstalled === true
    ))).toBe(true);

    const contentArea = page.locator('main.content-area');
    const fiscalRow = page.locator(
      `#prontuario-verif-rows tr[data-program-id="${context.programaId}"][data-document-key="notaFiscal"]`
    );
    const naButton = fiscalRow.getByRole('button', { name: 'N/A', exact: true });

    await fiscalRow.scrollIntoViewIfNeeded();
    await expect(naButton).toBeVisible();

    const before = await contentArea.evaluate(element => element.scrollTop);
    expect(before).toBeGreaterThan(100);

    await naButton.click();

    const refreshedRow = page.locator(
      `#prontuario-verif-rows tr[data-program-id="${context.programaId}"][data-document-key="notaFiscal"]`
    );
    await expect(refreshedRow.getByRole('button', { name: 'N/A', exact: true })).toHaveClass(/is-selected/);

    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const after = await contentArea.evaluate(element => element.scrollTop);

    expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
  });

  test('mantém a posição ao lançar análise técnica em sequência sem re-render global', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do alvo homologado desktop.');

    await page.goto('/');
    await page.evaluate(() => window.RadarProductExtensionsReady);
    await selectFixtureCompetence(page);

    const context = await page.evaluate(() => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const escola = escolas
        .filter(candidate => (
          Array.isArray(candidate.programasIds)
          && candidate.programasIds.length >= 3
          && isCompetenceInScope(candidate.competenciaInicial, competencia)
        ))
        .sort((left, right) => right.programasIds.length - left.programasIds.length)[0];

      if (!escola) throw new Error('Fixture sem escola com programas suficientes para testar rolagem.');

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      escola.programasIds.forEach(programId => {
        delete verificacoes[escola.id][`${competencia}_${programId}`];
      });

      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);

      return {
        escolaId: escola.id,
        programaId: escola.programasIds[escola.programasIds.length - 1],
        competencia
      };
    });

    const row = page.locator(
      `#prontuario-verif-rows tr[data-program-id="${context.programaId}"][data-document-key="extINV"]`
    );
    const analysis = row.locator('select.select-analise');
    await row.scrollIntoViewIfNeeded();
    await expect(analysis).toBeVisible();

    const contentArea = page.locator('main.content-area');
    const before = await contentArea.evaluate(element => element.scrollTop);
    expect(before).toBeGreaterThan(100);

    await analysis.selectOption('Correto');
    await expect(analysis).toHaveValue('Correto');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const after = await contentArea.evaluate(element => element.scrollTop);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(4);

    const persisted = await page.evaluate(({ escolaId, programaId, competencia }) => (
      verificacoes?.[escolaId]?.[`${competencia}_${programaId}`]?.analise?.extINV
    ), context);
    expect(persisted).toBe('Correto');
  });

});

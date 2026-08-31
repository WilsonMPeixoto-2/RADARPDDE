const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

test.describe('Prontuário — integridade temporal', () => {
  test('mantém competência futura visível e navegável, mas somente leitura', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await waitForProductExtensions(page);

    const context = await page.evaluate(() => {
      switchProfile('controlador');
      // Production mantém todo o exercício de 2026 no escopo operacional.
      // O fixture local legado ainda inicia em 2026-05; alinhar o teste à configuração remota real.
      config.competenciaFechamento = '2026-12';
      const referenceDate = new Date(2026, 7, 16, 12, 0, 0);
      const future = COMPETENCIAS.find(item => window.RadarCompetencia.isFutureCompetence(item.key, referenceDate));
      const current = COMPETENCIAS.find(item => item.key === '2026-08');
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.length > 0
        && isCompetenceInScope(candidate.competenciaInicial, future.key)
      ));

      switchView('prontuario', escola.id);
      return { escolaId: escola.id, futureKey: future.key, currentKey: current.key };
    });

    const futureTab = page.locator(`.comp-sub-tab[data-competence="${context.futureKey}"]`);
    await expect(futureTab).toBeVisible();
    await expect(futureTab).toBeEnabled();

    await futureTab.click();
    await expect(futureTab).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-future-competence-notice]')).toContainText('Competência futura');

    const analysisControls = page.locator('#prontuario-verif-rows select.select-analise');
    await expect(analysisControls.first()).toBeDisabled();
    const operationalButtons = page.locator('#prontuario-verif-rows button');
    if (await operationalButtons.count()) {
      await expect(operationalButtons.first()).toBeDisabled();
    }

    const currentTab = page.locator(`.comp-sub-tab[data-competence="${context.currentKey}"]`);
    await currentTab.click();
    await expect(currentTab).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-future-competence-notice]')).toHaveCount(0);
    await expect(page.locator('#prontuario-verif-rows select.select-analise').first()).toBeEnabled();
  });

  test('desabilita Correto comum quando a não entrega já faz parte da bonificação consolidada', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await selectFixtureCompetence(page);
    await waitForProductExtensions(page);

    const context = await page.evaluate(() => {
      switchProfile('controlador');
      const competencia = '2026-05';
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.length > 0
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      const programaId = escola.programasIds[0];
      const compProgKey = `${competencia}_${programaId}`;

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = {
        bonificacao: {
          extCC: 'Não',
          extINV: 'Sim',
          notaFiscal: 'Não se aplica',
          consAssessoria: 'Não se aplica',
          declBBAgil: 'Sim',
          encampInventario: 'Não se aplica'
        },
        analise: {
          extCC: 'Não analisado',
          extINV: 'Não analisado',
          notaFiscal: 'Correto',
          consAssessoria: 'Correto',
          declBBAgil: 'Não analisado',
          encampInventario: 'Correto'
        },
        resultadoBonif: 'inapta'
      };

      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);
      window.RadarProntuarioOperationalUx.enhance(new Date(2026, 7, 16, 12, 0, 0));

      return { escolaId: escola.id, programaId, compProgKey };
    });

    const row = page.locator(
      `#prontuario-verif-rows tr[data-program-id="${context.programaId}"][data-document-key="extCC"]`
    );
    const select = row.locator('select.select-analise');
    const correct = select.locator('option[value="Correto"]');
    const lateCorrect = select.locator('option[value="Correto (Atrasado)"]');

    await expect(correct).toBeDisabled();
    await expect(lateCorrect).toBeEnabled();
    await expect(select).toHaveAttribute('data-late-correct-required', 'true');

    await page.evaluate(({ escolaId, compProgKey }) => {
      verificacoes[escolaId][compProgKey].resultadoBonif = '';
      renderProntuario(escolaId);
      window.RadarProntuarioOperationalUx.enhance(new Date(2026, 7, 16, 12, 0, 0));
    }, context);

    const refreshedRow = page.locator(
      `#prontuario-verif-rows tr[data-program-id="${context.programaId}"][data-document-key="extCC"]`
    );
    await expect(refreshedRow.locator('select.select-analise option[value="Correto"]')).toBeEnabled();
  });
});

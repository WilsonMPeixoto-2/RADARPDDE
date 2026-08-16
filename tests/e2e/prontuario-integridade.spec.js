const { test, expect } = require('@playwright/test');

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
      const referenceDate = new Date(2026, 7, 16, 12, 0, 0);
      const future = COMPETENCIAS.find(item => window.RadarCompetencia.isFutureCompetence(item.key, referenceDate));
      const current = COMPETENCIAS.find(item => item.key === '2026-08');
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.length > 0
        && isCompetenceInScope(candidate.competenciaInicial, future.key)
      ));

      activeProntuarioCompetencia = future.key;
      switchView('prontuario', escola.id);
      window.RadarProntuarioOperationalUx.enhance(referenceDate);

      return { escolaId: escola.id, futureKey: future.key, currentKey: current.key };
    });

    const futureTab = page.locator(`.comp-sub-tab[data-competence="${context.futureKey}"]`);
    await expect(futureTab).toBeVisible();
    await expect(futureTab).toHaveAttribute('aria-pressed', 'true');
    await expect(futureTab).toBeEnabled();
    await expect(page.locator('[data-future-competence-notice]')).toContainText('Competência futura');

    const analysisControls = page.locator('#prontuario-verif-rows select.select-analise');
    await expect(analysisControls.first()).toBeDisabled();
    const operationalButtons = page.locator('#prontuario-verif-rows button');
    if (await operationalButtons.count()) {
      await expect(operationalButtons.first()).toBeDisabled();
    }

    await page.evaluate(({ escolaId, currentKey }) => {
      activeProntuarioCompetencia = currentKey;
      renderProntuario(escolaId);
      window.RadarProntuarioOperationalUx.enhance(new Date(2026, 7, 16, 12, 0, 0));
    }, context);

    await expect(page.locator('[data-future-competence-notice]')).toHaveCount(0);
    await expect(page.locator('#prontuario-verif-rows select.select-analise').first()).toBeEnabled();
  });
});

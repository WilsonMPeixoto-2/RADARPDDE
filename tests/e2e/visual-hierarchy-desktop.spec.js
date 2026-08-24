const { test, expect } = require('@playwright/test');

async function waitForAuthorizedRadar(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarCompetenceContext?.isInitialized?.() === true
    && typeof window.switchProfile === 'function'
    && typeof window.switchView === 'function'
  ));
}

test.describe('hierarquia visual operacional no desktop', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Contrato visual exclusivo do desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('torna a competência o contexto dominante sem criar outro estado', async ({ page }) => {
    await page.goto('/');
    await waitForAuthorizedRadar(page);
    await page.evaluate(() => {
      switchProfile('controlador');
      RadarCompetenceContext.select('2026-08', { source: 'visual-hierarchy-e2e' });
      switchView('dashboard');
    });

    await expect(page.getByRole('heading', { name: 'Painel do Controlador' })).toBeVisible();

    const selector = page.locator('#global-competence-badge');
    const context = page.locator('[data-radar-competence-context]');
    await expect(selector).toContainText('Competência ativa');
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
    await expect(context).toHaveCount(1);
    await expect(context).toContainText('Agosto 2026');

    const prominence = await selector.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const select = element.querySelector('select');
      const selectStyle = select ? window.getComputedStyle(select) : null;
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        selectFontSize: selectStyle ? Number.parseFloat(selectStyle.fontSize) : 0
      };
    });

    expect(prominence.width).toBeGreaterThanOrEqual(240);
    expect(prominence.height).toBeGreaterThanOrEqual(52);
    expect(prominence.selectFontSize).toBeGreaterThanOrEqual(15);
    expect(await page.evaluate(() => RadarCompetenceContext.getState().activeKey)).toBe('2026-08');
  });

  test('repete o contexto ativo na Visão por Competência sem seletor local', async ({ page }) => {
    await page.goto('/');
    await waitForAuthorizedRadar(page);
    await page.evaluate(() => {
      switchProfile('controlador');
      RadarCompetenceContext.select('2026-08', { source: 'visual-hierarchy-e2e' });
      switchView('competencias');
    });

    await expect(page.getByRole('heading', { name: 'Visão por Competência' })).toBeVisible();
    const context = page.locator('[data-radar-competence-context]');
    await expect(context).toHaveCount(1);
    await expect(context).toContainText('Competência ativa');
    await expect(context).toContainText('Agosto 2026');
    await expect(page.getByRole('heading', {
      name: 'Lista de Entrega e Bonificação - Competência Agosto/2026'
    })).toBeVisible();
    await expect(page.locator('#comp-select-view')).toHaveCount(0);
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
  });
});

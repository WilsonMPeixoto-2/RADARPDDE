const { test, expect } = require('@playwright/test');

async function openAssistantDashboard(page, competenceKey = '2026-07') {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => Boolean(
    window.RadarCompetenceContext?.isInitialized?.()
  ))).toBe(true);
  await page.evaluate(key => {
    window.RadarCompetenceContext.select(key, { source: 'e2e-assistant-excel-actions' });
    switchProfile('assistente');
  }, competenceKey);
  return page.locator(
    '#main-container .page-header > [data-radar-assistant-export-actions="true"]'
  );
}

test.describe('exportações Excel no dashboard da Assistente', () => {
  test('exibe exatamente os dois botões Excel e acompanha a competência global', async ({ page }) => {
    const group = await openAssistantDashboard(page, '2026-07');

    await expect(group).toBeVisible();
    await expect(group).toHaveAttribute('role', 'group');
    await expect(group).toHaveAttribute('aria-label', 'Exportações em Excel');

    const institutionalButton = group.locator(
      '[data-radar-assistant-export="institutional"]'
    );
    const smeButton = group.locator('[data-radar-assistant-export="sme"]');

    await expect(institutionalButton).toHaveCount(1);
    await expect(institutionalButton).toBeVisible();
    await expect(institutionalButton).toContainText('Relatório RADAR PDDE');
    await expect(institutionalButton).toHaveAttribute(
      'aria-label',
      'Gerar relatório RADAR PDDE em formato Excel'
    );

    await expect(smeButton).toHaveCount(1);
    await expect(smeButton).toBeVisible();
    await expect(smeButton).toContainText('Excel SME');
    await expect(smeButton).toBeEnabled();
    await expect(smeButton).toHaveAttribute('data-radar-competence-key', '2026-07');
    await expect(smeButton).toHaveAttribute('title', /07-2026/);

    await expect(
      group.locator('[data-radar-export-format="csv"]')
    ).toHaveCount(0);
  });

  test('remove o grupo ao trocar para qualquer outro perfil', async ({ page }) => {
    const group = await openAssistantDashboard(page, '2026-07');
    await expect(group).toBeVisible();

    for (const profile of ['controlador', 'sme', 'inventario']) {
      await page.evaluate(value => switchProfile(value), profile);
      await expect(
        page.locator('[data-radar-assistant-export-actions="true"]')
      ).toHaveCount(0);
      await page.evaluate(() => switchProfile('assistente'));
      await expect(
        page.locator('[data-radar-assistant-export-actions="true"]')
      ).toBeVisible();
    }
  });
});

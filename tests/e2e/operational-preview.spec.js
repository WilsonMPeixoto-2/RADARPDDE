const { test, expect } = require('@playwright/test');

test.describe('prévia operacional do Dashboard e da Carteira', () => {
  test('Dashboard apresenta cinco filas e abre a Carteira com filtro herdado', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/preview.html');

    const dashboard = page.locator('#operational-dashboard');
    await expect(dashboard).toBeVisible();
    await expect(dashboard.getByRole('heading', { name: 'Visão geral da competência' })).toBeVisible();
    await expect(dashboard.locator('[data-preview-queue]')).toHaveCount(5);

    const startQueue = dashboard.locator('[data-preview-queue="nao-iniciado"]');
    await expect(startQueue).toContainText('Para iniciar');
    await startQueue.click();

    const portfolio = page.locator('#operational-portfolio');
    await expect(portfolio).toBeVisible();
    await expect(portfolio.getByRole('heading', { name: 'Carteira de Escolas' })).toBeVisible();
    await expect(portfolio.locator('[data-preview-remove-filter="status"]')).toContainText('Situação: Não iniciado');
    await expect(portfolio.locator('.operational-table tbody tr').first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('Carteira usa cartões operacionais no celular sem overflow global', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile-'), 'Cenário exclusivo dos projetos móveis.');

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/preview.html');
    await page.getByText('Carteira de Escolas', { exact: true }).first().click();

    const portfolio = page.locator('#operational-portfolio');
    await expect(portfolio).toBeVisible();
    await expect(portfolio.locator('.operational-mobile-school-card').first()).toBeVisible();
    await expect(portfolio.locator('.operational-table-wrap')).toBeHidden();

    const filterToggle = portfolio.locator('[data-preview-toggle-filters]');
    await expect(filterToggle).toBeVisible();
    await filterToggle.click();
    await expect(portfolio.locator('.operational-filter-panel')).toHaveClass(/is-open/);

    const hasHorizontalOverflow = await page.evaluate(() => (
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    ));
    expect(hasHorizontalOverflow).toBe(false);
    expect(pageErrors).toEqual([]);
  });
});
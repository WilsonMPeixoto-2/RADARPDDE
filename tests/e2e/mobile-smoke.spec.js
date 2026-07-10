const { test, expect } = require('@playwright/test');

test.describe('RADAR PDDE em dispositivos móveis', () => {
  test('carrega a aplicação sem erro fatal', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');

    await expect(page).toHaveTitle(/RADAR PDDE/i);
    await expect(page.locator('#app-layout')).toBeVisible();
    await expect(page.locator('#main-container')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

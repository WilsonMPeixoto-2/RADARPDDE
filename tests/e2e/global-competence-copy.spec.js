const { test, expect } = require('@playwright/test');

test('não expõe a regra interna de propagação da competência', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#global-competence-select')).toBeVisible();
  await expect(page.locator('#global-competence-label')).toBeHidden();

  await expect(page.locator('#global-competence-help')).toHaveCount(0);
  await expect(
    page.getByText('A seleção atualiza todas as telas e exportações mensais.')
  ).toHaveCount(0);
});

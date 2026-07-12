const { test, expect } = require('@playwright/test');

test.describe('ação institucional de geração do Excel', () => {
  test('destaca o XLSX e mantém o CSV como alternativa secundária', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await page.evaluate(() => switchProfile('sme'));

    const excelButton = page.getByRole('button', {
      name: 'Gerar relatório Excel completo em formato XLSX'
    });
    await expect(excelButton).toBeVisible();
    await expect(excelButton).toContainText('Gerar relatório Excel (.xlsx)');
    await expect(excelButton).toHaveClass(/btn-primary/);

    const csvButton = page.getByRole('button', { name: 'Baixar CSV legado' });
    await expect(csvButton).toBeVisible();
    await expect(csvButton).toHaveClass(/btn-secondary/);
  });
});

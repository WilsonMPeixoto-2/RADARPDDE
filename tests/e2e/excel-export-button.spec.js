const { test, expect } = require('@playwright/test');

test.describe('ações institucionais de geração do Excel', () => {
  test('preserva o Excel atual e adiciona Excel SME mensal e CSV como alternativas independentes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await page.evaluate(() => switchProfile('sme'));

    const excelButton = page.getByRole('button', {
      name: 'Gerar relatório Excel completo em formato XLSX'
    });
    await expect(excelButton).toBeVisible();
    await expect(excelButton).toContainText('Gerar relatório Excel (.xlsx)');
    await expect(excelButton).toHaveClass(/btn-primary/);

    const smeButton = page.getByRole('button', {
      name: 'Gerar relatório no modelo Excel da SME'
    });
    await expect(smeButton).toBeVisible();
    await expect(smeButton).toContainText('Excel SME');
    await expect(smeButton).toHaveClass(/btn-secondary/);

    await page.evaluate(() => {
      const button = document.querySelector('[data-radar-sme-export="true"]');
      RadarExcelExportIntegration.updateSmeButtonState(button, 'TODAS');
    });
    await expect(smeButton).toBeDisabled();
    await expect(smeButton).toHaveAttribute('title', /Selecione uma competência mensal/);

    await page.evaluate(() => {
      const button = document.querySelector('[data-radar-sme-export="true"]');
      RadarExcelExportIntegration.updateSmeButtonState(button, '2026-07');
    });
    await expect(smeButton).toBeEnabled();
    await expect(smeButton).toHaveAttribute('title', /07-2026/);

    const csvButton = page.getByRole('button', { name: 'Baixar CSV legado' });
    await expect(csvButton).toBeVisible();
    await expect(csvButton).toHaveClass(/btn-secondary/);

    await expect.poll(() => page.evaluate(() => Boolean(
      window.RadarExcelXlsxRenderer?.createZip
      && window.RadarExcelSmeMonthlyRenderer?.renderWorkbook
    ))).toBe(true);
  });
});

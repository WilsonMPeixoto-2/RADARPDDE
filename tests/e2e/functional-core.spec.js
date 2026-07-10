const { test, expect } = require('@playwright/test');

test.describe('núcleo funcional do RADAR PDDE no desktop', () => {
  test('painel SME conta cada escola uma única vez nos indicadores', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await page.evaluate(() => switchProfile('sme'));

    const statsGrid = page.locator('#main-container .grid-stats').first();
    const cards = statsGrid.locator(':scope > .card-stat');
    const naoAnalisadasCard = cards.filter({ hasText: 'Não Analisadas' });

    await expect(cards).toHaveCount(4);
    await expect(naoAnalisadasCard).toHaveCount(1);
    await expect(naoAnalisadasCard.locator('.stat-value')).toHaveText('163 Unidades');

    const creRow = page.locator('#main-container .dash-layout table.data-table tbody tr').first();
    await expect(creRow.locator('td').nth(1)).toHaveText('163 unidades');
    await creRow.click();
    await expect(page.locator('#sme-detail-table .sme-detail-row')).toHaveCount(430);
  });
});

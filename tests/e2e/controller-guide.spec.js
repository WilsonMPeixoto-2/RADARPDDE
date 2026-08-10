const { test, expect } = require('@playwright/test');

test.describe('Guia do Controlador', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário focal do guia no desktop.');
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarControllerGuide));
  });

  test('aparece somente para Controlador e reúne os fluxos essenciais com prints reais', async ({ page }) => {
    await page.evaluate(() => {
      switchProfile('controlador');
    });

    const nav = page.locator('#nav-guia-controlador');
    await expect(nav).toBeVisible();
    await nav.click();

    const guide = page.locator('#controller-guide-root');
    await expect(guide).toBeVisible();
    await expect(guide.getByRole('heading', { level: 1, name: 'Guia do Controlador' })).toBeVisible();
    await expect(guide.locator('[data-guide-section]')).toHaveCount(12);
    await expect(guide).toContainText('Avaliação mensal');
    await expect(guide).toContainText('Documento ausente');
    await expect(guide).toContainText('Documento ilegível');
    await expect(guide).toContainText('Registrar novo envio');
    await expect(guide).toContainText('Aguardando reanálise');
    await expect(guide).toContainText('Registrar contato');
    await expect(guide).toContainText('Prontuário');
    await expect(guide.getByRole('button', { name: /Salvar em PDF/ })).toBeVisible();

    const screenshots = guide.locator('.controller-guide-figure img');
    expect(await screenshots.count()).toBeGreaterThanOrEqual(6);
    expect(await screenshots.evaluateAll(images => images.every(image => (
      image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
    )))).toBe(true);

    const search = guide.locator('#controller-guide-search');
    await search.fill('reanálise');
    await expect(guide.locator('[data-guide-section]:visible')).not.toHaveCount(0);
    await expect(guide.locator('#guia-reanalise')).toBeVisible();

    await page.evaluate(() => switchProfile('assistente'));
    await expect(nav).toBeHidden();
    await expect(page.locator('#controller-guide-root')).toHaveCount(0);
  });

  test('atalho do guia leva o Controlador de volta às telas operacionais', async ({ page }) => {
    await page.evaluate(() => switchProfile('controlador'));
    await page.locator('#nav-guia-controlador').click();

    await page.locator('#guia-pendencia [data-guide-view="pendencias"]').click();
    await expect(page.locator('#nav-pendencias')).toHaveClass(/active/);
    await expect(page.locator('#main-container')).toContainText('Pendências');
  });
});

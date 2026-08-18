const { test, expect } = require('@playwright/test');

test.describe('Guia do Controlador', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário focal do guia no desktop.');
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarControllerGuide));
  });

  test('fica disponível em todos os perfis e reúne as jornadas essenciais com prints reais', async ({ page }) => {
    const nav = page.locator('#nav-guia-controlador');
    const guide = page.locator('#controller-guide-root');

    for (const profile of ['controlador', 'assistente', 'sme', 'inventario']) {
      await page.evaluate(currentProfile => switchProfile(currentProfile), profile);
      await expect(nav).toBeVisible();
      await nav.click();
      await expect(guide).toBeVisible();
    }

    await page.evaluate(() => switchProfile('controlador'));
    await nav.click();

    await expect(guide.getByRole('heading', { level: 1, name: 'Guia do Controlador' })).toBeVisible();
    await expect(guide.locator('[data-guide-section]')).toHaveCount(16);

    for (const content of [
      'Avaliação mensal',
      'Não se aplica',
      'Documento ausente',
      'Documento ilegível',
      'Adicionar Nota',
      'Gerar Cobrança',
      'Editar Dados',
      'Registrar novo envio',
      'Aguardando reanálise',
      'Registrar Contato',
      'Cancelar pendência',
      'Reabrir pendência',
      'Histórico cronológico',
      'Capital e Inventário'
    ]) {
      await expect(guide).toContainText(content);
    }

    await expect(guide.getByRole('button', { name: /Salvar em PDF/ })).toBeVisible();

    const screenshots = guide.locator('.controller-guide-figure img');
    expect(await screenshots.count()).toBeGreaterThanOrEqual(6);
    await expect.poll(async () => screenshots.evaluateAll(images => images.every(image => (
      image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
    )))).toBe(true);

    const search = guide.locator('#controller-guide-search');
    await search.fill('reanálise');
    await expect(guide.locator('[data-guide-section]:visible')).not.toHaveCount(0);
    await expect(guide.locator('#guia-reanalise')).toBeVisible();
  });

  test('índice percorre o manual sem sair do Guia nem alterar a rota do RADAR', async ({ page }) => {
    await page.evaluate(() => switchProfile('controlador'));
    await page.locator('#nav-guia-controlador').click();

    const guide = page.locator('#controller-guide-root');
    const target = guide.locator('#guia-reanalise');
    const initialUrl = new URL(page.url());

    await guide.locator('.controller-guide-toc').getByRole('button', { name: /Reanálise$/ }).click();

    await expect(guide).toBeVisible();
    await expect(target).toBeInViewport();
    await expect(page.locator('#nav-guia-controlador')).toHaveClass(/active/);

    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname).toBe(initialUrl.pathname);
    expect(finalUrl.search).toBe(initialUrl.search);
    expect(finalUrl.hash).toBe('');
  });

  test('herda a identidade lilás vigente do RADAR', async ({ page }) => {
    await page.evaluate(() => switchProfile('controlador'));
    await page.locator('#nav-guia-controlador').click();

    const palette = await page.locator('.controller-guide').evaluate(element => {
      const guide = getComputedStyle(element);
      const activeTheme = getComputedStyle(document.body);
      const hero = getComputedStyle(element.querySelector('.controller-guide-hero'));
      return {
        guidePrimary: guide.getPropertyValue('--guide-primary').trim(),
        primary: activeTheme.getPropertyValue('--primary').trim(),
        guideAccent: guide.getPropertyValue('--guide-accent').trim(),
        accent: activeTheme.getPropertyValue('--accent-plum').trim(),
        guideInk: guide.getPropertyValue('--guide-ink').trim(),
        ink: activeTheme.getPropertyValue('--text-main').trim(),
        heroBackground: hero.backgroundImage
      };
    });

    expect(palette.guidePrimary).toBe(palette.primary);
    expect(palette.guideAccent).toBe(palette.accent);
    expect(palette.guideInk).toBe(palette.ink);
    expect(palette.heroBackground).toContain('linear-gradient');
  });

  test('atalhos do guia devolvem o usuário às telas operacionais', async ({ page }) => {
    await page.evaluate(() => switchProfile('controlador'));
    await page.locator('#nav-guia-controlador').click();

    await page.locator('#guia-pendencia [data-guide-view="pendencias"]').click();
    await expect(page.locator('#nav-pendencias')).toHaveClass(/active/);
    await expect(page.locator('#main-container')).toContainText('Pendências');
  });
});

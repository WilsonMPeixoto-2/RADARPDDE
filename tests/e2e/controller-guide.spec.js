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
    await expect(page.locator('#nav-dashboard')).toContainText('Painel');
    await expect(page.locator('#nav-dashboard')).not.toContainText('Dashboard');
    await nav.click();

    await expect(guide.getByRole('heading', { level: 1, name: 'Guia do Controlador' })).toBeVisible();
    await expect(guide).toContainText('Painel do Controlador');
    await expect(guide).toContainText('Abrir Painel');
    await expect(guide.locator('[data-guide-section]')).toHaveCount(8);

    for (const content of [
      'Avaliação mensal',
      'Não se aplica',
      'Documento ausente',
      'Documento ilegível',
      'Adicionar Nota',
      'Gerar comunicação',
      'Editar Dados',
      'Registrar novo envio',
      'Aguardando reanálise',
      'Registrar Contato',
      'Editar despesa',
      'Corrigir análise técnica',
      'Redefinir como não analisado',
      'Excluir análise e pendências',
      'Excluir lançamentos deste programa',
      'Corrigir bonificação',
      'Alterações pendentes de consolidação',
      'Cancelar pendência',
      'Reabrir pendência',
      'Histórico cronológico',
      'Capital e Inventário'
    ]) {
      await expect(guide).toContainText(content);
    }

    await expect(guide.getByRole('button', { name: /Salvar em PDF/ })).toBeVisible();

    const screenshots = guide.locator('.controller-guide-figure img');
    await expect(screenshots).toHaveCount(3);
    for (const screenshot of await screenshots.all()) {
      await screenshot.scrollIntoViewIfNeeded();
      await expect.poll(() => screenshot.evaluate(image => (
        image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
      ))).toBe(true);
    }

    const search = guide.locator('#controller-guide-search');
    await search.fill('reanálise');
    await expect(guide.locator('[data-guide-section]:visible')).not.toHaveCount(0);
    await expect(guide.locator('#guia-reanalise')).toBeVisible();
  });

  test('índice percorre o manual sem sair do Guia nem alterar a rota do RADAR', async ({ page }) => {
    await page.evaluate(() => switchProfile('controlador'));
    await page.locator('#nav-guia-controlador').click();

    const guide = page.locator('#controller-guide-root');
    const target = guide.locator('#guia-pendencia');
    const initialUrl = new URL(page.url());

    await guide.locator('.controller-guide-toc').getByRole('button', { name: /Pendências e reanálise$/ }).click();

    await expect(guide).toBeVisible();
    await expect(target).toBeInViewport();
    await expect(page.locator('#nav-guia-controlador')).toHaveClass(/active/);

    const finalUrl = new URL(page.url());
    expect(finalUrl.pathname).toBe(initialUrl.pathname);
    expect(finalUrl.search).toBe(initialUrl.search);
    expect(finalUrl.hash).toBe('');
  });

  test('busca sem acentos e sumário recuperam uma tarefa ocultada pelo filtro', async ({ page }) => {
    await page.locator('#nav-guia-controlador').click();
    const guide = page.locator('#controller-guide-root');
    const search = guide.locator('#controller-guide-search');

    await search.fill('inventariacao');
    await expect(guide.locator('#guia-inventario')).toBeVisible();
    await expect(guide.locator('#guia-pendencia')).toBeHidden();
    await guide.locator('.controller-guide-toc').getByRole('button', { name: /Pendências e reanálise$/ }).click();
    await expect(search).toHaveValue('');
    await expect(guide.locator('#guia-pendencia')).toBeVisible();
    await expect(guide.locator('#guia-pendencia')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('');
  });

  test('ajuda contextual abre uma tarefa conhecida sem mudar a rota operacional', async ({ page }) => {
    const initialUrl = page.url();
    expect(await page.evaluate(() => RadarControllerGuide.openTopic('#guia-corrigir'))).toBe(true);
    const chapter = page.locator('#guia-corrigir');
    await expect(chapter).toBeInViewport();
    await expect(chapter).toBeFocused();
    expect(await page.evaluate(() => RadarControllerGuide.openTopic('destino-inexistente'))).toBe(false);
    await expect(chapter).toBeVisible();
    expect(page.url()).toBe(initialUrl);
  });

  test('quadro de decisões cabe nos três tamanhos e nos dois temas', async ({ page }, testInfo) => {
    await page.locator('#nav-guia-controlador').click();
    const guide = page.locator('#controller-guide-root');
    const table = guide.locator('.controller-guide-decision-table');
    const chapterTitle = guide.locator('#guia-corrigir-title');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await testInfo.attach('guia-inicio-desktop', { body: await page.screenshot(), contentType: 'image/png' });
    for (const width of [1440, 960, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await guide.locator('.controller-guide-toc').getByRole('button', { name: /Escolher a correção$/ }).click();
      await expect(chapterTitle).toBeInViewport();
      await expect.poll(() => guide.locator('#guia-corrigir').evaluate(element => (
        Math.abs(element.getBoundingClientRect().top - parseFloat(getComputedStyle(element).scrollMarginTop))
      ))).toBeLessThanOrEqual(1);
      // A navegação pelo sumário deve deixar o título descoberto pelos cabeçalhos.
      await expect.poll(() => chapterTitle.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const top = document.elementFromPoint(bounds.left + Math.min(20, bounds.width / 2), bounds.top + Math.min(10, bounds.height / 2));
        return Boolean(top && element.contains(top));
      })).toBe(true);
      const metrics = await table.evaluate(element => ({
        width: element.getBoundingClientRect().width,
        parentWidth: element.parentElement.getBoundingClientRect().width,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth
      }));
      expect(metrics.width).toBeLessThanOrEqual(metrics.parentWidth + 1);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      await expect(table.getByText('Redefinir como não analisado', { exact: true })).toBeVisible();
      for (const theme of ['claro', 'escuro']) {
        await page.evaluate(dark => document.body.classList.toggle('dark-theme', dark), theme === 'escuro');
        await expect(chapterTitle).toBeInViewport();
        await testInfo.attach(`guia-correcoes-${width}-${theme}`, { body: await page.screenshot(), contentType: 'image/png' });
      }
      await page.evaluate(() => document.body.classList.remove('dark-theme'));
    }
    // A impressão deve incluir o manual completo, mesmo após uma busca ativa.
    await guide.locator('#controller-guide-search').fill('inventariacao');
    await page.evaluate(() => document.body.classList.add('controller-guide-printing'));
    await page.emulateMedia({ media: 'print' });
    await expect(guide.locator('[data-guide-section]:visible')).toHaveCount(8);
    await page.evaluate(async () => {
      await Promise.all(Array.from(document.querySelectorAll('.controller-guide-figure img'), async image => {
        image.loading = 'eager';
        await image.decode();
      }));
    });
    await testInfo.attach('guia-controlador-completo', {
      body: await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }),
      contentType: 'application/pdf'
    });
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

    await page.getByRole('button', { name: 'Abrir Painel', exact: true }).click();
    await expect(page.locator('#nav-dashboard')).toHaveClass(/active/);
    await expect(page.locator('#main-container').getByRole('heading', { name: 'Painel do Controlador', exact: true })).toBeVisible();

    await page.locator('#nav-guia-controlador').click();
    await expect(page.locator('#controller-guide-root')).toBeVisible();
    await page.locator('#guia-pendencia [data-guide-view="pendencias"]').click();
    await expect(page.locator('#nav-pendencias')).toHaveClass(/active/);
    await expect(page.locator('#main-container')).toContainText('Pendências');
  });
});

const { test, expect } = require('@playwright/test');

async function openApplication(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/RADAR PDDE/i);
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#main-container')).toBeVisible();
  await expect(page.locator('#mobile-menu-button')).toBeVisible();
  await expect(page.locator('link[href="src/styles/mobile-rendering-hotfix.css"]')).toHaveCount(1);

  return pageErrors;
}

test.describe('RADAR PDDE em dispositivos móveis', () => {
  test('carrega a aplicação sem erro fatal e sem overflow da página', async ({ page }) => {
    const pageErrors = await openApplication(page);

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    }));

    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(pageErrors).toEqual([]);
  });

  test('abre o menu móvel, navega e fecha automaticamente', async ({ page }) => {
    await openApplication(page);

    const menuButton = page.locator('#mobile-menu-button');
    const sidebar = page.locator('aside.sidebar');
    const overlay = page.locator('.mobile-sidebar-overlay');

    await expect(sidebar).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await menuButton.click();

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/mobile-open/);
    await expect(overlay).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('body')).toHaveClass(/mobile-nav-open/);

    await page.locator('#nav-escolas').click();

    await expect(page.locator('#nav-escolas')).toHaveClass(/active/);
    await expect(sidebar).toBeHidden();
    await expect(overlay).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('body')).not.toHaveClass(/mobile-nav-open/);
  });

  test('fecha o menu móvel com a tecla Escape', async ({ page }) => {
    await openApplication(page);

    const menuButton = page.locator('#mobile-menu-button');
    const sidebar = page.locator('aside.sidebar');

    await menuButton.click();
    await expect(sidebar).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(sidebar).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toBeFocused();
  });

  test('usa cartões na Carteira sem overflow global', async ({ page }) => {
    await openApplication(page);

    await page.locator('#mobile-menu-button').click();
    await page.locator('#nav-escolas').click();

    const cards = page.locator('.cycle-b-wallet-mobile-card');
    await expect(cards.first()).toBeVisible();

    const resultPanel = page.locator('.panel-card').filter({
      has: page.getByRole('heading', { name: 'Resultado da carteira' })
    });
    await expect(resultPanel.locator('table.data-table')).toHaveCount(0);

    const pageOverflow = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));
    expect(pageOverflow.documentWidth).toBeLessThanOrEqual(pageOverflow.viewport + 1);
  });

  test('mantém conteúdo e SVG pintados durante rolagem longa', async ({ page }) => {
    const pageErrors = await openApplication(page);

    const renderingStyles = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const header = getComputedStyle(document.querySelector('header.top-header'));
      const panel = getComputedStyle(document.querySelector('.panel-card') || document.querySelector('#main-container'));
      return {
        bodyBackgroundImage: body.backgroundImage,
        headerPosition: header.position,
        headerBackdrop: header.backdropFilter || header.webkitBackdropFilter || 'none',
        panelBackdrop: panel.backdropFilter || panel.webkitBackdropFilter || 'none'
      };
    });

    expect(renderingStyles.bodyBackgroundImage).toBe('none');
    expect(renderingStyles.headerPosition).toBe('relative');
    expect(['none', '']).toContain(renderingStyles.headerBackdrop);
    expect(['none', '']).toContain(renderingStyles.panelBackdrop);

    await page.evaluate(() => {
      const main = document.querySelector('#main-container');
      const stress = document.createElement('section');
      stress.id = 'mobile-render-stress';
      stress.setAttribute('aria-label', 'Teste de estabilidade de renderização');
      stress.style.display = 'grid';
      stress.style.gap = '18px';
      stress.style.paddingTop = '20px';

      stress.innerHTML = Array.from({ length: 12 }, (_, index) => `
        <article data-render-stress="${index}" style="min-height:320px;padding:24px;border:1px solid var(--border-color);border-radius:16px;background:var(--bg-sidebar);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;">
          <svg data-render-icon viewBox="0 0 64 64" width="84" height="84" fill="none" stroke="var(--primary)" stroke-width="4" aria-hidden="true">
            <circle cx="32" cy="32" r="25"></circle>
            <path d="M18 34l9 9 19-22"></path>
          </svg>
          <strong style="font-size:22px;">Bloco de renderização ${index + 1}</strong>
          <span style="color:var(--text-muted);">Conteúdo visual para validar pintura durante a rolagem.</span>
        </article>
      `).join('');
      main.appendChild(stress);
    });

    const screenshots = [];
    for (const index of [0, 5, 11]) {
      const card = page.locator(`[data-render-stress="${index}"]`);
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await expect(card).toBeVisible();
      await expect(card.locator('[data-render-icon]')).toBeVisible();

      const geometry = await card.locator('[data-render-icon]').evaluate(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          width: rect.width,
          height: rect.height,
          display: style.display,
          visibility: style.visibility,
          opacity: Number(style.opacity)
        };
      });

      expect(geometry.width).toBeGreaterThan(60);
      expect(geometry.height).toBeGreaterThan(60);
      expect(geometry.display).not.toBe('none');
      expect(geometry.visibility).toBe('visible');
      expect(geometry.opacity).toBeGreaterThan(0.9);

      screenshots.push((await page.screenshot({ type: 'png' })).length);
    }

    const largestScreenshot = Math.max(...screenshots);
    const smallestScreenshot = Math.min(...screenshots);
    expect(smallestScreenshot).toBeGreaterThan(6000);
    expect(smallestScreenshot).toBeGreaterThan(largestScreenshot * 0.35);
    expect(pageErrors).toEqual([]);
  });
});

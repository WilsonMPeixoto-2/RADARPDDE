const { test, expect } = require('@playwright/test');

async function waitForApp(page) {
  await page.waitForFunction(() => window.RadarDataContext?.ready === true);
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady) await window.RadarProductExtensionsReady;
  });
}

test.describe('Regressão visual da sidebar e do Prontuário', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Entrega homologada no desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('Dashboard mantém sidebar escura, viva e coerente com o tema expressivo', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.evaluate(() => {
      switchProfile('controlador');
      switchView('dashboard');
    });

    await page.waitForFunction(() => document.body.classList.contains('radar-expressiva-institucional'));
    await expect(page.locator('link[data-radar-product-style="/src/styles/sidebar-prontuario-polish.css"]')).toHaveCount(1);

    const visual = await page.evaluate(() => {
      const sidebar = document.querySelector('aside.sidebar');
      const active = sidebar.querySelector('.nav-item.active');
      const normal = Array.from(sidebar.querySelectorAll('.nav-item')).find(item => !item.classList.contains('active'));
      const sidebarStyle = getComputedStyle(sidebar);
      const activeStyle = getComputedStyle(active);
      const normalStyle = getComputedStyle(normal);
      const detail = getComputedStyle(sidebar, '::before');
      return {
        backgroundImage: sidebarStyle.backgroundImage,
        activeBackground: activeStyle.backgroundImage,
        activeColor: activeStyle.color,
        normalColor: normalStyle.color,
        detailContent: detail.content,
        detailBorderTopWidth: detail.borderTopWidth
      };
    });

    expect(visual.backgroundImage).toContain('linear-gradient');
    expect(visual.activeBackground).toContain('linear-gradient');
    expect(visual.activeColor).toBe('rgb(255, 255, 255)');
    expect(visual.normalColor).not.toBe('rgb(255, 255, 255, 0)');
    expect(visual.detailContent).not.toBe('none');
    expect(Number.parseFloat(visual.detailBorderTopWidth)).toBeGreaterThan(0);
  });

  test('Prontuário mantém título no eixo central e ações centralizadas', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    const schoolId = await page.evaluate(() => {
      switchProfile('controlador');
      const activeKey = window.RadarCompetenceContext.getState().activeKey;
      const school = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.length > 0
        && isCompetenceInScope(candidate.competenciaInicial, activeKey)
      ));
      if (!school) throw new Error('Nenhuma escola compatível com o cenário visual.');
      activeProntuarioCompetencia = activeKey;
      switchView('prontuario', school.id);
      return school.id;
    });

    await page.waitForFunction(id => {
      const route = window.RadarNavigationHistory?.currentRoute?.(window);
      return route?.view === 'prontuario' && route?.param === id;
    }, schoolId);

    await expect(page.locator('.prontuario-school-header .page-title h1')).toBeVisible();
    await expect(page.locator('.prontuario-next-school')).toBeVisible();

    const geometry = await page.evaluate(() => {
      const header = document.querySelector('.prontuario-school-header');
      const title = header.querySelector('.page-title');
      const actions = header.querySelector('.prontuario-actions');
      const next = header.querySelector('.prontuario-next-school');
      const headerRect = header.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      const center = rect => rect.left + (rect.width / 2);
      return {
        display: getComputedStyle(header).display,
        titleOffset: Math.abs(center(titleRect) - center(headerRect)),
        actionsOffset: Math.abs(center(actionsRect) - center(headerRect)),
        nextInside: nextRect.right <= headerRect.right + 1 && nextRect.left >= headerRect.left - 1,
        mainOverflow: document.querySelector('main.content-area').scrollWidth - document.querySelector('main.content-area').clientWidth
      };
    });

    expect(geometry.display).toBe('grid');
    expect(geometry.titleOffset).toBeLessThanOrEqual(3);
    expect(geometry.actionsOffset).toBeLessThanOrEqual(3);
    expect(geometry.nextInside).toBe(true);
    expect(geometry.mainOverflow).toBeLessThanOrEqual(1);
  });
});

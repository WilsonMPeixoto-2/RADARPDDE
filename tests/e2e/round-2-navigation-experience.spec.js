const { test, expect } = require('@playwright/test');

async function openApplication(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#global-search')).toHaveAttribute('role', 'combobox');
  return pageErrors;
}

test('busca aproximada carrega Fuse.js no primeiro uso e navega pelo teclado sem central de comandos', async ({ page }) => {
  const pageErrors = await openApplication(page);
  const input = page.locator('#global-search');
  const results = page.locator('#global-search-results');

  await expect.poll(() => page.evaluate(() => typeof window.Fuse)).toBe('undefined');
  await input.fill('Cartera de Escolas');
  await expect(results).toBeVisible();
  await expect(results.getByRole('option').first()).toContainText('Carteira de Escolas');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => page.evaluate(() => typeof window.Fuse)).toBe('function');

  await input.press('ArrowDown');
  await input.press('Enter');

  await expect(page.locator('#nav-escolas')).toHaveClass(/active/);
  await expect(results).toBeHidden();
  await expect(input).toHaveValue('');

  await input.blur();
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    }));
  });
  await expect(input).not.toBeFocused();
  await expect(results).toBeHidden();
  expect(pageErrors).toEqual([]);
});

test('menus carregam Floating UI no primeiro uso, permanecem na viewport e fecham por Escape', async ({ page }) => {
  const pageErrors = await openApplication(page);
  const alertsButton = page.locator('#alerts-bell-container .bell-button');
  const alerts = page.locator('#alerts-dropdown');

  await expect.poll(() => page.evaluate(() => typeof window.FloatingUIDOM)).toBe('undefined');
  await alertsButton.click();
  await expect(alerts).toBeVisible();
  await expect(alertsButton).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => page.evaluate(() => typeof window.FloatingUIDOM)).toBe('object');

  const geometry = await alerts.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      position: getComputedStyle(element).position
    };
  });

  expect(geometry.position).toBe('fixed');
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);

  await page.keyboard.press('Escape');
  await expect(alerts).toBeHidden();
  await expect(alertsButton).toHaveAttribute('aria-expanded', 'false');
  await expect(alertsButton).toBeFocused();
  expect(pageErrors).toEqual([]);
});

test('transição começa somente após a montagem inicial e acompanha a navegação do usuário', async ({ page }) => {
  await page.addInitScript(() => {
    window.__radarViewTransitionCalls = 0;
    document.startViewTransition = update => {
      window.__radarViewTransitionCalls += 1;
      const updateCallbackDone = Promise.resolve().then(update);
      return {
        updateCallbackDone,
        ready: Promise.resolve(),
        finished: updateCallbackDone,
        skipTransition() {}
      };
    };
  });

  const pageErrors = await openApplication(page);
  await expect.poll(() => page.evaluate(
    () => window.__radarViewTransitionsController?.isActive?.()
  )).toBe(true);
  expect(await page.evaluate(() => window.__radarViewTransitionCalls)).toBe(0);

  await page.locator('#nav-competencias').click();
  await expect(page.locator('#nav-competencias')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => window.__radarViewTransitionCalls)).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
});

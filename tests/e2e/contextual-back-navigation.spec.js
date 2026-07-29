const { test, expect } = require('@playwright/test');

async function waitForRoute(page, expected) {
  await page.waitForFunction(target => {
    const route = window.RadarNavigationHistory?.currentRoute?.(window);
    if (!route || window.RadarDataContext?.ready !== true) return false;
    if (target.view && route.view !== target.view) return false;
    if (Object.hasOwn(target, 'param') && route.param !== target.param) return false;
    if (Object.hasOwn(target, 'section') && route.section !== target.section) return false;
    if (target.schoolFilter && route.filters?.escola !== target.schoolFilter) return false;
    return true;
  }, expected);
}

async function waitForContextualNavigation(page) {
  await page.waitForFunction(() => Boolean(
    window.RadarProductExtensionsReady
    && window.RadarContextualBackNavigation?.installed === true
    && window.RadarNavigationContext?.push
  ));
}

async function prepareFilteredCarteira(page) {
  await page.goto('/carteira');
  await waitForRoute(page, { view: 'escolas' });
  await waitForContextualNavigation(page);

  await page.locator('#global-competence-select').selectOption('2026-08');
  await page.locator('#filter-escola-programa').selectOption('BASIC');

  const initialLink = page.locator('a[data-radar-route="true"][href^="/escolas/"]').first();
  await expect(initialLink).toBeVisible();
  const href = await initialLink.getAttribute('href');
  const schoolId = decodeURIComponent(href.split('/').filter(Boolean).at(-1));

  await page.locator('#escola-search-input').fill(schoolId);
  const schoolLink = page.locator(`a[data-radar-route="true"][href="${href}"]`).first();
  await expect(schoolLink).toBeVisible();
  return { schoolId, href, schoolLink };
}

test('volta do Prontuário para a Carteira preservando competência, filtros, busca e foco', async ({ page }) => {
  const { schoolId, href, schoolLink } = await prepareFilteredCarteira(page);

  await schoolLink.focus();
  await schoolLink.click();
  await waitForRoute(page, { view: 'prontuario', param: schoolId, section: null });

  const backButton = page.getByRole('button', { name: 'Voltar à Carteira', exact: true });
  await expect(backButton).toBeVisible();
  await backButton.click();

  await waitForRoute(page, { view: 'escolas' });
  await expect(page).toHaveURL(/\/carteira$/);
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
  await expect(page.locator('#filter-escola-programa')).toHaveValue('BASIC');
  await expect(page.locator('#escola-search-input')).toHaveValue(schoolId);
  await expect(page.locator(`a[data-radar-route="true"][href="${href}"]`).first()).toBeFocused();
});

test('retorno aninhado preserva Prontuário e depois a origem anterior da Carteira', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-webkit', 'Jornada aninhada exercitada no Chromium desktop e móvel.');

  const { schoolId, schoolLink } = await prepareFilteredCarteira(page);
  await schoolLink.click();
  await waitForRoute(page, { view: 'prontuario', param: schoolId, section: null });

  const pendencyTab = page.locator('.tab-button[data-tab="pendencias"]');
  await pendencyTab.click();
  await waitForRoute(page, { view: 'prontuario', param: schoolId, section: 'pendencias' });

  const globalPendenciesLink = page.locator('a[data-radar-school-pendencies-link="true"]');
  await expect(globalPendenciesLink).toBeVisible();
  await globalPendenciesLink.click();
  await waitForRoute(page, { view: 'pendencias', schoolFilter: schoolId });

  await page.getByRole('button', { name: 'Voltar ao Prontuário', exact: true }).click();
  await waitForRoute(page, { view: 'prontuario', param: schoolId, section: 'pendencias' });
  await expect(page.locator('#tab-pendencias')).toHaveClass(/active/);

  await page.getByRole('button', { name: 'Voltar à Carteira', exact: true }).click();
  await waitForRoute(page, { view: 'escolas' });
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
  await expect(page.locator('#filter-escola-programa')).toHaveValue('BASIC');
  await expect(page.locator('#escola-search-input')).toHaveValue(schoolId);
});

test('acesso direto ao Prontuário usa fallback autorizado e não sai da aplicação', async ({ page }) => {
  await page.goto('/escolas/04.10.001');
  await waitForRoute(page, { view: 'prontuario', param: '04.10.001' });
  await waitForContextualNavigation(page);

  const backButton = page.getByRole('button', { name: 'Voltar à Carteira', exact: true });
  await expect(backButton).toBeVisible();
  await backButton.click();

  await waitForRoute(page, { view: 'escolas' });
  await expect(page).toHaveURL(/\/carteira$/);
  expect(await page.evaluate(() => window.RadarNavigationContext.size())).toBe(0);
});

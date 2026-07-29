const { test, expect } = require('@playwright/test');

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function waitForRadarRoute(page, expected) {
  await page.waitForFunction(target => {
    const route = window.RadarNavigationHistory?.currentRoute?.(window);
    if (window.RadarDataContext?.ready !== true || !route) return false;
    if (target.view && route.view !== target.view) return false;
    if (Object.hasOwn(target, 'param') && route.param !== target.param) return false;
    if (Object.hasOwn(target, 'section') && route.section !== target.section) return false;
    if (target.schoolFilter && route.filters?.escola !== target.schoolFilter) return false;
    return true;
  }, expected);
}

async function openCarteira(page) {
  await page.goto('/carteira');
  await waitForRadarRoute(page, { view: 'escolas' });
  await expect(page).toHaveURL(/\/carteira$/);
  const schoolLink = page.locator(
    'a[data-radar-route="true"][href^="/escolas/"]'
  ).first();
  await expect(schoolLink).toBeVisible();
  return schoolLink;
}

test('rota de escola, aba de pendências, filtro e histórico permanecem estáveis', async ({ page }) => {
  const schoolLink = await openCarteira(page);
  const schoolHref = await schoolLink.getAttribute('href');
  const schoolId = decodeURIComponent(schoolHref.split('/').filter(Boolean).at(-1));
  const escapedSchoolId = escapeRegExp(schoolId);

  await schoolLink.click();
  await waitForRadarRoute(page, {
    view: 'prontuario',
    param: schoolId,
    section: null
  });
  await expect(page).toHaveURL(new RegExp(`/escolas/${escapedSchoolId}$`));
  await expect(page.locator('#main-container .school-grid')).toBeVisible();

  const pendencyTab = page.locator('.tab-button[data-tab="pendencias"]');
  await expect(pendencyTab).toBeVisible();
  await pendencyTab.click();
  await waitForRadarRoute(page, {
    view: 'prontuario',
    param: schoolId,
    section: 'pendencias'
  });
  await expect(page).toHaveURL(
    new RegExp(`/escolas/${escapedSchoolId}/pendencias$`)
  );
  await expect(page.locator('#tab-pendencias')).toHaveClass(/active/);

  await page.reload();
  await waitForRadarRoute(page, {
    view: 'prontuario',
    param: schoolId,
    section: 'pendencias'
  });
  await expect(page.locator('#tab-pendencias')).toHaveClass(/active/);

  const globalPendenciesLink = page.locator(
    'a[data-radar-school-pendencies-link="true"]'
  );
  await expect(globalPendenciesLink).toBeVisible();
  await globalPendenciesLink.click();
  await waitForRadarRoute(page, {
    view: 'pendencias',
    schoolFilter: schoolId
  });
  await expect(page).toHaveURL(
    new RegExp(`/pendencias\\?escola=${escapedSchoolId}$`)
  );
  await expect(page.locator('[data-radar-pendency-school-filter="true"]')).toBeVisible();

  await page.goBack();
  await waitForRadarRoute(page, {
    view: 'prontuario',
    param: schoolId,
    section: 'pendencias'
  });
  await expect(page.locator('#tab-pendencias')).toHaveClass(/active/);

  await page.goForward();
  await waitForRadarRoute(page, {
    view: 'pendencias',
    schoolFilter: schoolId
  });
  await expect(page.locator('[data-radar-pendency-school-filter="true"]')).toBeVisible();
});

test('botão Voltar restaura a origem contextual, competência, rolagem e foco', async ({ page }) => {
  const schoolLink = await openCarteira(page);
  const schoolHref = await schoolLink.getAttribute('href');
  const schoolId = decodeURIComponent(schoolHref.split('/').filter(Boolean).at(-1));
  const activeCompetence = await page.evaluate(() => window.RadarCompetenceContext.getState().activeKey);

  await schoolLink.evaluate(element => {
    window.scrollTo(0, 360);
    element.focus({ preventScroll: true });
    element.click();
  });
  await waitForRadarRoute(page, { view: 'prontuario', param: schoolId, section: null });

  const backButton = page.locator('[data-radar-contextual-back="true"]');
  await expect(backButton).toBeVisible();
  await expect(backButton).toContainText(/Voltar/);
  await backButton.click();

  await waitForRadarRoute(page, { view: 'escolas' });
  await expect(page).toHaveURL(/\/carteira$/);
  await expect.poll(() => page.evaluate(() => window.RadarCompetenceContext.getState().activeKey))
    .toBe(activeCompetence);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)))
    .toBeGreaterThanOrEqual(300);

  const restoredLink = page.locator(`a[data-radar-route="true"][href="${schoolHref}"]`);
  await expect(restoredLink).toBeFocused();
});

test('link de escola abre em nova aba usando a própria URL', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Nova aba é homologada no desktop.');

  const schoolLink = await openCarteira(page);
  const schoolHref = await schoolLink.getAttribute('href');
  await schoolLink.evaluate(element => { element.target = '_blank'; });

  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    schoolLink.click()
  ]);
  await newPage.waitForLoadState('domcontentloaded');
  await waitForRadarRoute(newPage, { view: 'prontuario' });
  await expect(newPage).toHaveURL(new RegExp(`${escapeRegExp(schoolHref)}$`));
  await expect(newPage.locator('#main-container .school-grid')).toBeVisible();
  await newPage.close();
});

test('escola inexistente e telas proibidas recebem fallback autorizado', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Matriz de perfis é homologada no desktop.');

  await page.goto('/escolas/04.99.999');
  await waitForRadarRoute(page, { view: 'escolas' });
  await expect(page).toHaveURL(/\/carteira$/);

  await page.evaluate(() => switchProfile('inventario'));
  await page.evaluate(() => {
    window.RadarNavigationHistory.navigate(window, { view: 'pendencias' });
  });
  await waitForRadarRoute(page, { view: 'dashboard' });
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.evaluate(() => switchProfile('sme'));
  await page.evaluate(() => {
    window.RadarNavigationHistory.navigate(window, { view: 'sme-config' });
  });
  await waitForRadarRoute(page, { view: 'sme-config' });
  await expect(page).toHaveURL(/\/gestao-sme$/);
  await expect(page.getByRole('heading', { name: /Parâmetros da SME/i })).toBeVisible();
});

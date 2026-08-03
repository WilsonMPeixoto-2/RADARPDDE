const { test, expect } = require('@playwright/test');

test('mantém competência, exercício e ações integralmente acessíveis no cabeçalho móvel', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#app-layout')).toBeVisible();

  const competenceSelect = page.locator('#global-competence-select');
  await expect(competenceSelect).toBeVisible();
  await expect(competenceSelect.locator('option')).toHaveCount(12);
  await competenceSelect.selectOption('2026-08');
  await expect(competenceSelect).toHaveValue('2026-08');
  await expect(page.locator('#global-competence-label')).toContainText('Agosto');

  await expect(page.locator('#exercise-select')).toBeVisible();
  await expect(page.locator('#theme-toggle-btn')).toBeVisible();
  await expect(page.locator('#alerts-bell-container')).toBeVisible();
  await expect(page.locator('.profile-switcher')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const actions = document.querySelector('.header-actions');
    const badge = document.querySelector('.global-competence-control');
    const competence = document.querySelector('#global-competence-select');
    const exercise = document.querySelector('#exercise-select');
    const theme = document.querySelector('#theme-toggle-btn');
    const alerts = document.querySelector('#alerts-bell-container');
    const profile = document.querySelector('.profile-switcher');
    const viewport = window.innerWidth;

    const describe = element => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        visible: rect.width > 0 && rect.height > 0,
        withinViewport: rect.left >= -1 && rect.right <= viewport + 1
      };
    };

    return {
      viewport,
      actions: {
        ...describe(actions),
        overflowX: getComputedStyle(actions).overflowX
      },
      badge: describe(badge),
      competence: describe(competence),
      exercise: describe(exercise),
      theme: describe(theme),
      alerts: describe(alerts),
      profile: describe(profile)
    };
  });

  expect(geometry.actions.scrollWidth).toBeLessThanOrEqual(geometry.actions.clientWidth + 1);
  expect(geometry.actions.overflowX).not.toMatch(/auto|scroll/);
  expect(geometry.badge.scrollWidth).toBeLessThanOrEqual(geometry.badge.clientWidth + 1);

  for (const control of ['badge', 'competence', 'exercise', 'theme', 'alerts', 'profile']) {
    expect(geometry[control].visible, `${control} não está visível`).toBe(true);
    expect(geometry[control].withinViewport, `${control} está cortado fora da viewport`).toBe(true);
  }

  const screenshotPath = testInfo.outputPath('mobile-header-controls.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await testInfo.attach('mobile-header-controls', {
    path: screenshotPath,
    contentType: 'image/png'
  });

  expect(pageErrors).toEqual([]);
});

test('reserva a geometria final do cabeçalho antes do bootstrap móvel', async ({ page }, testInfo) => {
  test.skip(!/mobile.*chromium/i.test(testInfo.project.name), 'LayoutShift é homologado no projeto Chromium móvel.');

  await page.addInitScript(() => {
    window.__radarLayoutShiftSupported = Boolean(
      window.PerformanceObserver
      && Array.isArray(window.PerformanceObserver.supportedEntryTypes)
      && window.PerformanceObserver.supportedEntryTypes.includes('layout-shift')
    );
    window.__radarLayoutShiftScore = 0;
    if (!window.__radarLayoutShiftSupported) return;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__radarLayoutShiftScore += entry.value;
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    window.__radarLayoutShiftObserver = observer;
  });

  await page.goto('/');
  await expect(page.locator('#mobile-menu-button')).toBeVisible();
  await expect(page.locator('#global-competence-select')).toBeVisible();
  await expect(page.locator('#main-container')).toBeVisible();
  await page.waitForTimeout(1500);

  const measurement = await page.evaluate(() => ({
    supported: window.__radarLayoutShiftSupported,
    score: window.__radarLayoutShiftScore,
    headerHeight: document.querySelector('header.top-header')?.getBoundingClientRect().height || 0,
    mainTop: document.querySelector('#main-container')?.getBoundingClientRect().top || 0
  }));

  expect(measurement.supported).toBe(true);
  expect(measurement.headerHeight).toBeGreaterThanOrEqual(230);
  expect(measurement.mainTop).toBeGreaterThanOrEqual(230);
  expect(measurement.score).toBeLessThan(0.05);
});

const { test, expect } = require('@playwright/test');

test('mantém competência, exercício e ações integralmente acessíveis no cabeçalho móvel', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('.global-competence-badge')).toContainText('Competência global:');
  await expect(page.locator('#exercise-select')).toBeVisible();
  await expect(page.locator('#theme-toggle-btn')).toBeVisible();
  await expect(page.locator('#alerts-bell-container')).toBeVisible();
  await expect(page.locator('.profile-switcher')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const actions = document.querySelector('.header-actions');
    const badge = document.querySelector('.global-competence-badge');
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
      exercise: describe(exercise),
      theme: describe(theme),
      alerts: describe(alerts),
      profile: describe(profile)
    };
  });

  expect(geometry.actions.scrollWidth).toBeLessThanOrEqual(geometry.actions.clientWidth + 1);
  expect(geometry.actions.overflowX).not.toMatch(/auto|scroll/);
  expect(geometry.badge.scrollWidth).toBeLessThanOrEqual(geometry.badge.clientWidth + 1);

  for (const control of ['badge', 'exercise', 'theme', 'alerts', 'profile']) {
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

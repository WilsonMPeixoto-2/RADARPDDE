const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const gateEnabled = process.env.RADAR_E2E_PROFILE_VIEWPORT_GATE === '1';
test.skip(!gateEnabled, 'Esta suíte exige o gate remoto de perfis e viewports no GitHub Actions.');

const fixtureFile = process.env.RADAR_HML_FIXTURE_FILE;
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
const expectedEnvironment = process.env.RADAR_EXPECTED_RUNTIME_ENVIRONMENT || 'test';

if (gateEnabled && (!fixtureFile || !fs.existsSync(fixtureFile))) {
  throw new Error('Fixture de identidades do gate ausente.');
}
if (gateEnabled && password.length < 24) {
  throw new Error('Senha efêmera do gate ausente.');
}

const parsedFixture = gateEnabled
  ? JSON.parse(fs.readFileSync(path.resolve(fixtureFile), 'utf8'))
  : [];
const fixtureUsers = Array.isArray(parsedFixture) ? parsedFixture : (parsedFixture.users || []);
const PROFILE_DEFINITIONS = Object.freeze([
  ['technicalAdmin', 'technical_admin'],
  ['assistant', 'federal_assistant'],
  ['controller', 'controller'],
  ['inventory', 'inventory'],
  ['sme', 'sme_management']
]);
const users = Object.fromEntries(PROFILE_DEFINITIONS.map(([key, profileId]) => [
  key,
  fixtureUsers.find(user => user.profileId === profileId && user.active !== false)
]));

test.describe.configure({ mode: 'serial' });

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`));
  });
  return errors;
}

function isDesktopProject(testInfo) {
  return testInfo.project.name === 'supabase-preview-desktop-chromium';
}

async function signIn(page, user) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(user.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(expectedRole => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === expectedRole
  ), user.profileId, { timeout: 30000 });
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
}

async function ensureNavigationOpen(page) {
  const sidebar = page.locator('.sidebar');
  const mobileMenu = page.locator('#mobile-menu-button');

  if (!(await mobileMenu.isVisible())) {
    await expect(sidebar).toBeVisible();
    return;
  }

  const open = await sidebar.evaluate(element => element.classList.contains('mobile-open'));
  if (!open) {
    await expect(mobileMenu).toHaveAttribute('aria-expanded', 'false');
    await mobileMenu.click();
  }

  await expect(mobileMenu).toHaveAttribute('aria-expanded', 'true');
  await expect(sidebar).toHaveClass(/mobile-open/);
  await page.waitForFunction(() => {
    const element = document.querySelector('.sidebar');
    if (!element?.classList.contains('mobile-open')) return false;
    const style = window.getComputedStyle(element);
    return style.visibility === 'visible'
      && style.pointerEvents !== 'none'
      && ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(style.transform);
  });
  await expect(sidebar).toBeVisible();
}

async function navigateAvailableSurfaces(page, testInfo) {
  await ensureNavigationOpen(page);
  const visibleItems = page.locator('.sidebar .nav-item:visible');
  const targetIds = await visibleItems.evaluateAll(items => items
    .map(item => item.id)
    .filter(Boolean));
  expect(targetIds.length).toBeGreaterThan(0);

  const limit = isDesktopProject(testInfo) ? targetIds.length : Math.min(targetIds.length, 3);
  for (const targetId of targetIds.slice(0, limit)) {
    await ensureNavigationOpen(page);
    const item = page.locator(`#${targetId}`);
    await expect(item).toBeVisible();
    await item.scrollIntoViewIfNeeded();
    await item.click();
    await expect(page.locator('#main-container')).toBeVisible();

    if (!isDesktopProject(testInfo)) {
      await expect(page.locator('#mobile-menu-button')).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('.sidebar')).not.toHaveClass(/mobile-open/);
    }
  }
}

async function expectResponsiveLayout(page) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    authRole: document.body.dataset.authRole || '',
    logoutHidden: document.getElementById('auth-logout-button')?.hidden ?? true
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 2);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 2);
  expect(metrics.logoutHidden).toBe(false);
  return metrics;
}

for (const [key] of PROFILE_DEFINITIONS) {
  test(`${key} mantém identidade, permissões e navegação responsiva`, async ({ page }, testInfo) => {
    const errors = collectErrors(page);
    const user = users[key];
    expect(user, `fixture ativa ausente para ${key}`).toBeTruthy();

    await signIn(page, user);

    const runtime = await page.evaluate(() => ({
      environment: window.RADAR_PDDE_CONFIG.environment,
      dataMode: window.RADAR_PDDE_CONFIG.dataMode,
      repository: window.RadarDataContext.capabilities.mode,
      role: window.RadarAuthContext.authorization.role,
      hasSessionInPublicContext: Object.hasOwn(window.RadarDataContext.authentication, 'session'),
      profileSwitcherHidden: document.querySelector('.profile-switcher')?.hidden
    }));

    expect(runtime).toEqual({
      environment: expectedEnvironment,
      dataMode: 'supabase-preview',
      repository: 'supabase',
      role: user.profileId,
      hasSessionInPublicContext: false,
      profileSwitcherHidden: key !== 'technicalAdmin'
    });

    const layout = await expectResponsiveLayout(page);
    expect(layout.authRole).toBe(user.profileId);
    await navigateAvailableSurfaces(page, testInfo);

    await page.reload();
    await page.waitForFunction(expectedRole => (
      window.RadarDataContext?.ready === true
      && window.RadarAuthContext?.authorization?.role === expectedRole
    ), user.profileId, { timeout: 30000 });
    await expect(page.locator('#radar-auth-gate')).toBeHidden();

    await page.locator('#auth-logout-button').click();
    await expect(page.locator('#radar-auth-gate')).toBeVisible();
    await expect(page.locator('#radar-auth-status')).toContainText(/sessão/i);
    expect(errors).toEqual([]);
  });
}

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const gateEnabled = process.env.RADAR_E2E_PROFILE_VIEWPORT_GATE === '1';
test.skip(!gateEnabled, 'Esta suíte exige o gate remoto de perfis e viewports no GitHub Actions.');

const fixtureFile = process.env.RADAR_HML_FIXTURE_FILE;
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

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
const assistant = fixtureUsers.find(user => user.profileId === 'federal_assistant' && user.active !== false);

const OFFICE_VIEWPORTS = Object.freeze([
  ['1366x768', 1366, 768],
  ['1440x900', 1440, 900],
  ['1536x864', 1536, 864],
  ['1920x1080', 1920, 1080]
]);

function isDesktopProject(testInfo) {
  return testInfo.project.name === 'supabase-preview-desktop-chromium';
}

async function signIn(page) {
  expect(assistant, 'Fixture ativa do Assistente ausente.').toBeTruthy();
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(assistant.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'federal_assistant'
  ), null, { timeout: 30000 });
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
}

async function capture(page, testInfo, filename) {
  const output = testInfo.outputPath('visual-post-pr291', filename);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage: true });
  await testInfo.attach(filename, { path: output, contentType: 'image/png' });
}

async function assertNoGlobalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(metrics.html).toBeLessThanOrEqual(metrics.viewport + 2);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 2);
}

async function assertAssistantLabelFits(page) {
  const geometry = await page.locator('#profile-btn-label').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      text: element.textContent?.trim() || '',
      left: rect.left,
      right: rect.right,
      viewport: document.documentElement.clientWidth,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    };
  });
  expect(geometry.text).toBe('Assistente de Verbas Federais');
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function openPendencies(page) {
  await page.locator('#nav-pendencias').click();
  await expect(page.getByRole('heading', { name: /Pendências operacionais/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ver detalhes/i }).first()).toBeVisible();
}

test('auditoria visual pós-PR291 em desktops de escritório e 4K', async ({ page }, testInfo) => {
  test.skip(!isDesktopProject(testInfo), 'Auditoria visual dedicada ao desktop.');
  test.setTimeout(180000);

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });

  await signIn(page);

  for (const [name, width, height] of OFFICE_VIEWPORTS) {
    await page.setViewportSize({ width, height });
    await page.locator('#nav-dashboard').click();
    await expect(page.locator('#main-container')).toBeVisible();
    await assertNoGlobalOverflow(page);
    await assertAssistantLabelFits(page);
    await capture(page, testInfo, `assistant-dashboard-${name}.png`);

    await openPendencies(page);
    await assertNoGlobalOverflow(page);
    await assertAssistantLabelFits(page);
    await capture(page, testInfo, `assistant-pendencias-${name}.png`);

    const main = page.locator('#main-container');
    const before = await main.evaluate(element => element.getBoundingClientRect().width);
    await page.getByRole('button', { name: /Ver detalhes/i }).first().click();
    await expect(page.locator('#pendency-detail-drawer')).toBeVisible();
    const after = await main.evaluate(element => element.getBoundingClientRect().width);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
    await assertNoGlobalOverflow(page);
    await capture(page, testInfo, `assistant-pendencias-drawer-${name}.png`);

    const close = page.locator('button[aria-label="Fechar detalhes"]').first();
    await expect(close).toBeVisible();
    await close.click();
    await expect(page.locator('#pendency-detail-drawer')).toBeHidden();
  }

  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.locator('#nav-dashboard').click();
  const dark = await page.evaluate(() => document.body.classList.contains('dark-theme'));
  if (!dark) {
    const toggle = page.locator('button[title="Mudar para Tema Escuro"]');
    await expect(toggle).toBeVisible();
    await toggle.click();
  }
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('dark-theme'))).toBe(true);
  await assertNoGlobalOverflow(page);
  await assertAssistantLabelFits(page);
  await capture(page, testInfo, 'assistant-dashboard-3840x2160-dark.png');

  await openPendencies(page);
  await assertNoGlobalOverflow(page);
  await capture(page, testInfo, 'assistant-pendencias-3840x2160-dark.png');

  expect(pageErrors).toEqual([]);
});

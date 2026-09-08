'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  validateAccountsDocument,
  isSuspiciousMutationRequest,
  sanitizeObservedError
} = require('../support/production-authenticated-read.js');

const enabled = process.env.RADAR_E2E_PRODUCTION_HUMAN_AUDIT === '1';
test.skip(!enabled, 'Auditoria visual autenticada exige as contas técnicas protegidas de Production.');

const accountsFile = process.env.RADAR_PRODUCTION_READ_ACCOUNTS_FILE || '';
if (enabled && (!accountsFile || !fs.existsSync(accountsFile))) {
  throw new Error('Arquivo protegido de contas técnicas não foi disponibilizado.');
}

const parsedAccounts = enabled
  ? JSON.parse(fs.readFileSync(path.resolve(accountsFile), 'utf8'))
  : { accounts: [] };
const validation = validateAccountsDocument(parsedAccounts);
if (enabled && !validation.ok) {
  throw new Error(`Configuração das contas técnicas inválida: ${validation.errors.join(' ')}`);
}
const accounts = validation.accounts;
const ROOT = path.resolve('artifacts/human-product-audit');
const ROUTE_SETTLE_MS = 900;

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(30000);
});

function safeSlug(value) {
  return String(value || 'unknown')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function observePage(page) {
  const errors = [];
  const mutations = [];
  page.on('pageerror', error => errors.push(`pageerror: ${sanitizeObservedError(error.message)}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${sanitizeObservedError(message.text())}`);
  });
  page.on('request', request => {
    if (isSuspiciousMutationRequest(request.method(), request.url())) {
      const url = new URL(request.url());
      mutations.push(`${request.method()} ${url.origin}${url.pathname}`);
    }
  });
  return { errors, mutations };
}

async function waitForApplication(page, expectedRole) {
  await page.waitForFunction(role => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === role
  ), expectedRole, { timeout: 45000 });
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
}

async function signIn(page, account) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(account.email);
  await page.locator('#radar-auth-password').fill(account.password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await waitForApplication(page, account.profileId);
}

async function collectVisibleContract(page) {
  return page.evaluate(() => {
    const visible = element => {
      if (!element || element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const texts = selector => [...document.querySelectorAll(selector)]
      .filter(visible)
      .map(element => (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    return {
      url: location.href,
      title: document.title,
      headings: texts('h1,h2,h3').slice(0, 30),
      buttons: texts('button').slice(0, 80),
      links: texts('a').slice(0, 80),
      visibleNav: [...document.querySelectorAll('.nav-item[id^="nav-"]')]
        .filter(visible)
        .map(element => ({ id: element.id, text: (element.innerText || '').trim().replace(/\s+/g, ' ') })),
      visibleInputs: [...document.querySelectorAll('input,select,textarea')]
        .filter(visible)
        .map(element => ({
          id: element.id || null,
          name: element.getAttribute('name'),
          type: element.getAttribute('type') || element.tagName.toLowerCase(),
          placeholder: element.getAttribute('placeholder') || null,
          ariaLabel: element.getAttribute('aria-label') || null
        }))
    };
  });
}

async function capture(page, profileDir, label, records) {
  await page.locator('#main-container').waitFor({ state: 'visible' });
  await page.waitForTimeout(ROUTE_SETTLE_MS);
  const slug = safeSlug(label);
  const file = path.join(profileDir, `${slug}.png`);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  const contract = await collectVisibleContract(page);
  records.push({ label, screenshot: path.basename(file), ...contract });
}

async function captureSearchAndAlerts(page, profileDir, records) {
  const search = page.locator('#global-search');
  if (await search.count() && await search.isVisible()) {
    await search.fill('04.');
    await page.waitForTimeout(500);
    if (await page.locator('#global-search-results').isVisible().catch(() => false)) {
      await page.screenshot({ path: path.join(profileDir, 'global-search-open.png'), fullPage: true, animations: 'disabled' });
      records.push({ label: 'global-search-open', ...(await collectVisibleContract(page)) });
    }
    await search.fill('zzzz-auditoria-sem-resultado');
    await page.waitForTimeout(500);
    if (await page.locator('#global-search-results').isVisible().catch(() => false)) {
      await page.screenshot({ path: path.join(profileDir, 'global-search-empty.png'), fullPage: true, animations: 'disabled' });
      records.push({ label: 'global-search-empty', ...(await collectVisibleContract(page)) });
    }
    await search.press('Escape').catch(() => {});
    await search.fill('');
  }

  const bell = page.locator('#alerts-bell-container > .bell-button');
  if (await bell.count() && await bell.isVisible()) {
    await bell.click();
    await page.waitForTimeout(300);
    if (await page.locator('#alerts-dropdown').isVisible().catch(() => false)) {
      await page.screenshot({ path: path.join(profileDir, 'alerts-open.png'), fullPage: true, animations: 'disabled' });
      records.push({ label: 'alerts-open', ...(await collectVisibleContract(page)) });
    }
    await page.keyboard.press('Escape').catch(() => {});
  }
}

for (const account of accounts) {
  test(`${account.profileId} — auditoria visual das superfícies realmente visíveis`, async ({ browser }) => {
    const profile = safeSlug(account.profileId);
    const profileDir = path.join(ROOT, profile);
    fs.mkdirSync(profileDir, { recursive: true });
    const records = [];
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const observation = observePage(page);

    await signIn(page, account);
    await capture(page, profileDir, 'landing', records);
    await captureSearchAndAlerts(page, profileDir, records);

    const navIds = await page.locator('.nav-item[id^="nav-"]:visible').evaluateAll(items => items.map(item => item.id));
    for (const navId of navIds) {
      const item = page.locator(`#${navId}`);
      if (!await item.isVisible().catch(() => false)) continue;
      await item.click();
      await capture(page, profileDir, navId.replace(/^nav-/, ''), records);
    }

    fs.writeFileSync(
      path.join(profileDir, 'surface-contract.json'),
      JSON.stringify({ profileId: account.profileId, records, errors: observation.errors, mutations: observation.mutations }, null, 2)
    );

    expect(observation.mutations, 'A auditoria visual emitiu requisição potencialmente mutante.').toEqual([]);
    expect(observation.errors, 'O navegador registrou erros durante a auditoria visual.').toEqual([]);
    await context.close();
  });
}

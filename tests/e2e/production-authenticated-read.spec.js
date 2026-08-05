'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  validateAccountsDocument,
  isSuspiciousMutationRequest,
  sanitizeObservedError
} = require('../support/production-authenticated-read.js');

const enabled = process.env.RADAR_E2E_PRODUCTION_AUTHENTICATED_READ === '1';
test.skip(!enabled, 'Esta suíte exige identidades técnicas dedicadas de Production.');

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
const EXPECTED_ENVIRONMENT = 'production';
const EXPECTED_DATA_MODE = 'supabase-production';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(30000);
});

function observePage(page) {
  const errors = [];
  const mutations = [];

  page.on('pageerror', error => {
    errors.push(`pageerror: ${sanitizeObservedError(error.message)}`);
  });
  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(`console: ${sanitizeObservedError(message.text())}`);
    }
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
  await expect(page.locator('#auth-logout-button')).toBeVisible();
}

async function signIn(page, account) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(account.email);
  await page.locator('#radar-auth-password').fill(account.password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await waitForApplication(page, account.profileId);
}

async function readAuthorizedProjection(page, profileId) {
  return page.evaluate(async role => {
    const client = window.RadarSessionContext?.service?.client;
    if (!client) throw new Error('Cliente Supabase autenticado indisponível.');

    const run = async query => {
      const result = await query;
      return {
        rows: Array.isArray(result.data) ? result.data : [],
        error: result.error ? {
          code: result.error.code || null,
          message: result.error.message || 'Erro de leitura'
        } : null
      };
    };

    const schools = await run(client
      .from('schools')
      .select('id,designation,denomination,controller_id')
      .order('id', { ascending: true })
      .limit(25));
    const verifications = await run(client
      .from('verifications')
      .select('id,school_id,competence_id,program_id')
      .limit(10));
    const pendencies = await run(client
      .from('pendencies')
      .select('id,school_id,status')
      .limit(10));
    const assets = await run(client
      .from('assets')
      .select('id,school_id,status')
      .limit(10));

    let portfolio = { rows: [], error: null };
    if (role !== 'inventory') {
      portfolio = await run(client
        .from('school_programs')
        .select('id,school_id,program_id,active')
        .limit(10));
    }

    return { schools, verifications, pendencies, assets, portfolio };
  }, profileId);
}

function expectReadSucceeded(result, label) {
  expect(result.error, `${label} retornou erro de leitura`).toBeNull();
  expect(Array.isArray(result.rows), `${label} não retornou coleção`).toBe(true);
}

async function proveGlobalSearch(page, school) {
  const query = String(
    school.designation
    || school.denomination
    || school.id
    || ''
  ).trim();
  expect(query.length).toBeGreaterThanOrEqual(2);

  const input = page.locator('#global-search');
  await input.fill(query);
  const panel = page.locator('#global-search-results');
  await expect(panel).toBeVisible();
  await expect(panel.locator('[role="option"]')).not.toHaveCount(0);
  await input.press('Escape');
  await expect(panel).toBeHidden();
}

async function proveDashboard(page) {
  await page.locator('#nav-dashboard').click();
  await expect(page.locator('#main-container')).toBeVisible();
}

async function provePortfolio(page, profileId) {
  const navigation = page.locator('#nav-escolas');
  if (profileId === 'inventory') {
    await expect(navigation).toBeHidden();
    return null;
  }

  await expect(navigation).toBeVisible();
  await navigation.click();
  await expect(page.getByRole('heading', { name: 'Resultado da carteira' })).toBeVisible();
  return page.getByRole('link', { name: 'Ver Unidade' }).first();
}

async function proveSchoolRecord(page, school, portfolioLink, expectedRole) {
  if (portfolioLink && await portfolioLink.count() > 0 && await portfolioLink.isVisible()) {
    await portfolioLink.click();
  } else {
    await page.goto(`/escolas/${encodeURIComponent(school.id)}`);
  }

  await waitForApplication(page, expectedRole);
  await expect(page).toHaveURL(/\/escolas\/[^/?#]+/);
  await expect(page.locator('#main-container')).toBeVisible();
}

async function provePendencies(page) {
  await page.locator('#nav-pendencias').click();
  await expect(page.getByRole('heading', { name: /Pendências operacionais/i })).toBeVisible();
}

for (const account of accounts) {
  test(`${account.profileId} conclui as leituras autorizadas sem mutação`, async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const observation = observePage(page);

    await signIn(page, account);

    const runtime = await page.evaluate(() => ({
      environment: window.RADAR_PDDE_CONFIG?.environment,
      dataMode: window.RADAR_PDDE_CONFIG?.dataMode,
      repository: window.RadarDataContext?.capabilities?.mode,
      role: window.RadarAuthContext?.authorization?.role,
      hasSessionInPublicContext: Object.hasOwn(
        window.RadarDataContext?.authentication || {},
        'session'
      )
    }));
    expect(runtime).toEqual({
      environment: EXPECTED_ENVIRONMENT,
      dataMode: EXPECTED_DATA_MODE,
      repository: 'supabase',
      role: account.profileId,
      hasSessionInPublicContext: false
    });

    const projection = await readAuthorizedProjection(page, account.profileId);
    expectReadSucceeded(projection.schools, 'schools');
    expectReadSucceeded(projection.verifications, 'verifications');
    expectReadSucceeded(projection.pendencies, 'pendencies');
    expectReadSucceeded(projection.assets, 'assets');
    if (account.profileId !== 'inventory') {
      expectReadSucceeded(projection.portfolio, 'school_programs');
    }
    expect(projection.schools.rows.length, 'Nenhuma escola autorizada foi retornada.').toBeGreaterThan(0);

    const school = projection.schools.rows[0];
    await proveDashboard(page);
    await proveGlobalSearch(page, school);
    const portfolioLink = await provePortfolio(page, account.profileId);
    await proveSchoolRecord(page, school, portfolioLink, account.profileId);
    await provePendencies(page);

    await page.reload();
    await waitForApplication(page, account.profileId);
    await page.locator('#auth-logout-button').click();
    await expect(page.locator('#radar-auth-gate')).toBeVisible();

    expect(observation.mutations, 'O smoke emitiu requisição potencialmente mutante.').toEqual([]);
    expect(observation.errors, 'O navegador registrou erros durante a leitura.').toEqual([]);
    await context.close();
  });
}

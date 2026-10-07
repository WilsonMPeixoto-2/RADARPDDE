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
const writeEnabled = process.env.RADAR_PRODUCTION_WRITE_SMOKE_ENABLED === '1';
const requireWrite = writeEnabled && process.env.RADAR_PRODUCTION_WRITE_SMOKE_REQUIRED === '1';
test.skip(!enabled, 'Esta suíte exige contas reais autorizadas de Production.');

const accountsFile = process.env.RADAR_PRODUCTION_READ_ACCOUNTS_FILE || '';
if (enabled && (!accountsFile || !fs.existsSync(accountsFile))) {
  throw new Error('Arquivo protegido de contas reais não foi disponibilizado.');
}

const parsedAccounts = enabled
  ? JSON.parse(fs.readFileSync(path.resolve(accountsFile), 'utf8'))
  : { accounts: [] };
const validation = validateAccountsDocument(parsedAccounts, { requireWrite });
if (enabled && !validation.ok) {
  throw new Error(`Configuração das contas reais inválida: ${validation.errors.join(' ')}`);
}

const accounts = validation.accounts;
const writer = accounts.find(account => account.allowWrite) || null;
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

function observeErrors(page) {
  const errors = [];
  page.on('pageerror', error => {
    errors.push(`pageerror: ${sanitizeObservedError(error.message)}`);
  });
  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(`console: ${sanitizeObservedError(message.text())}`);
    }
  });
  return errors;
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

async function settleRemote(page) {
  await page.evaluate(async () => {
    const tail = window.RadarApplicationServices?.data?.remoteExecutionTail;
    if (tail && typeof tail.then === 'function') await tail;
  });
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

async function chooseWriteContext(page) {
  return page.evaluate(async () => {
    const client = window.RadarSessionContext?.service?.client;
    if (!client) throw new Error('Cliente Supabase autenticado indisponível.');

    const invoices = await client
      .from('registered_invoices')
      .select('school_id,competence_id,program_id')
      .order('registered_at', { ascending: false })
      .limit(100);
    if (invoices.error) throw new Error(invoices.error.message);

    const schools = await client
      .from('schools')
      .select('id')
      .limit(200);
    if (schools.error) throw new Error(schools.error.message);
    const allowedSchools = new Set((schools.data || []).map(row => row.id));

    const context = (invoices.data || []).find(row => (
      allowedSchools.has(row.school_id)
      && row.competence_id
      && row.program_id
    ));
    if (!context) {
      throw new Error('Nenhum contexto fiscal existente e autorizado foi localizado para o smoke reversível.');
    }

    const verification = await client
      .from('verifications')
      .select('id,analysis,bonification,bonus_result,row_version')
      .eq('school_id', context.school_id)
      .eq('competence_id', context.competence_id)
      .eq('program_id', context.program_id)
      .limit(1)
      .maybeSingle();
    if (verification.error) throw new Error(verification.error.message);
    if (!verification.data) throw new Error('Verificação do contexto de escrita não foi localizada.');

    return {
      schoolId: context.school_id,
      competenceId: context.competence_id,
      programId: context.program_id,
      businessSnapshot: {
        analysis: verification.data.analysis,
        bonification: verification.data.bonification,
        bonusResult: verification.data.bonus_result
      }
    };
  });
}

async function readRemoteInvoice(page, schoolId, invoiceNumber) {
  return page.evaluate(async ({ schoolId: targetSchool, invoiceNumber: targetNumber }) => {
    const client = window.RadarSessionContext?.service?.client;
    const result = await client
      .from('registered_invoices')
      .select('id,school_id,competence_id,program_id,invoice_number,description,expense_type,amount,row_version')
      .eq('school_id', targetSchool)
      .eq('invoice_number', targetNumber)
      .limit(2);
    if (result.error) throw new Error(result.error.message);
    return result.data || [];
  }, { schoolId, invoiceNumber });
}

async function readVerificationBusinessState(page, context) {
  return page.evaluate(async input => {
    const client = window.RadarSessionContext?.service?.client;
    const result = await client
      .from('verifications')
      .select('analysis,bonification,bonus_result')
      .eq('school_id', input.schoolId)
      .eq('competence_id', input.competenceId)
      .eq('program_id', input.programId)
      .limit(1)
      .maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return {
      analysis: result.data?.analysis ?? null,
      bonification: result.data?.bonification ?? null,
      bonusResult: result.data?.bonus_result ?? null
    };
  }, context);
}

async function openWriteContext(page, context, expectedRole) {
  await page.goto(`/escolas/${encodeURIComponent(context.schoolId)}`);
  await waitForApplication(page, expectedRole);
  const competence = page.locator('#global-competence-select');
  await competence.selectOption(context.competenceId);
  const row = page.locator(
    `#prontuario-verif-rows tr[data-program-id="${context.programId}"][data-document-key="notaFiscal"]`
  );
  await expect(row).toBeVisible({ timeout: 45000 });
  return row;
}

async function cleanupResidualInvoice(page, account, context, invoiceNumber) {
  const residual = await readRemoteInvoice(page, context.schoolId, invoiceNumber);
  if (residual.length === 0) return;

  await openWriteContext(page, context, account.profileId);
  const invoiceId = residual[0].id;
  await page.waitForFunction(id => (
    Array.isArray(window.notasRegistradas)
      ? window.notasRegistradas.some(item => item.id === id)
      : typeof notasRegistradas !== 'undefined' && notasRegistradas.some(item => item.id === id)
  ), invoiceId, { timeout: 30000 }).catch(() => {});

  const cleanup = await page.evaluate(async ({ invoiceId: targetId, schoolId }) => {
    const list = typeof notasRegistradas !== 'undefined' ? notasRegistradas : [];
    if (!list.some(item => item.id === targetId)) {
      return { ok: false, reason: 'invoice-not-loaded' };
    }
    try {
      await radarInvoiceService.remove({
        id: targetId,
        schoolId,
        profile: getRadarAccessProfile()
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error?.message || 'cleanup-failed' };
    }
  }, { invoiceId, schoolId: context.schoolId });
  if (!cleanup.ok) {
    throw new Error(`Falha no cleanup do registro de teste: ${sanitizeObservedError(cleanup.reason)}`);
  }
  await settleRemote(page);
  expect(await readRemoteInvoice(page, context.schoolId, invoiceNumber)).toEqual([]);
}

for (const account of accounts) {
  test(`${account.profileId} conclui as leituras autorizadas com conta real`, async ({ browser }) => {
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

    expect(observation.mutations, 'A etapa de leitura emitiu requisição potencialmente mutante.').toEqual([]);
    expect(observation.errors, 'O navegador registrou erros durante a leitura.').toEqual([]);
    await context.close();
  });
}

test('conta real autorizada conclui ciclo fiscal criar, editar, reler e excluir em Production', async ({ browser }) => {
  test.skip(!writeEnabled || !writer, 'Ciclo de escrita habilitado apenas na execução manual autorizada.');
  const browserContext = await browser.newContext();
  const page = await browserContext.newPage();
  const errors = observeErrors(page);
  const runSuffix = String(process.env.GITHUB_RUN_ID || Date.now()).slice(-10);
  const invoiceNumber = `SMOKE-${runSuffix}`;
  const description = `TESTE_AUTOMACAO ${invoiceNumber}`;
  let writeContext = null;

  try {
    await signIn(page, writer);
    writeContext = await chooseWriteContext(page);
    const row = await openWriteContext(page, writeContext, writer.profileId);

    await row.getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
    const modal = page.locator('#modal-dados-nota');
    await expect(modal).toHaveClass(/show/);
    await modal.locator('#nota-tipo').selectOption('consumo');
    await modal.locator('#nota-numero').fill(invoiceNumber);
    await modal.locator('#nota-desc').fill(description);
    await modal.locator('#nota-valor').fill('1.23');
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toHaveClass(/show/);
    await settleRemote(page);

    let remote = await readRemoteInvoice(page, writeContext.schoolId, invoiceNumber);
    expect(remote).toHaveLength(1);
    expect(remote[0]).toMatchObject({
      school_id: writeContext.schoolId,
      competence_id: writeContext.competenceId,
      program_id: writeContext.programId,
      invoice_number: invoiceNumber,
      description,
      expense_type: 'consumo',
      amount: 1.23
    });

    let card = page.locator(`.invoice-document-row[data-invoice-id="${remote[0].id}"]`);
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: /^Editar (?:lançamento:|NF:)/ }).click();
    await modal.locator('#nota-valor').fill('2.34');
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toHaveClass(/show/);
    await settleRemote(page);

    remote = await readRemoteInvoice(page, writeContext.schoolId, invoiceNumber);
    expect(remote).toHaveLength(1);
    expect(remote[0].amount).toBe(2.34);

    await page.reload();
    await waitForApplication(page, writer.profileId);
    await page.locator('#global-competence-select').selectOption(writeContext.competenceId);
    card = page.locator(`.invoice-document-row[data-invoice-id="${remote[0].id}"]`);
    await expect(card).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await card.getByRole('button', { name: /^Excluir NF:/ }).click();
    await settleRemote(page);
    await expect(card).toHaveCount(0);
    expect(await readRemoteInvoice(page, writeContext.schoolId, invoiceNumber)).toEqual([]);

    const after = await readVerificationBusinessState(page, writeContext);
    expect(after).toEqual(writeContext.businessSnapshot);
    expect(errors, 'O navegador registrou erros durante o ciclo reversível.').toEqual([]);
  } finally {
    if (writeContext) {
      await cleanupResidualInvoice(page, writer, writeContext, invoiceNumber);
    }
    await browserContext.close();
  }
});

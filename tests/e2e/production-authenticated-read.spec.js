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


const controllerAccount = accounts.find(account => account.profileId === 'controller');

if (controllerAccount) {
  test('controller percorre o Prontuário em Production como usuário comum sem mutação', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const observation = observePage(page);
    const report = {
      route: [],
      flowLabels: [],
      unidentified: {},
      communication: {},
      contact: {},
      history: {},
      reanalysis: {}
    };

    await signIn(page, controllerAccount);
    report.route.push('login');

    await page.locator('#nav-dashboard').click();
    await expect(page.locator('#main-container')).toBeVisible();
    report.route.push('dashboard');

    await page.locator('#nav-escolas').click();
    await expect(page.getByRole('heading', { name: 'Resultado da carteira' })).toBeVisible();
    report.route.push('escolas');

    const firstSchool = page.getByRole('link', { name: 'Ver Unidade' }).first();
    await expect(firstSchool).toBeVisible();
    await firstSchool.click();
    await waitForApplication(page, controllerAccount.profileId);
    await expect(page).toHaveURL(/\/escolas\/[^/?#]+/);
    report.route.push('prontuario');

    const flowbar = page.locator('.prontuario-flowbar');
    await expect(flowbar).toBeVisible();
    report.flowLabels = (await flowbar.locator('button').allTextContents())
      .map(value => value.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    for (const label of [
      'Competências e Análises',
      'Gerar comunicação',
      'Registrar contato',
      'Histórico de Contatos'
    ]) {
      expect(
        report.flowLabels.some(value => value === label || value.startsWith(label)),
        'Ação esperada ausente no fluxo: ' + label
      ).toBe(true);
    }
    expect(report.flowLabels.some(value => value.startsWith('Pendências Ativas'))).toBe(true);

    const start = page.getByRole('button', {
      name: 'Registrar despesa a identificar',
      exact: true
    }).first();
    await expect(start).toBeVisible();
    report.unidentified.tooltip = await start.getAttribute('data-tooltip');
    expect(report.unidentified.tooltip).toContain('saída no extrato');
    expect(report.unidentified.tooltip).toContain('documentação');
    await start.hover();
    report.unidentified.tooltipVisual = await start.evaluate(element => {
      const style = getComputedStyle(element, '::after');
      return {
        opacity: Number.parseFloat(style.opacity),
        visibility: style.visibility,
        contentHasExtrato: style.content.includes('extrato')
      };
    });
    expect(report.unidentified.tooltipVisual.opacity).toBe(1);
    expect(report.unidentified.tooltipVisual.visibility).toBe('visible');
    expect(report.unidentified.tooltipVisual.contentHasExtrato).toBe(true);

    await start.click();
    const expenseModal = page.locator('#modal-dados-nota');
    await expect(expenseModal).toHaveClass(/show/);
    await expect(expenseModal.getByRole('heading', {
      name: 'Registrar despesa a identificar',
      exact: true
    })).toBeVisible();
    const invoiceNumber = expenseModal.getByLabel(
      'Número da Nota Fiscal (opcional neste estágio)',
      { exact: true }
    );
    await expect(invoiceNumber).toBeVisible();
    report.unidentified.invoiceNumberRequired = await invoiceNumber.evaluate(
      element => element.required
    );
    report.unidentified.introMentionsNoGuessing = (
      await expenseModal.locator('#nota-modal-intro').innerText()
    ).includes('Não invente');
    const registerExpense = expenseModal.getByRole('button', {
      name: 'Registrar Despesa',
      exact: true
    });
    const registerBox = await registerExpense.boundingBox();
    const viewport = page.viewportSize();
    report.unidentified.primaryActionInitiallyVisible = Boolean(
      registerBox
      && viewport
      && registerBox.y >= 0
      && registerBox.y + registerBox.height <= viewport.height
    );
    report.unidentified.modalScroll = await expenseModal.locator('.modal-body').evaluate(element => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      needsScroll: element.scrollHeight > element.clientHeight + 1
    }));
    expect(report.unidentified.invoiceNumberRequired).toBe(false);
    expect(report.unidentified.introMentionsNoGuessing).toBe(true);
    await expenseModal.locator('.btn-close').click();
    await expect(expenseModal).not.toHaveClass(/show/);

    const generate = page.getByRole('button', { name: 'Gerar comunicação', exact: true });
    await expect(generate).toBeVisible();
    report.communication.tooltip = await generate.getAttribute('data-tooltip');
    expect(report.communication.tooltip).toContain('Copiar o texto não registra envio');
    report.communication.style = await generate.evaluate(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        fontWeight: style.fontWeight,
        rowTop: Math.round(rect.top)
      };
    });

    let communicationDialog = null;
    page.once('dialog', async dialog => {
      communicationDialog = dialog.message();
      await dialog.accept();
    });
    await generate.click();
    await page.waitForTimeout(250);
    const communicationModal = page.locator('#modal-cobranca');
    report.communication.modalOpened = await communicationModal.evaluate(
      element => element.classList.contains('show')
    );
    report.communication.dialogShown = Boolean(communicationDialog);
    if (report.communication.modalOpened) {
      report.communication.hasPreview = await communicationModal
        .getByText('Pré-visualização da mensagem', { exact: true }).isVisible();
      report.communication.hasCopy = await communicationModal
        .getByRole('button', { name: 'Copiar texto', exact: true }).isVisible();
      const bodyText = await communicationModal.innerText();
      report.communication.explainsCopyIsNotContact = (
        bodyText.includes('Copiar')
        && bodyText.includes('Registrar contato')
      );
      expect(report.communication.hasPreview).toBe(true);
      expect(report.communication.hasCopy).toBe(true);
      expect(report.communication.explainsCopyIsNotContact).toBe(true);
      await communicationModal.locator('.btn-close').click();
      await expect(communicationModal).not.toHaveClass(/show/);
    }

    const registerContact = page.getByRole('button', { name: 'Registrar contato', exact: true });
    await expect(registerContact).toBeVisible();
    report.contact.tooltip = await registerContact.getAttribute('data-tooltip');
    expect(report.contact.tooltip).toContain('contato que realmente ocorreu');
    await registerContact.click();
    const contactModal = page.locator('#modal-contato');
    await expect(contactModal).toHaveClass(/show/);
    report.contact.hasChannel = await contactModal
      .getByLabel('Tipo de Contato', { exact: true }).isVisible();
    report.contact.hasPendencyLink = await contactModal
      .getByLabel('Vincular a uma Pendência (Opcional)', { exact: true }).isVisible();
    report.contact.hasDescription = await contactModal
      .getByLabel('Descrição do Atendimento', { exact: true }).isVisible();
    expect(report.contact.hasChannel).toBe(true);
    expect(report.contact.hasPendencyLink).toBe(true);
    expect(report.contact.hasDescription).toBe(true);
    await contactModal.locator('.btn-close').click();
    await expect(contactModal).not.toHaveClass(/show/);

    const historyTab = page.getByRole('tab', {
      name: 'Histórico de Contatos',
      exact: true
    });
    await expect(historyTab).toBeVisible();
    await historyTab.click();
    await expect(historyTab).toHaveAttribute('aria-selected', 'true');
    report.history.visible = await page.locator('#tab-contatos').isVisible();
    expect(report.history.visible).toBe(true);

    const analysisTab = page.getByRole('tab', {
      name: 'Competências e Análises',
      exact: true
    });
    await analysisTab.click();
    const waitingButtons = page.locator('.invoice-reanalysis-status-button');
    report.reanalysis.waitingButtonsVisible = await waitingButtons.count();
    if (report.reanalysis.waitingButtonsVisible > 0) {
      const waiting = waitingButtons.first();
      report.reanalysis.tooltip = await waiting.getAttribute('data-tooltip');
      expect(report.reanalysis.tooltip).toContain('reanalisar');
      await waiting.click();
      const reanalysisModal = page.locator('#modal-reanalisar-pendencia');
      await expect(reanalysisModal).toHaveClass(/show/);
      report.reanalysis.modalOpened = true;
      report.reanalysis.hasResult = await reanalysisModal
        .getByLabel('Resultado da reanálise', { exact: true }).isVisible();
      report.reanalysis.hasObservation = await reanalysisModal
        .getByLabel('Observação da análise', { exact: true }).isVisible();
      expect(report.reanalysis.hasResult).toBe(true);
      expect(report.reanalysis.hasObservation).toBe(true);
      await reanalysisModal.locator('.btn-close').click();
      await expect(reanalysisModal).not.toHaveClass(/show/);
    } else {
      report.reanalysis.modalOpened = false;
    }

    expect(observation.mutations, 'A auditoria UX em Production emitiu requisição mutante.').toEqual([]);
    expect(observation.errors, 'O navegador registrou erros durante a auditoria UX.').toEqual([]);

    console.log('RADAR_PRODUCTION_UX_READONLY_AUDIT=' + JSON.stringify(report));
    await context.close();
  });
}

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

test.skip(process.env.RADAR_E2E_SUPABASE_LOCAL !== '1',
  'Exige Supabase descartável, Auth/RLS e Broadcast reais.');
// Uma repetição sem reset do banco não representa o mesmo agregado inicial.
test.describe.configure({ mode: 'serial', retries: 0 });
const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'
));

async function login(page, profileId = 'controller') {
  const user = fixtures.find(item => item.profileId === profileId && item.active);
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(user.email);
  await page.locator('#radar-auth-password').fill(process.env.RADAR_AUTH_FIXTURE_PASSWORD);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(role => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === role, profileId);
}

async function subscribed(page) {
  await page.waitForFunction(() =>
    window.RadarOperationalRealtimeInvalidationController?.getStatus() === 'SUBSCRIBED');
}

async function settleWrites(page) {
  await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
}

function documentRow(page, key) {
  return page.locator(`#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="${key}"]`);
}

async function invoiceInDatabase(page, description) {
  return page.evaluate(async text => {
    const result = await window.RadarSessionContext.service.client.from('registered_invoices')
      .select('id,amount,expense_type').eq('school_id', 'ESC-LOCAL').eq('description', text);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }, description);
}

async function observe(page) {
  const network = [];
  const bodies = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    const match = response.url().match(/\/rpc\/(read_operational_context|read_school_operational_context)(?:\?|$)/);
    if (!match) return;
    const record = { rpc: match[1], status: response.status(), bytes: 0,
      schoolId: response.request().postDataJSON()?.p_school_id || null };
    network.push(record);
    bodies.push(response.body().then(body => { record.bytes = body.length; }));
  });
  await page.evaluate(() => {
    const trace = window.__aggregateSyncTrace = {
      applications: [], mutations: 0, mainReplacements: 0, fadedFrames: 0, frames: 0,
      longTasks: [], renders: { dashboard: 0, escolas: 0 }
    };
    const data = window.RadarApplicationServices.data;
    const apply = data.applyRemoteState.bind(data);
    data.applyRemoteState = async (...args) => {
      const started = performance.now();
      const result = await apply(...args);
      trace.applications.push({ source: args[2], ms: performance.now() - started });
      return result;
    };
    for (const [view, name] of [['dashboard', 'renderDashboard'], ['escolas', 'renderEscolas']]) {
      const original = window[name];
      window[name] = (...args) => { trace.renders[view] += 1; return original(...args); };
    }
    const main = document.querySelector('#main-container');
    new MutationObserver(records => {
      trace.mutations += records.length;
      trace.mainReplacements += records.filter(record => record.target === main
        && record.removedNodes.length > 0 && record.addedNodes.length > 0).length;
    }).observe(main, { childList: true, subtree: true });
    new PerformanceObserver(list => {
      trace.longTasks.push(...list.getEntries().map(entry => entry.duration));
    }).observe({ type: 'longtask', buffered: false });
    const frame = () => {
      trace.frames += 1;
      if (Number(getComputedStyle(main).opacity) < 0.95) trace.fadedFrames += 1;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  return {
    async report() {
      await Promise.all(bodies);
      return { network, errors, ...await page.evaluate(() => window.__aggregateSyncTrace) };
    }
  };
}

async function localSchool(page, schoolId) {
  return page.evaluate(id => ({
    verification: verificacoes[id] || {},
    invoices: notasRegistradas.filter(item => item.escolaId === id),
    pendencies: pendencias.filter(item => item.escolaId === id),
    assets: bens.filter(item => item.escolaId === id),
    contacts: contatos.filter(item => item.escolaId === id)
  }), schoolId);
}

async function waitInvoice(page, invoiceId, amount) {
  await expect.poll(() => page.evaluate(id =>
    notasRegistradas.find(item => item.id === id)?.valor ?? null, invoiceId),
  { timeout: 15000 }).toBe(amount);
}

test('Dashboard e Carteira convergem por escola em criação, edição, exclusão e outra unidade', async ({ browser }, testInfo) => {
  test.setTimeout(120000);
  const contexts = await Promise.all([0, 1, 2].map(() => browser.newContext({
    viewport: { width: 1440, height: 900 }
  })));
  const [dashboard, wallet, writer] = await Promise.all(contexts.map(context => context.newPage()));
  const reports = {};
  try {
    await Promise.all([login(dashboard), login(wallet, 'federal_assistant'), login(writer)]);
    await dashboard.locator('#nav-dashboard').click();
    await dashboard.getByRole('button', { name: 'Todas da CRE', exact: true }).click();
    await wallet.locator('#nav-escolas').click();
    await wallet.locator('#filter-escola-programa').selectOption('BASIC');
    await wallet.locator('#escola-search-input').fill('Escola Local');
    await wallet.getByRole('heading', { name: 'Escolas e Carteiras', exact: true }).click();
    await writer.goto('/escolas/ESC-LOCAL');
    writer.on('dialog', dialog => dialog.accept());
    await expect(documentRow(writer, 'notaFiscal')).toBeVisible();
    await Promise.all([dashboard, wallet, writer].map(subscribed));
    const otherBefore = await Promise.all([dashboard, wallet].map(page => localSchool(page, 'ESC-OTHER')));
    const watchers = await Promise.all([dashboard, wallet].map(observe));
    const dashboardPendencies = dashboard.locator('.card-stat').filter({ hasText: 'Pendências ativas' }).locator('.stat-value');
    const walletRow = wallet.locator('.data-table tbody tr').filter({ hasText: 'Escola Local Autorizada' });
    const beforeCount = Number((await dashboardPendencies.innerText()).match(/\d+/)[0]);
    const description = `AGGREGATE-SYNC-${testInfo.retry}`;

    // Todas as mutações passam pelos controles reais; consultas SQL são somente conferência.
    await documentRow(writer, 'notaFiscal').getByRole('button', {
      name: 'Registrar despesa a identificar', exact: true
    }).click();
    const modal = writer.locator('#modal-dados-nota');
    await modal.locator('#nota-desc').fill(description);
    await modal.locator('#nota-valor').fill('123.45');
    await modal.locator('#nota-unidentified-observation').fill('Débito aguardando documento fiscal.');
    await modal.getByRole('button', { name: 'Registrar Despesa', exact: true }).click();
    await expect(modal).not.toHaveClass(/show/);
    await settleWrites(writer);
    const [invoice] = await invoiceInDatabase(writer, description);
    expect(invoice).toMatchObject({ amount: 123.45, expense_type: 'a_identificar' });
    await Promise.all([dashboard, wallet].map(page => waitInvoice(page, invoice.id, 123.45)));
    await expect(dashboardPendencies).toHaveText(new RegExp(`^${beforeCount + 1} Escolas?$`));
    await expect(walletRow).toContainText('1 ativa(s)');
    expect(await Promise.all([dashboard, wallet].map(page => localSchool(page, 'ESC-OTHER')))).toEqual(otherBefore);

    // Fecha somente a apresentação contextual, usando seu controle acessível.
    const drawer = writer.locator('#pendency-preview-drawer');
    await drawer.getByRole('button', { name: /Fechar/ }).first().click();
    const card = writer.locator(`.invoice-document-row[data-invoice-id="${invoice.id}"]`);
    await card.getByRole('button', { name: /^(?:Editar lançamento:|Editar NF:|Editar Despesa a identificar)/ }).click();
    await modal.locator('#nota-valor').fill('175.50');
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toHaveClass(/show/);
    await settleWrites(writer);
    expect((await invoiceInDatabase(writer, description))[0].amount).toBe(175.5);
    await Promise.all([dashboard, wallet].map(page => waitInvoice(page, invoice.id, 175.5)));
    await card.getByRole('button', { name: /^(?:Excluir NF:|Excluir lançamento:|Excluir Despesa)/ }).click();
    await settleWrites(writer);
    expect(await invoiceInDatabase(writer, description)).toEqual([]);
    await Promise.all([dashboard, wallet].map(page => waitInvoice(page, invoice.id, null)));
    await expect(dashboardPendencies).toHaveText(new RegExp(`^${beforeCount} Escolas?$`));
    await expect(walletRow).toContainText('Sem pendência ativa');
    expect(await Promise.all([dashboard, wallet].map(page => localSchool(page, 'ESC-OTHER')))).toEqual(otherBefore);

    // A unidade alterada não é a antiga activeSchoolId das superfícies agregadas.
    await writer.locator('.prontuario-next-school').click();
    await expect(writer).toHaveURL(/\/escolas\/ESC-OTHER$/);
    for (const value of ['Sim', 'Não']) {
      await documentRow(writer, 'extCC').getByRole('button', { name: value, exact: true }).click();
      await settleWrites(writer);
      for (const page of [dashboard, wallet]) {
        await expect.poll(() => page.evaluate(() =>
          verificacoes['ESC-OTHER']?.['2026-05_BASIC']?.bonificacao?.extCC),
        { timeout: 15000 }).toBe(value);
      }
    }
    await expect(dashboard.locator('.data-table tr').filter({ hasText: 'Escola Local de Outro Controlador' }))
      .toContainText('Em apuração');
    await expect(wallet.locator('#filter-escola-programa')).toHaveValue('BASIC');
    await expect(wallet.locator('#escola-search-input')).toHaveValue('Escola Local');
    await expect(wallet.locator('#carteira-competencia-select')).toHaveValue('2026-05');
    await expect(dashboard.getByRole('button', { name: 'Todas da CRE', exact: true })).toHaveClass(/active/);
    await testInfo.attach('dashboard-after.png', { body: await dashboard.screenshot(), contentType: 'image/png' });
    await testInfo.attach('wallet-after.png', { body: await wallet.screenshot(), contentType: 'image/png' });
    reports.dashboard = await watchers[0].report();
    reports.wallet = await watchers[1].report();
    reports.gestures = 5;
    reports.competence = '2026-05';
    await testInfo.attach('aggregate-school-sync.json', { body: JSON.stringify(reports, null, 2), contentType: 'application/json' });

    // RED de produto: main ainda faz cinco leituras globais para cada observador.
    for (const report of [reports.dashboard, reports.wallet]) {
      expect(report.errors).toEqual([]);
      expect(report.network.filter(item => item.rpc === 'read_operational_context')).toHaveLength(0);
      expect(report.network.filter(item => item.rpc === 'read_school_operational_context')).toHaveLength(5);
    }

    // Navegar/recarregar recupera a mesma verdade; bootstrap continua legitimamente global.
    await walletRow.getByRole('button', { name: 'Ver Unidade', exact: true }).click();
    await expect(wallet).toHaveURL(/\/escolas\/ESC-LOCAL$/);
    await wallet.reload();
    await expect(documentRow(wallet, 'notaFiscal')).toBeVisible();
    await waitInvoice(wallet, invoice.id, null);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});

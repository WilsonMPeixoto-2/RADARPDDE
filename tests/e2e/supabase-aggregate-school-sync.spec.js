'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

test.skip(process.env.RADAR_E2E_SUPABASE_LOCAL !== '1',
  'Exige Supabase descartável, Auth/RLS e Broadcast reais.');
// Uma repetição sem reset do banco não representa o mesmo agregado inicial.
test.describe.configure({ mode: 'serial', retries: 0 });
test.use({ actionTimeout: 15000 });
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

async function prepareUnrelatedSchool(page) {
  // Estado prévio sintético, autorizado pela identidade real, antes de abrir os
  // observadores. Não simula nenhuma resposta nem substitui as mutações da UI.
  await page.evaluate(async () => {
    const invoices = Array.from({ length: 25 }, (_, index) => ({
      id: `AGG-UNRELATED-${index}`,
      school_id: 'ESC-OTHER', competence_id: '2026-05', program_id: 'BASIC',
      invoice_number: `PREEXISTENTE-${index}`, expense_type: 'consumo', amount: 50,
      description: `Material previamente registrado ${index}`,
      payload: { aggregate_sync_fixture: true }
    }));
    const result = await window.RadarSessionContext.service.client.from('registered_invoices').upsert(invoices);
    if (result.error) throw new Error(result.error.message);
  });
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
  const attempts = [];
  const startedRequests = new Map();
  const bodies = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const match = request.url().match(/\/rpc\/(read_operational_context|read_school_operational_context)(?:\?|$)/);
    if (!match || request.method() !== 'POST') return;
    const record = { rpc: match[1], schoolId: request.postDataJSON()?.p_school_id || null };
    attempts.push(record);
    startedRequests.set(request, record);
  });
  page.on('requestfailed', request => {
    const record = startedRequests.get(request);
    if (record) record.error = request.failure()?.errorText || 'requestfailed';
  });
  page.on('response', response => {
    const match = response.url().match(/\/rpc\/(read_operational_context|read_school_operational_context)(?:\?|$)/);
    if (!match) return;
    const record = { rpc: match[1], status: response.status(), bytes: 0,
      schoolId: response.request().postDataJSON()?.p_school_id || null };
    network.push(record);
    bodies.push(response.body().then(body => { record.bytes = body.length; })
      .catch(error => { record.bodyError = error.message; }));
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
      return { network: network.map(item => ({ ...item })), attempts: attempts.map(item => ({ ...item })), errors: [...errors],
        ...await page.evaluate(() => ({ ...window.__aggregateSyncTrace,
          realtime: window.RadarOperationalRealtimeInvalidationController.getMetrics()
        })) };
    }
  };
}

async function localSchool(page, schoolId) {
  return page.evaluate(async id => {
    // Compara o contrato canônico completo, inclusive filhos. A projeção legada
    // admite datas PostgreSQL (+00:00/µs) e ISO JavaScript (Z/ms) equivalentes;
    // diferenças de representação não são perda de uma outra escola.
    const entities = ['verifications', 'registeredInvoices', 'pendencies',
      'pendencyAttempts', 'pendencyContacts', 'assets'];
    const snapshot = await window.RadarApplicationServices.data.statePort.exportCanonicalEntities(entities);
    const parentIds = new Set(snapshot.entities.pendencies.filter(item => item.school_id === id).map(item => item.id));
    return Object.fromEntries(entities.map(entity => [entity,
      snapshot.entities[entity].filter(item => item.school_id === id
        || (entity === 'pendencyAttempts' && parentIds.has(item.pendency_id)))
        .sort((left, right) => left.id.localeCompare(right.id))
    ]));
  }, schoolId);
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
  let watchers = [];
  try {
    await login(writer);
    await prepareUnrelatedSchool(writer);
    await Promise.all([login(dashboard), login(wallet, 'federal_assistant')]);
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
    expect(otherBefore.map(state => state.registeredInvoices.length)).toEqual([25, 25]);
    watchers = await Promise.all([dashboard, wallet].map(observe));
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

    // Histórico fiscal não pode ser apagado. Cancelar a ocorrência indevida
    // reduz o agregado pelo fluxo autorizado; o teste não burla essa regra.
    const pendencyId = await writer.evaluate(id =>
      pendencias.find(item => item.registeredInvoiceId === id)?.id, invoice.id);
    await writer.locator('#nav-pendencias').click();
    await writer.getByRole('tab', { name: /^Abertas/ }).click();
    await writer.locator(`#p-abertas [data-pendency-id="${pendencyId}"]`).filter({ visible: true })
      .first().getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await writer.locator('#pendency-detail-drawer').getByRole('button', {
      name: 'Cancelar pendência', exact: true
    }).click();
    const cancel = writer.getByRole('dialog', { name: 'Cancelar pendência', exact: true });
    await cancel.locator('#pendency-cancel-justification').fill('Lançamento indevido na homologação descartável.');
    await cancel.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
    await expect(cancel).toBeHidden();
    await settleWrites(writer);
    await expect(dashboardPendencies).toHaveText(new RegExp(`^${beforeCount} Escolas?$`));
    await expect(walletRow).toContainText('Sem pendência ativa');

    // Criação/edição/exclusão de uma NF sem histórico: exclusão precisa substituir
    // a fatia, preservando a despesa e a Pendência cancelada que continuam canônicas.
    await writer.locator('#nav-escolas').click();
    await writer.locator('.data-table tbody tr').filter({ hasText: 'Escola Local Autorizada' })
      .getByRole('link', { name: 'Ver Unidade', exact: true }).click();
    await documentRow(writer, 'notaFiscal').getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
    await modal.locator('#nota-tipo').selectOption('consumo');
    await modal.locator('#nota-numero').fill('AGGREGATE-NF');
    await modal.locator('#nota-desc').fill('AGGREGATE-CONSUMO');
    await modal.locator('#nota-valor').fill('250');
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toHaveClass(/show/);
    await settleWrites(writer);
    const [consumption] = await invoiceInDatabase(writer, 'AGGREGATE-CONSUMO');
    await Promise.all([dashboard, wallet].map(page => waitInvoice(page, consumption.id, 250)));
    const consumptionCard = writer.locator(`.invoice-document-row[data-invoice-id="${consumption.id}"]`);
    await consumptionCard.getByRole('button', { name: /^Editar (?:lançamento:|NF:)/ }).click();
    await modal.locator('#nota-valor').fill('315.50');
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toHaveClass(/show/);
    await settleWrites(writer);
    expect((await invoiceInDatabase(writer, 'AGGREGATE-CONSUMO'))[0].amount).toBe(315.5);
    await Promise.all([dashboard, wallet].map(page => waitInvoice(page, consumption.id, 315.5)));
    await consumptionCard.getByRole('button', { name: /^Excluir NF:/ }).click();
    await settleWrites(writer);
    expect(await invoiceInDatabase(writer, 'AGGREGATE-CONSUMO')).toEqual([]);
    await Promise.all([dashboard, wallet].map(page => waitInvoice(page, consumption.id, null)));
    await Promise.all([dashboard, wallet].map(page => waitInvoice(page, invoice.id, 175.5)));
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
    for (const [name, page] of [['dashboard', dashboard], ['wallet', wallet]]) {
      const screenshotPath = testInfo.outputPath(`${name}-after.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await testInfo.attach(`${name}-after.png`, { path: screenshotPath, contentType: 'image/png' });
    }
    reports.dashboard = await watchers[0].report();
    reports.wallet = await watchers[1].report();
    reports.gestures = 8;
    reports.competence = '2026-05';
    const reportPath = testInfo.outputPath('aggregate-school-sync.json');
    fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
    await testInfo.attach('aggregate-school-sync.json', { path: reportPath, contentType: 'application/json' });

    // RED de produto: main relê todas as escolas para cada uma destas oito ações.
    for (const report of [reports.dashboard, reports.wallet]) {
      expect(report.errors).toEqual([]);
      expect(report.attempts.filter(item => item.rpc === 'read_operational_context')).toHaveLength(0);
      expect(report.attempts.filter(item => item.rpc === 'read_school_operational_context')).toHaveLength(8);
      expect(report.attempts.filter(item => item.error)).toEqual([]);
      expect(report.network.filter(item => item.rpc === 'read_operational_context')).toHaveLength(0);
      expect(report.network.filter(item => item.rpc === 'read_school_operational_context')).toHaveLength(8);
    }

    // O conteúdo rola dentro da aplicação; fullPage sozinho não expõe as linhas
    // inferiores. Capturar a ação da outra escola também permite inspeção humana.
    for (const [name, page] of [['dashboard', dashboard], ['wallet', wallet]]) {
      const otherRow = page.getByRole('row').filter({ hasText: 'Escola Local de Outro Controlador' });
      await otherRow.getByRole('link', { name: 'Ver Unidade', exact: true }).scrollIntoViewIfNeeded();
      const screenshotPath = testInfo.outputPath(`${name}-school-row.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`${name}-school-row.png`, { path: screenshotPath, contentType: 'image/png' });
    }

    // Navegar/recarregar recupera a mesma verdade; bootstrap continua legitimamente global.
    await walletRow.getByRole('link', { name: 'Ver Unidade', exact: true }).click();
    await expect(wallet).toHaveURL(/\/escolas\/ESC-LOCAL$/);
    await wallet.reload();
    await expect(documentRow(wallet, 'notaFiscal')).toBeVisible();
    await waitInvoice(wallet, consumption.id, null);
    await waitInvoice(wallet, invoice.id, 175.5);
  } finally {
    if (watchers.length && !reports.dashboard) {
      const partial = await Promise.allSettled(watchers.map(watcher => watcher.report()));
      await testInfo.attach('aggregate-partial.json', {
        body: JSON.stringify(partial, null, 2), contentType: 'application/json'
      }).catch(() => {});
    }
    await Promise.all(contexts.map(context => context.close().catch(() => {})));
  }
});

test('escola dirty converge na Carteira e invalidação em voo preserva escopo e recuperação', async ({ browser }, testInfo) => {
  test.setTimeout(90000);
  const contexts = await Promise.all([0, 1].map(() => browser.newContext({ viewport: { width: 1440, height: 900 } })));
  const [observer, writer] = await Promise.all(contexts.map(context => context.newPage()));
  let releaseRead = () => {};
  try {
    await Promise.all([login(observer), login(writer)]);
    await observer.goto('/escolas/ESC-LOCAL');
    await writer.goto('/escolas/ESC-OTHER');
    await Promise.all([observer, writer].map(subscribed));
    const watcher = await observe(observer);
    const otherValue = await writer.evaluate(() => verificacoes['ESC-OTHER']?.['2026-05_BASIC']?.bonificacao?.extCC || '');
    const changed = otherValue === 'Sim' ? 'Não' : 'Sim';
    await documentRow(writer, 'extCC').getByRole('button', { name: changed, exact: true }).click();
    await settleWrites(writer);
    await observer.waitForFunction(() =>
      window.RadarOperationalRealtimeInvalidationController.getMetrics().dirtySchoolIds.includes('ESC-OTHER'));
    await observer.locator('#nav-escolas').click();
    await expect.poll(() => observer.evaluate(() =>
      verificacoes['ESC-OTHER']?.['2026-05_BASIC']?.bonificacao?.extCC)).toBe(changed);
    const afterNavigation = await watcher.report();
    expect(afterNavigation.network.filter(item => item.rpc === 'read_operational_context')).toHaveLength(0);
    expect(afterNavigation.network.filter(item => item.rpc === 'read_school_operational_context')).toHaveLength(1);
    expect(afterNavigation.realtime.dirtySchoolIds).toEqual([]);

    // Duas alterações canônicas enquanto a primeira leitura ainda não terminou.
    let startedRead;
    const readStarted = new Promise(resolve => { startedRead = resolve; });
    const heldRead = new Promise(resolve => { releaseRead = resolve; });
    let intercepted = false;
    await observer.route('**/rest/v1/rpc/read_school_operational_context', async route => {
      if (!intercepted) {
        intercepted = true;
        // SQL lê o estado intermediário antes da segunda escrita. Retemos só a
        // entrega ao navegador, garantindo que a resposta anterior não baste.
        const response = await route.fetch();
        startedRead();
        await heldRead;
        await route.fulfill({ response });
        return;
      }
      await route.continue();
    });
    const intermediate = changed === 'Sim' ? 'Não' : 'Sim';
    await documentRow(writer, 'extCC').getByRole('button', { name: intermediate, exact: true }).click();
    await settleWrites(writer);
    await readStarted;
    await documentRow(writer, 'extCC').getByRole('button', { name: changed, exact: true }).click();
    await settleWrites(writer);
    await observer.waitForFunction(() =>
      window.RadarOperationalContextRefreshController.hasPendingRefresh());
    releaseRead();
    await expect.poll(() => observer.evaluate(() =>
      verificacoes['ESC-OTHER']?.['2026-05_BASIC']?.bonificacao?.extCC)).toBe(changed);
    await observer.waitForFunction(() =>
      !window.RadarOperationalContextRefreshController.hasPendingRefresh());
    // Pending=false também acontece ao iniciar a leitura seguinte. Esperar sua
    // resposta evita medir a fila ainda em voo como se a jornada tivesse acabado.
    await expect.poll(async () => (await watcher.report()).network.filter(item =>
      item.rpc === 'read_school_operational_context').length, { timeout: 15000 }).toBe(3);
    const persisted = await writer.evaluate(async () => {
      const result = await window.RadarSessionContext.service.client.from('verifications')
        .select('bonification,row_version').eq('school_id', 'ESC-OTHER').eq('competence_id', '2026-05')
        .eq('program_id', 'BASIC').single();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    });
    expect(persisted.bonification.extCC).toBe(changed);
    await expect.poll(() => observer.evaluate(() =>
      verificacoes['ESC-OTHER']?.['2026-05_BASIC']?.rowVersion)).toBe(persisted.row_version);
    const afterInflight = await watcher.report();
    expect(afterInflight.network.filter(item => item.rpc === 'read_operational_context')).toHaveLength(0);
    expect(afterInflight.network.filter(item => item.rpc === 'read_school_operational_context')).toHaveLength(3);
    await observer.unroute('**/rest/v1/rpc/read_school_operational_context');

    // Uma perda real de conexão continua exigindo leitura global conservadora.
    await observer.evaluate(() => window.RadarSessionContext.service.client.realtime.disconnect());
    await observer.waitForFunction(() =>
      window.RadarOperationalRealtimeInvalidationController.getStatus() !== 'SUBSCRIBED');
    await observer.evaluate(() => window.RadarSessionContext.service.client.realtime.connect());
    await subscribed(observer);
    await expect.poll(async () => (await watcher.report()).network.filter(item =>
      item.rpc === 'read_operational_context').length, { timeout: 15000 }).toBe(1);
    await observer.waitForFunction(() => !window.RadarOperationalContextRefreshController.hasPendingRefresh());
    await expect(observer.locator('#carteira-competencia-select')).toHaveValue('2026-05');
    const final = await watcher.report();
    expect(final.errors).toEqual([]);
    const reportPath = testInfo.outputPath('aggregate-navigation-inflight-reconnect.json');
    fs.writeFileSync(reportPath, JSON.stringify({ afterNavigation, afterInflight, final }, null, 2));
    await testInfo.attach('aggregate-navigation-inflight-reconnect.json', { path: reportPath, contentType: 'application/json' });
  } finally {
    releaseRead();
    await Promise.all(contexts.map(context => context.close().catch(() => {})));
  }
});

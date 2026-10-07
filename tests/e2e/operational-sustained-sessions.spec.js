'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { createOperationalReadTracker } = require('../support/operational-read-tracker.js');
const { observeOperationalSession } = require('../support/operational-session-observer.js');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1'
  && process.env.RADAR_E2E_SUSTAINED_OPERATIONAL === '1';
test.skip(!enabled, 'Exige pilha local, volume operacional e identidades reais de teste.');
const rounds = Number(process.env.RADAR_OPERATIONAL_ROUNDS || 40);
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && (password.length < 24 || !Number.isInteger(rounds) || rounds < 4 || rounds > 1000)) {
  throw new Error('Configuração da jornada sustentada inválida.');
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const row = (page, key = 'extCC') => page.locator(
  `#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="${key}"]`
);
async function ready(page) {
  await page.waitForFunction(() => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.invoices));
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady?.then) await window.RadarProductExtensionsReady;
  });
  await expect(page.locator('#app-layout')).toBeVisible();
}
async function signIn(page, email, school) {
  await page.goto('/');
  const runtime = await page.evaluate(() => window.RADAR_PDDE_RUNTIME_INPUT);
  expect(runtime.environment).toBe('test');
  expect(runtime.dataMode).toBe('supabase-preview');
  expect(['127.0.0.1', 'localhost', '[::1]']).toContain(new URL(runtime.supabase.url).hostname);
  await page.locator('#radar-auth-email').fill(email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await ready(page);
  await page.goto(`/escolas/${school}`);
  await ready(page);
  await page.locator('#global-competence-select').selectOption('2026-08');
  await expect(row(page)).toBeVisible();
  await page.waitForFunction(() => document.getElementById('main-container')?.inert !== true
    && window.RadarOperationalRealtimeInvalidationController?.getStatus?.() === 'SUBSCRIBED');
  await expect(page.locator('#tab-verificacoes')).toHaveCSS('opacity', '1');
  page.on('dialog', dialog => dialog.accept());
}
async function settle(page) {
  await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
}
async function setDelivery(page, value) {
  await row(page).getByRole('button', { name: value, exact: true }).click();
  await settle(page);
  await expect(row(page).getByRole('button', { name: value, exact: true }))
    .toHaveClass(value === 'Sim' ? /active-sim/ : /active-nao/);
}
async function remoteInvoice(page, number) {
  return page.evaluate(async invoiceNumber => {
    const result = await window.RadarSessionContext.service.client.from('registered_invoices')
      .select('id,invoice_number,amount,expense_type,linked_asset_id').eq('school_id', 'OPS-SESSION-2')
      .eq('invoice_number', invoiceNumber).limit(2);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }, number);
}
async function invoiceCycle(page, index) {
  const number = `OPS-NF-${index}`;
  await row(page, 'notaFiscal').getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
  const modal = page.locator('#modal-dados-nota');
  await expect(modal).toHaveClass(/show/);
  await modal.locator('#nota-tipo').selectOption('consumo');
  await modal.locator('#nota-numero').fill(number);
  await modal.locator('#nota-desc').fill(`Material operacional ${index}`);
  await modal.locator('#nota-valor').fill('250');
  await modal.locator('button[type="submit"]').click();
  await expect(modal).not.toHaveClass(/show/);
  await settle(page);
  const [invoice] = await remoteInvoice(page, number);
  expect(invoice).toMatchObject({ amount: 250, expense_type: 'consumo' });
  const card = page.locator(`.invoice-document-row[data-invoice-id="${invoice.id}"]`);
  await card.getByRole('button', { name: /^Editar (?:lançamento:|NF:)/ }).click();
  await modal.locator('#nota-valor').fill('315.50');
  await modal.locator('button[type="submit"]').click();
  await expect(modal).not.toHaveClass(/show/);
  await settle(page);
  expect((await remoteInvoice(page, number))[0].amount).toBe(315.5);
  await card.getByRole('button', { name: /^Excluir NF:/ }).click();
  await settle(page);
  await expect(card).toHaveCount(0);
  expect(await remoteInvoice(page, number)).toEqual([]);
  return 3;
}

test('seis sessões reais medem escrita, observação, edição e falha durante atividade sustentada', async ({ browser }, testInfo) => {
  test.setTimeout(900000);
  const contexts = await Promise.all(Array.from({ length: 6 }, () => browser.newContext({
    viewport: { width: 1440, height: 900 }, recordVideo: { dir: testInfo.outputPath('session-videos') }
  })));
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  const observations = [];
  const gestures = [0, 0, 0, 0, 0, 0];
  const faults = { readLatencyMs: 0, failObserverRead: false, failuresInjected: 0 };
  const observerReads = createOperationalReadTracker();
  const reconnectProof = {};
  faults.reconnectProof = reconnectProof;
  let captureNextResponse = null;
  let releaseOldResponse;
  let releaseRecoveryResponse;
  const oldResponseReleased = new Promise(resolve => { releaseOldResponse = resolve; });
  const recoveryResponseReleased = new Promise(resolve => { releaseRecoveryResponse = resolve; });
  let stage = 'login';
  let outcome = 'incomplete';
  let report;
  let failure;
  try {
    await Promise.all(pages.map((page, i) => signIn(page,
      `operational-${i >= 4 ? 1 : i + 1}@radar.local`, `OPS-SESSION-${i < 3 ? i + 1 : 1}`)));
    await pages[5].locator('#nav-dashboard').click();
    await expect(pages[5].locator('#nav-dashboard')).toHaveClass(/active/);
    for (const page of pages) observations.push(await observeOperationalSession(page));
    await pages[3].screenshot({ path: testInfo.outputPath('observer-start.png'), fullPage: true });
    // O fault injector altera apenas a fronteira de transporte. O produto,
    // Auth, RLS, RPC, retorno autoritativo e Broadcast permanecem reais.
    for (let i = 0; i < pages.length; i += 1) {
      if (i === 3) {
        pages[i].on('requestfinished', request => observerReads.finish(request));
        pages[i].on('requestfailed', request => observerReads.finish(request));
      }
      await pages[i].route(/\/rest\/v1\/rpc\/read_(?:school_)?operational_context$/, async route => {
        const request = route.request();
        if (i === 3) observerReads.start(request);
        if (i === 3 && faults.failObserverRead) {
          faults.failObserverRead = false;
          faults.failuresInjected += 1;
          await route.fulfill({ status: 500, contentType: 'application/json',
            body: JSON.stringify({ code: '57014', message: 'statement timeout induzido pelo teste' }) });
          return;
        }
        const delay = faults.readLatencyMs;
        if (delay) await pause(delay);
        if (i === 3 && captureNextResponse) {
          const kind = captureNextResponse;
          captureNextResponse = null;
          const startedAt = Date.now();
          // SQL/Auth/RLS reais; atrasamos só a entrega de um snapshot já obtido.
          const response = await route.fetch();
          try {
            expect(response.status()).toBe(200);
            const body = await response.body();
            const verification = JSON.parse(body.toString()).entities.verifications.find(item =>
              item.school_id === 'OPS-SESSION-1' && item.competence_id === '2026-08'
              && item.program_id === 'BASIC');
            expect(verification).toBeDefined();
            observerReads.hold(request);
            reconnectProof[kind] = { startedAt, capturedAt: Date.now(),
              rpc: new URL(request.url()).pathname,
              value: verification.bonification.extCC, rowVersion: verification.row_version };
            await (kind === 'old' ? oldResponseReleased : recoveryResponseReleased);
            observerReads.release(request);
            reconnectProof[kind].releasedAt = Date.now();
            await route.fulfill({ response, body });
          } finally {
            await response.dispose();
          }
          return;
        }
        await route.continue().catch(() => observerReads.finish(request));
      });
    }
    stage = 'editing-and-fault';
    // Evento isolado antes da rajada: o debounce trailing do baseline só executa
    // após quietude. Exigir refresh durante a rajada confundia essa política
    // existente com perda de Broadcast e impedia medir sua convergência final.
    const focused = pages[4].locator('#global-competence-select');
    await focused.focus();
    faults.readLatencyMs = 300;
    await setDelivery(pages[0], 'Sim');
    gestures[0] += 1;
    await expect.poll(() => pages[4].evaluate(() =>
      window.RadarOperationalContextRefreshController.hasPendingRefresh()), { timeout: 20000 }).toBe(true);
    await expect(focused).toBeFocused();
    await focused.blur();
    faults.readLatencyMs = 1000;
    faults.failObserverRead = true;
    await setDelivery(pages[0], 'Não');
    gestures[0] += 1;
    await expect.poll(() => faults.failuresInjected, { timeout: 20000 }).toBe(1);
    await expect(row(pages[3]).getByRole('button', { name: 'Não', exact: true }))
      .toHaveClass(/active-nao/, { timeout: 60000 });
    faults.readLatencyMs = 2000;
    await pages[3].bringToFront();
    await pages[0].bringToFront();
    await setDelivery(pages[0], 'Sim');
    gestures[0] += 1;
    stage = 'sustained-activity';
    const writer = async (page, index) => {
      for (let n = 0; n < rounds; n += 1) {
        await setDelivery(page, n % 2 === 0 ? 'Não' : 'Sim');
        gestures[index] += 1;
        // Pacing representa gestos humanos; a conclusão é aguardada por estado,
        // não por sleep usado para adivinhar a conclusão de uma gravação.
        await pause(300);
      }
      if (rounds % 2 === 0) {
        await setDelivery(page, 'Não');
        gestures[index] += 1;
      }
    };
    const invoiceWriter = async () => {
      for (let n = 0; n < Math.max(2, Math.floor(rounds / 4)); n += 1) {
        gestures[1] += await invoiceCycle(pages[1], n);
        await pause(300);
      }
    };
    const results = await Promise.allSettled([writer(pages[0], 0), invoiceWriter(), writer(pages[2], 2)]);
    const failed = results.find(result => result.status === 'rejected');
    if (failed) throw failed.reason;
    faults.readLatencyMs = 0;
    stage = 'convergence';
    const finalValue = 'Não';
    for (const i of [3, 4]) {
      await expect(row(pages[i]).getByRole('button', { name: finalValue, exact: true }))
        .toHaveClass(finalValue === 'Sim' ? /active-sim/ : /active-nao/, { timeout: 60000 });
    }
    await expect.poll(() => pages[5].evaluate(() => verificacoes?.['OPS-SESSION-1']?.['2026-08_BASIC']?.bonificacao?.extCC), { timeout: 60000 }).toBe(finalValue);
    stage = 'realtime-reconnect';
    // Guardar uma resposta antiga real impede que ela obtenha a escrita offline.
    // Reter a request antes de SQL e liberá-la no reconnect falseava esta prova.
    await pages[3].evaluate(async () => {
      await window.RadarSessionContext.service.client.realtime.disconnect();
    });
    await pages[3].waitForFunction(() =>
      !window.RadarSessionContext.service.client.realtime.isConnected());
    await expect.poll(() => observerReads.size, { timeout: 60000 }).toBe(0);
    captureNextResponse = 'old';
    await pages[3].evaluate(() => {
      void window.RadarOperationalContextRefreshController.refresh('sustained-reconnect-probe', { force: true });
    });
    await expect.poll(() => reconnectProof.old?.value, { timeout: 60000 }).toBe('Não');
    await expect.poll(() => observerReads.unheldCount).toBe(0);
    expect(observerReads.heldCount).toBe(1);
    await setDelivery(pages[0], 'Sim');
    gestures[0] += 1;
    await expect(row(pages[3]).getByRole('button', { name: 'Não', exact: true }))
      .toHaveClass(/active-nao/);
    const metricsBefore = await pages[3].evaluate(() =>
      window.RadarOperationalRealtimeInvalidationController.getMetrics());
    captureNextResponse = 'recovery';
    reconnectProof.connectedAt = Date.now();
    await pages[3].evaluate(() => window.RadarSessionContext.service.client.realtime.connect());
    await pages[3].waitForFunction(() =>
      window.RadarOperationalRealtimeInvalidationController.getStatus() === 'SUBSCRIBED');
    await expect.poll(() => pages[3].evaluate(() =>
      window.RadarOperationalRealtimeInvalidationController.getMetrics().reconnectRefreshes))
      .toBeGreaterThan(metricsBefore.reconnectRefreshes);
    // SUBSCRIBED/contador provam agendamento, não execução. Aguardar o scheduler
    // realmente pedir recovery antes de destravar o single-flight compartilhado.
    await expect.poll(() => pages[3].evaluate(() =>
      window.RadarOperationalRealtimeInvalidationController.getMetrics().refreshAttempts), { timeout: 20000 })
      .toBeGreaterThan(metricsBefore.refreshAttempts);
    expect(await pages[3].evaluate(() =>
      window.RadarOperationalContextRefreshController.hasPendingRefresh())).toBe(true);
    expect(observerReads.heldCount).toBe(1);
    expect(reconnectProof.old.releasedAt).toBeUndefined();
    reconnectProof.oldHeldThroughReconnect = true;
    releaseOldResponse();
    await expect.poll(() => reconnectProof.recovery?.value, { timeout: 60000 }).toBe('Sim');
    expect(reconnectProof.recovery.rpc).toBe('/rest/v1/rpc/read_operational_context');
    expect(reconnectProof.recovery.startedAt).toBeGreaterThanOrEqual(reconnectProof.connectedAt);
    expect(reconnectProof.recovery.rowVersion).toBeGreaterThan(reconnectProof.old.rowVersion);
    expect(reconnectProof.recovery.releasedAt).toBeUndefined();
    await expect(row(pages[3]).getByRole('button', { name: 'Não', exact: true }))
      .toHaveClass(/active-nao/);
    reconnectProof.uiOldBeforeRecovery = true;
    releaseRecoveryResponse();
    await expect(row(pages[3]).getByRole('button', { name: 'Sim', exact: true }))
      .toHaveClass(/active-sim/, { timeout: 60000 });
    const recovered = (await observations[3].snapshot()).runtime.loads.filter(load =>
      load.method === 'loadOperationalContext' && load.source.includes('realtime-reconnect')
      && load.ok && !load.stale && !load.aborted);
    expect(recovered.length).toBeGreaterThan(0);
    reconnectProof.recoverySource = recovered.at(-1).source;
    reconnectProof.uiConvergedAfterRecovery = true;
    faults.realtimeDisconnects = 1;
    faults.realtimeRecovered = true;
    await setDelivery(pages[0], finalValue);
    gestures[0] += 1;
    for (const i of [3, 4]) await expect(row(pages[i]).getByRole('button', { name: finalValue, exact: true }))
      .toHaveClass(/active-nao/, { timeout: 60000 });
    const [db] = await pages[0].evaluate(async () => {
      const result = await window.RadarSessionContext.service.client.from('verifications')
        .select('bonification,row_version').eq('school_id', 'OPS-SESSION-1')
        .eq('competence_id', '2026-08').eq('program_id', 'BASIC');
      if (result.error) throw new Error(result.error.message);
      return result.data;
    });
    expect(db.bonification.extCC).toBe(finalValue);
    const samples = await Promise.all(observations.map(observer => observer.snapshot()));
    report = { samples, finalValue, gestures, faults: { ...faults } };
    await pages[3].screenshot({ path: testInfo.outputPath('observer-before-reload.png'), fullPage: true });
    stage = 'reload';
    await pages[3].reload();
    await ready(pages[3]);
    // Bootstrap remoto escolhe a competência do calendário. Conferir o mesmo
    // fato exige voltar explicitamente a Agosto pelos controles visíveis.
    report.reloadInitialCompetence = await pages[3].locator('#global-competence-select').inputValue();
    await pages[3].locator('#global-competence-select').selectOption('2026-08');
    await expect(row(pages[3]).getByRole('button', { name: finalValue, exact: true }))
      .toHaveClass(finalValue === 'Sim' ? /active-sim/ : /active-nao/);
    await pages[3].screenshot({ path: testInfo.outputPath('observer-after-reload.png'), fullPage: true });
    expect(samples.flatMap(sample => sample.errors)).toEqual([]);
    // Dois escritores de avaliação: exatamente um save por gesto, mesmo durante
    // latência e Broadcast concorrente. O observador não emite writes.
    for (const i of [0, 2]) expect(samples[i].requests.filter(request =>
      request.path === '/rest/v1/rpc/save_verification_with_log')).toHaveLength(gestures[i]);
    for (const i of [3, 4, 5]) expect(samples[i].writes).toBe(0);
    if (process.env.RADAR_OPERATIONAL_VARIANT === 'candidate') {
      for (const i of [3, 4]) {
        expect(samples[i].runtime.visual.fadedFrames,
          'atualização remota não deve reapresentar o painel com opacity reduzida').toBe(0);
      }
    }
    outcome = 'passed';
  } catch (error) {
    outcome = 'failed';
    failure = { name: error.name, message: error.message };
    throw error;
  } finally {
    releaseOldResponse();
    releaseRecoveryResponse();
    if (!report) report = { samples: await Promise.all(observations.map(observer => observer.snapshot().catch(() => null))), gestures, faults };
    const serialized = JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(),
      variant: process.env.RADAR_OPERATIONAL_VARIANT || 'candidate', stage, outcome, failure,
      rounds, ...report, limits: ['Massa sintética calibrada; não clone de Production.',
        'Seis sessões/quatro Controladores: três escritores, dois observadores escolares e um Dashboard; inclui abas da mesma identidade.',
        'Esta jornada mede avaliações e CRUD fiscal; não certifica patrimônio, Pendências, horas de uso ou staging.',
        'Latência e HTTP 500 são induzidos no transporte; dados e Realtime são reais.',
        'Um socket real é desconectado; snapshot SQL anterior é retido até recovery ser solicitado. UI só converge após a nova resposta global de recovery. A sonda antiga acrescenta uma leitura nas duas variantes.'] }, null, 2);
    expect(serialized).not.toContain(password);
    const target = path.resolve('test-results/operational-sustained', process.env.RADAR_OPERATIONAL_VARIANT || 'candidate');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'session-report.json'), serialized + '\n');
    await testInfo.attach('operational-sustained-session-report', { body: Buffer.from(serialized), contentType: 'application/json' });
    await Promise.all(contexts.map(context => context.close()));
  }
});

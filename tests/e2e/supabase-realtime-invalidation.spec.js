'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável, Auth e Realtime reais.');
// As duas jornadas usam a mesma avaliação persistida da fixture.
test.describe.configure({ mode: 'serial' });

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

function institutionalFixture(profileId) {
  const fixture = fixtures.find(item => item.profileId === profileId && item.active);
  if (!fixture) throw new Error(`Fixture institucional ativa ausente: ${profileId}.`);
  return fixture;
}

async function signInInstitutional(page, profileId = 'controller') {
  const fixture = institutionalFixture(profileId);
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(role => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === role
    && Boolean(window.RadarApplicationServices?.verifications)
  ), profileId);
}

async function openSchool(page) {
  await page.goto('/escolas/ESC-LOCAL');
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && window.RadarCompetenceContext?.getState?.()?.activeKey === '2026-05'
  ));
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');
}

async function waitRealtimeSubscribed(page) {
  await page.waitForFunction(() => (
    window.RadarOperationalRealtimeInvalidationController?.getStatus?.() === 'SUBSCRIBED'
  ), null, { timeout: 15000 });
}

async function currentExtCC(page) {
  return page.evaluate(() => (
    verificacoes?.['ESC-LOCAL']?.['2026-05_BASIC']?.bonificacao?.extCC || ''
  ));
}

function extCCRow(page) {
  return page.locator(
    '#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]'
  );
}

async function expectVisibleExtCC(page, value) {
  const row = extCCRow(page);
  await expect(row).toBeVisible();
  const sim = row.getByRole('button', { name: 'Sim', exact: true });
  const nao = row.getByRole('button', { name: 'Não', exact: true });
  if (value === 'Sim') {
    await expect(sim).toHaveClass(/active-sim/);
    return;
  }
  if (value === 'Não') {
    await expect(nao).toHaveClass(/active-nao/);
    return;
  }
  await expect(sim).not.toHaveClass(/active-sim/);
  await expect(nao).not.toHaveClass(/active-nao/);
}

async function setExtCC(page, value) {
  await page.evaluate(async nextValue => {
    await window.RadarApplicationServices.verifications.setBonification({
      schoolId: 'ESC-LOCAL',
      compKey: '2026-05_BASIC',
      documentKey: 'extCC',
      value: nextValue,
      profile: 'controlador'
    });
    await window.RadarApplicationServices.data.remoteExecutionTail;
  }, value);
}

test('Broadcast atualiza outra sessão sem F5 e respeita edição em andamento', async ({ browser }) => {
  test.setTimeout(60000);

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await Promise.all([signInInstitutional(pageA), signInInstitutional(pageB)]);
    await Promise.all([openSchool(pageA), openSchool(pageB)]);
    await Promise.all([waitRealtimeSubscribed(pageA), waitRealtimeSubscribed(pageB)]);

    const original = await currentExtCC(pageB);
    const changed = original === 'Sim' ? 'Não' : 'Sim';
    await expectVisibleExtCC(pageB, original);

    await setExtCC(pageA, changed);

    await expect.poll(
      () => currentExtCC(pageB),
      {
        timeout: 10000,
        message: 'Sessão B não recebeu a alteração operacional sem recarregar a página.'
      }
    ).toBe(changed);
    await expectVisibleExtCC(pageB, changed);

    const selector = pageB.locator('#global-competence-select');
    await selector.focus();
    await expect(selector).toBeFocused();

    await setExtCC(pageA, original);

    await expect.poll(
      () => pageB.evaluate(() => (
        window.RadarOperationalContextRefreshController?.hasPendingRefresh?.() === true
      )),
      {
        timeout: 5000,
        message: 'Invalidação recebida durante edição não foi marcada como pendente.'
      }
    ).toBe(true);

    expect(await currentExtCC(pageB)).toBe(changed);
    await expectVisibleExtCC(pageB, changed);

    await pageB.evaluate(() => document.activeElement?.blur?.());

    await expect.poll(
      () => currentExtCC(pageB),
      {
        timeout: 10000,
        message: 'Sessão B não aplicou a atualização pendente após encerrar a edição.'
      }
    ).toBe(original);
    await expectVisibleExtCC(pageB, original);

    expect(await pageB.evaluate(() => (
      window.RadarOperationalContextRefreshController?.hasPendingRefresh?.()
    ))).toBe(false);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test('gravação auditável pela UI aborta leitura do Broadcast sem perder a atualização remota', async ({ browser }, testInfo) => {
  test.setTimeout(60000);

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  let releaseRead = () => {};

  try {
    await Promise.all([
      signInInstitutional(pageA),
      signInInstitutional(pageB, 'federal_assistant')
    ]);
    await openSchool(pageA);
    await pageB.locator('#nav-dashboard').click();
    await expect(pageB.locator('#global-competence-select')).toHaveValue('2026-05');
    await Promise.all([waitRealtimeSubscribed(pageA), waitRealtimeSubscribed(pageB)]);
    const exportButton = pageB.getByRole('button', {
      name: 'Gerar relatório RADAR PDDE em formato Excel', exact: true
    });
    await expect(exportButton).toBeVisible();
    await pageB.evaluate(() => (
      window.RadarOperationalContextRefreshController.refresh('e2e-ready', { force: true })
    ));

    // Observe o evento já decodificado pelo SDK; Broadcast também pode usar
    // frames binários, portanto JSON.parse no WebSocket não é um observador válido.
    await pageB.evaluate(() => {
      window.__e2eOperationalInvalidations = 0;
      window.RadarOperationalRealtimeInvalidationController.getChannel()
        .on('broadcast', { event: 'operational-change' }, () => {
          window.__e2eOperationalInvalidations += 1;
        });
    });
    const original = await currentExtCC(pageB);
    const changed = original === 'Sim' ? 'Não' : 'Sim';
    await expectVisibleExtCC(pageA, original);

    let captureRead;
    const capturedRead = new Promise(resolve => { captureRead = resolve; });
    const readReleased = new Promise(resolve => { releaseRead = resolve; });
    let heldRequest = null;
    let monthlyReads = 0;
    let reloads = 0;
    pageB.on('load', () => { reloads += 1; });

    await pageB.route('**/rest/v1/verifications?**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== 'GET' || url.searchParams.get('competence_id') !== 'eq.2026-05') {
        await route.continue();
        return;
      }
      monthlyReads += 1;
      if (heldRequest) {
        await route.continue();
        return;
      }
      heldRequest = request;
      // O Broadcast de A inicia uma consulta real. Retemos só a entrega HTTP,
      // depois de o Supabase já ter produzido a resposta que contém a alteração.
      const response = await route.fetch();
      captureRead({ status: response.status(), body: await response.json() });
      await readReleased;
      // Após AbortSignal, a resposta retida não deve mais chegar ao navegador.
      if (!request.failure()) await route.fulfill({ response });
    });

    await extCCRow(pageA).getByRole('button', { name: changed, exact: true }).click();
    await pageA.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
    await expectVisibleExtCC(pageA, changed);
    const snapshot = await capturedRead;
    expect(snapshot.status).toBe(200);
    expect(Array.isArray(snapshot.body)).toBe(true);
    expect(snapshot.body.find(row => (
      row.school_id === 'ESC-LOCAL' && row.program_id === 'BASIC'
    ))?.bonification?.extCC).toBe(changed);
    await expect.poll(() => pageB.evaluate(() => window.__e2eOperationalInvalidations)).toBeGreaterThan(0);
    expect(await currentExtCC(pageB)).toBe(original);

    // Exportar grava administrativeLogs pelo AuditService real, sem abrir modal,
    // emitir outro Broadcast ou reconciliar verifications. Uma segunda bonificação
    // ou edição em modal poderia mascarar a perda da invalidação neste cenário.
    const auditCommitted = pageB.waitForResponse(response => (
      new URL(response.url()).pathname === '/rest/v1/administrative_logs'
      && response.request().method() === 'POST'
      && response.ok()
    ));
    const downloadPromise = pageB.waitForEvent('download');
    await exportButton.click();
    await auditCommitted;
    await expect.poll(() => heldRequest?.failure()?.errorText || '', {
      timeout: 5000,
      message: 'A gravação auditável não cancelou o request operacional em voo.'
    }).toMatch(/abort|cancel/i);
    releaseRead();

    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();
    await pageB.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
    // A convergência deve ocorrer ANTES de qualquer navegação/foco que possa
    // oferecer um caminho alternativo de recuperação e esconder a regressão.
    await expect.poll(() => currentExtCC(pageB), {
      timeout: 10000,
      message: 'B perdeu a invalidação cujo refresh foi abortado pela própria gravação.'
    }).toBe(changed);
    expect(monthlyReads).toBeGreaterThanOrEqual(2);
    expect(await pageB.evaluate(() => (
      window.RadarOperationalContextRefreshController.hasPendingRefresh()
    ))).toBe(false);

    await pageB.locator('#nav-escolas').click();
    await pageB.getByRole('row').filter({ hasText: 'Escola Local Autorizada' })
      .getByRole('button', { name: 'Ver Unidade', exact: true }).click();
    await expectVisibleExtCC(pageB, changed);
    expect(reloads).toBe(0);
    await testInfo.attach('realtime-write-abort-converged', {
      body: await pageB.screenshot(), contentType: 'image/png'
    });

    await extCCRow(pageA).getByRole('button', {
      name: original || changed, exact: true
    }).click();
    await pageA.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
    await expectVisibleExtCC(pageA, original);
  } finally {
    releaseRead();
    await contextA.close();
    await contextB.close();
  }
});

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { observeOperationalSession } = require('../support/operational-session-observer.js');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1'
  && process.env.RADAR_E2E_SUSTAINED_OPERATIONAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável e as identidades da jornada operacional.');
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && password.length < 24) throw new Error('Credencial efêmera de teste incompleta.');

const schoolA = 'OPS-SESSION-1';
const schoolB = 'OPS-SESSION-2';
const competence = '2026-08';
const extCCRow = page => page.locator(
  '#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]'
);

async function ready(page) {
  await page.waitForFunction(() => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.verifications));
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady?.then) await window.RadarProductExtensionsReady;
  });
  await expect(page.locator('#app-layout')).toBeVisible();
}

async function signIn(page, email, school) {
  await page.goto('/');
  // Validar o destino antes de enviar a senha ou realizar qualquer gesto de escrita.
  const runtime = await page.evaluate(() => ({
    environment: window.RADAR_PDDE_RUNTIME_INPUT?.environment,
    dataMode: window.RADAR_PDDE_RUNTIME_INPUT?.dataMode,
    url: window.RADAR_PDDE_RUNTIME_INPUT?.supabase?.url
  }));
  expect(runtime.environment).toBe('test');
  expect(runtime.dataMode).toBe('supabase-preview');
  expect(['127.0.0.1', 'localhost', '[::1]']).toContain(new URL(runtime.url).hostname);
  await page.locator('#radar-auth-email').fill(email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await ready(page);
  await page.goto(`/escolas/${school}`);
  await ready(page);
  await page.locator('#global-competence-select').selectOption(competence);
  await expect(extCCRow(page)).toBeVisible();
  await page.waitForFunction(() => document.getElementById('main-container')?.inert !== true
    && window.RadarOperationalRealtimeInvalidationController?.getStatus?.() === 'SUBSCRIBED');
  await expect(page.locator('#tab-verificacoes')).toHaveCSS('opacity', '1');
  page.on('dialog', dialog => dialog.accept());
}

async function projectedValue(page, schoolId) {
  return page.evaluate(({ id, month }) => (
    verificacoes?.[id]?.[`${month}_BASIC`]?.bonificacao?.extCC || ''
  ), { id: schoolId, month: competence });
}

async function canonicalVerification(page, schoolId) {
  return page.evaluate(async ({ id, month }) => {
    const snapshot = await window.RadarApplicationServices.data.statePort
      .exportCanonicalEntities(['verifications']);
    return snapshot.entities.verifications.find(item => item.school_id === id
      && item.competence_id === month && item.program_id === 'BASIC') || null;
  }, { id: schoolId, month: competence });
}

async function setDelivery(page, value) {
  await extCCRow(page).getByRole('button', { name: value, exact: true }).click();
  await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
  await expect(extCCRow(page).getByRole('button', { name: value, exact: true }))
    .toHaveClass(value === 'Sim' ? /active-sim/ : /active-nao/);
}

async function navigateSchool(page, index) {
  await page.locator('#nav-escolas').click();
  await page.getByRole('row').filter({ hasText: `Jornada operacional ${index}` })
    .getByRole('link', { name: 'Ver Unidade', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/escolas/OPS-SESSION-${index}(?:[/?#]|$)`));
  await expect(extCCRow(page)).toBeVisible();
}

async function focusReadingPosition(page) {
  // Mantém um controle de negócio em foco sem efetuar nova escrita. Botão não
  // ativa a proteção de edição de input/select e permite observar o refresh.
  await extCCRow(page).evaluate(element => element.scrollIntoView({
    block: 'center', behavior: 'instant'
  }));
  const button = extCCRow(page).getByRole('button', { name: 'Sim', exact: true });
  await button.focus();
  await expect(button).toBeFocused();
}

async function visualSnapshot(page, rememberNodes = false) {
  return page.evaluate(remember => {
    const main = document.getElementById('main-container');
    const workspace = main.querySelector('.school-workspace');
    const panel = document.getElementById('tab-verificacoes');
    const row = document.querySelector(
      '#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]'
    );
    const focused = document.activeElement;
    const focusedRow = focused?.closest('[data-document-key]');
    const scrollport = document.querySelector('main.content-area');
    if (remember) window.__RADAR_CROSS_SCHOOL_NODES__ = { workspace, panel, row, focused };
    const previous = window.__RADAR_CROSS_SCHOOL_NODES__;
    const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
    return {
      heading: normalize(main.querySelector('h1')?.innerText),
      panelText: normalize(panel?.innerText),
      mainText: normalize(main.innerText),
      selectedDelivery: [...(row?.querySelectorAll('button') || [])]
        .filter(button => button.classList.contains('active-sim')
          || button.classList.contains('active-nao') || button.classList.contains('active-na'))
        .map(button => normalize(button.innerText)),
      sameWorkspace: previous?.workspace === workspace,
      samePanel: previous?.panel === panel,
      sameRow: previous?.row === row,
      sameFocusedNode: previous?.focused === focused,
      focus: {
        tag: focused?.tagName || null,
        id: focused?.id || null,
        role: focused?.getAttribute('role') || null,
        label: focused?.getAttribute('aria-label') || null,
        text: focused?.matches('button, a, input, select, textarea')
          ? normalize(focused.innerText) : '',
        program: focusedRow?.dataset.programId || null,
        document: focusedRow?.dataset.documentKey || null,
        withinMonthlyPanel: Boolean(panel?.contains(focused))
      },
      documentHasFocus: document.hasFocus(),
      scroll: {
        top: scrollport?.scrollTop ?? null,
        left: scrollport?.scrollLeft ?? null,
        maxTop: scrollport ? scrollport.scrollHeight - scrollport.clientHeight : null,
        windowX: window.scrollX,
        windowY: window.scrollY,
        rowTop: row?.getBoundingClientRect().top ?? null
      },
      timeOrigin: performance.timeOrigin
    };
  }, rememberNodes);
}

test('isola atualização da escola B enquanto observador mantém o Prontuário A', async ({ browser }, testInfo) => {
  test.setTimeout(180000);
  const contexts = await Promise.all([0, 1].map(() => browser.newContext({
    viewport: { width: 1440, height: 900 }
  })));
  const [writer, observer] = await Promise.all(contexts.map(context => context.newPage()));
  const report = { stages: {} };
  let stage = 'login';
  let outcome = 'incomplete';
  let observation;
  let contextualRequests = 0;
  let failure;
  try {
    await Promise.all([
      signIn(writer, 'operational-2@radar.local', schoolB),
      signIn(observer, 'operational-4@radar.local', schoolA)
    ]);
    observation = await observeOperationalSession(observer);
    observer.on('request', request => {
      if (new URL(request.url()).pathname === '/rest/v1/rpc/read_operational_context') {
        contextualRequests += 1;
      }
    });
    const beforeB = await projectedValue(writer, schoolB);
    expect(await projectedValue(observer, schoolB)).toBe(beforeB);
    const targetB = beforeB === 'Sim' ? 'Não' : 'Sim';
    const originalA = await canonicalVerification(observer, schoolA);
    await focusReadingPosition(observer);
    const before = await visualSnapshot(observer, true);
    report.stages.before = {
      schoolA: originalA,
      schoolB: await canonicalVerification(observer, schoolB),
      visual: before,
      metrics: await observation.snapshot()
    };

    stage = 'remote-B-only';
    await setDelivery(writer, targetB);
    await expect.poll(() => projectedValue(observer, schoolB), { timeout: 30000 }).toBe(targetB);
    // A leitura pode aplicar memória antes de seu callback reconstruir a superfície.
    // Dois frames permitem observar esse efeito sem um atraso temporal arbitrário.
    await observer.evaluate(() => new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const afterB = await visualSnapshot(observer);
    const afterCanonicalB = await canonicalVerification(observer, schoolB);
    const afterCanonicalA = await canonicalVerification(observer, schoolA);
    report.stages.afterRemoteB = {
      schoolA: afterCanonicalA,
      schoolB: afterCanonicalB,
      visual: afterB,
      metrics: await observation.snapshot(),
      logicalMonthlyPanelUnchanged: afterB.panelText === before.panelText
        && JSON.stringify(afterB.selectedDelivery) === JSON.stringify(before.selectedDelivery),
      wholeMainTextUnchanged: afterB.mainText === before.mainText,
      logicalFocusUnchanged: JSON.stringify(afterB.focus) === JSON.stringify(before.focus),
      scrollTopDelta: afterB.scroll.top - before.scroll.top,
      scrollLeftDelta: afterB.scroll.left - before.scroll.left
    };
    expect(afterCanonicalB.bonification.extCC).toBe(targetB);
    expect(afterCanonicalA).toEqual(originalA);
    expect(afterB.heading).toBe(before.heading);
    expect(afterB.panelText).toBe(before.panelText);
    expect(afterB.selectedDelivery).toEqual(before.selectedDelivery);
    expect(afterB.timeOrigin).toBe(before.timeOrigin);
    // Não exigir reconstrução: a medição deve continuar válida se ela for eliminada.
    await observer.screenshot({ path: testInfo.outputPath('observer-A-after-B.png'), fullPage: true });

    stage = 'navigate-to-B';
    const readsBeforeNavigation = contextualRequests;
    await navigateSchool(observer, 2);
    await expect(extCCRow(observer).getByRole('button', { name: targetB, exact: true }))
      .toHaveClass(targetB === 'Sim' ? /active-sim/ : /active-nao/);
    const navigation = await visualSnapshot(observer);
    report.stages.navigateToB = {
      targetValue: targetB,
      contextualReadsStarted: contextualRequests - readsBeforeNavigation,
      sameDocument: navigation.timeOrigin === before.timeOrigin,
      visual: navigation
    };
    expect(navigation.timeOrigin).toBe(before.timeOrigin);
    expect(contextualRequests - readsBeforeNavigation).toBe(0);

    stage = 'relevant-A-control';
    await Promise.all([navigateSchool(observer, 1), navigateSchool(writer, 1)]);
    const originalAValue = await projectedValue(writer, schoolA);
    const targetA = originalAValue === 'Sim' ? 'Não' : 'Sim';
    await focusReadingPosition(observer);
    report.stages.beforeRelevantA = { visual: await visualSnapshot(observer, true) };
    await setDelivery(writer, targetA);
    await expect(extCCRow(observer).getByRole('button', { name: targetA, exact: true }))
      .toHaveClass(targetA === 'Sim' ? /active-sim/ : /active-nao/, { timeout: 30000 });
    await observer.evaluate(() => new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const finalA = await canonicalVerification(observer, schoolA);
    report.stages.relevantA = {
      targetValue: targetA,
      schoolA: finalA,
      visual: await visualSnapshot(observer),
      metrics: await observation.snapshot()
    };
    expect(finalA.bonification.extCC).toBe(targetA);
    expect(report.stages.relevantA.metrics.writes).toBe(0);
    expect(report.stages.relevantA.metrics.errors).toEqual([]);
    outcome = 'passed';
  } catch (error) {
    outcome = 'failed';
    failure = { name: error.name, message: error.message };
    throw error;
  } finally {
    report.finalMetrics = await observation?.snapshot().catch(() => null) || null;
    const serialized = JSON.stringify({
      schemaVersion: 1, generatedAt: new Date().toISOString(),
      variant: process.env.RADAR_OPERATIONAL_VARIANT || 'candidate',
      stage, outcome, failure, competence, schoolA, schoolB, ...report,
      limits: [
        'Duas sessões novas e dois gestos sequenciais; não mede carga sustentada.',
        'Banco descartável sintético, Auth/RLS/RPC/Broadcast reais; nenhuma escrita Production.',
        'O conteúdo lógico comparado é o painel mensal visível de A; texto do main é diagnóstico adicional.',
        'Troca de identidade DOM é observação, não critério que obriga uma ineficiência.',
        'Foco lógico e scroll são registrados antes/depois; documentHasFocus distingue ativação da aba de perda do controle.',
        'O export canônico observa a projeção em memória; convergência visual é verificada antes de navegar.'
      ]
    }, null, 2);
    try {
      expect(serialized).not.toContain(password);
      const target = path.resolve('test-results/operational-sustained',
        process.env.RADAR_OPERATIONAL_VARIANT || 'candidate');
      fs.mkdirSync(target, { recursive: true });
      fs.writeFileSync(path.join(target, 'cross-school-report.json'), `${serialized}\n`);
      await testInfo.attach('operational-cross-school-report', {
        body: Buffer.from(serialized), contentType: 'application/json'
      });
    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  }
});

'use strict';

const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1'
  && process.env.RADAR_E2E_SUSTAINED_OPERATIONAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável e as identidades da jornada operacional.');
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
if (enabled && password.length < 24) throw new Error('Credencial efêmera de teste incompleta.');

const competence = '2026-08';
const school = index => `OPS-SESSION-${index}`;
const extCCRow = page => page.locator(
  '#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]'
);

async function ready(page, expectedRole) {
  await page.waitForFunction(role => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === role
    && Boolean(window.RadarApplicationServices?.verifications), expectedRole);
  await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady?.then) await window.RadarProductExtensionsReady;
  });
  await expect(page.locator('#app-layout')).toBeVisible();
}

async function signIn(page, email, schoolId, role = 'controller') {
  await page.goto('/');
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
  await ready(page, role);
  await page.goto(`/escolas/${schoolId}`);
  await ready(page, role);
  await page.locator('#global-competence-select').selectOption(competence);
  await expect(extCCRow(page)).toBeVisible();
  await page.waitForFunction(() => document.getElementById('main-container')?.inert !== true
    && window.RadarOperationalRealtimeInvalidationController?.getStatus?.() === 'SUBSCRIBED');
  page.on('dialog', dialog => dialog.accept());
}

async function setDelivery(page, value) {
  await extCCRow(page).getByRole('button', { name: value, exact: true }).click();
  await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
  await expect(extCCRow(page).getByRole('button', { name: value, exact: true }))
    .toHaveClass(value === 'Sim' ? /active-sim/ : /active-nao/);
}

async function currentDelivery(page) {
  return extCCRow(page).locator('button.active-sim, button.active-nao, button.active-na')
    .first().innerText();
}

async function navigateSchool(page, index) {
  await page.locator('#nav-escolas').click();
  await page.getByRole('row').filter({ hasText: `Jornada operacional ${index}` })
    .getByRole('link', { name: 'Ver Unidade', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/escolas/OPS-SESSION-${index}(?:[/?#]|$)`));
  await expect(extCCRow(page)).toBeVisible();
}

function observeContextReads(page) {
  let reads = 0;
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/rest/v1/rpc/read_operational_context') reads += 1;
  });
  return () => reads;
}

test('mudança em outra escola não interrompe o Prontuário atual e é buscada ao navegar para ela', async ({ browser }) => {
  test.setTimeout(180000);
  const writerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const observerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const writer = await writerContext.newPage();
  const observer = await observerContext.newPage();
  try {
    await Promise.all([
      signIn(writer, 'operational-2@radar.local', school(2)),
      signIn(observer, 'operational-1@radar.local', school(1))
    ]);
    const getReads = observeContextReads(observer);
    const beforeA = await currentDelivery(observer);
    const beforeB = await currentDelivery(writer);
    const targetB = beforeB === 'Sim' ? 'Não' : 'Sim';

    await setDelivery(writer, targetB);

    // A escola 1 é o trabalho corrente do observador. Uma alteração remota na
    // escola 2 deve ser lembrada como informação nova, não forçar a releitura
    // completa e reconstrução do Prontuário 1.
    await new Promise(resolve => setTimeout(resolve, 8000));
    expect(await currentDelivery(observer)).toBe(beforeA);
    expect(getReads(), 'alteração de outra escola não deve iniciar leitura contextual completa').toBe(0);

    const readsBeforeNavigation = getReads();
    await navigateSchool(observer, 2);
    await expect(extCCRow(observer).getByRole('button', { name: targetB, exact: true }))
      .toHaveClass(targetB === 'Sim' ? /active-sim/ : /active-nao/, { timeout: 30000 });
    expect(getReads() - readsBeforeNavigation,
      'ao entrar na escola alterada o RADAR deve buscar a versão atual automaticamente').toBe(1);
  } finally {
    await Promise.all([writerContext.close(), observerContext.close()]);
  }
});

test('Assistente e Controlador na mesma escola recebem a correção automaticamente sem perder o contexto de trabalho', async ({ browser }) => {
  test.setTimeout(180000);
  const controllerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const assistantContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const controller = await controllerContext.newPage();
  const assistant = await assistantContext.newPage();
  try {
    await Promise.all([
      signIn(controller, 'operational-1@radar.local', school(1), 'controller'),
      signIn(assistant, 'operational-assistant@radar.local', school(1), 'federal_assistant')
    ]);
    const getReads = observeContextReads(controller);
    const before = await currentDelivery(assistant);
    const target = before === 'Sim' ? 'Não' : 'Sim';
    const focused = extCCRow(controller).getByRole('button', { name: 'Sim', exact: true });
    await focused.focus();
    await expect(focused).toBeFocused();

    await setDelivery(assistant, target);

    await expect(extCCRow(controller).getByRole('button', { name: target, exact: true }))
      .toHaveClass(target === 'Sim' ? /active-sim/ : /active-nao/, { timeout: 30000 });
    expect(getReads(), 'mesma escola precisa convergir sem tempestade de leituras').toBeLessThanOrEqual(1);
    const focus = await controller.evaluate(() => {
      const element = document.activeElement;
      const row = element?.closest?.('[data-program-id="BASIC"][data-document-key="extCC"]');
      return { inRow: Boolean(row), text: String(element?.innerText || '').trim() };
    });
    expect(focus).toEqual({ inRow: true, text: 'Sim' });
  } finally {
    await Promise.all([controllerContext.close(), assistantContext.close()]);
  }
});
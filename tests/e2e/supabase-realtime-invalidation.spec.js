'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável, Auth e Realtime reais.');

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

function controllerFixture() {
  const fixture = fixtures.find(item => item.profileId === 'controller' && item.active);
  if (!fixture) throw new Error('Fixture ativa de Controlador ausente.');
  return fixture;
}

async function signInController(page) {
  const fixture = controllerFixture();
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.verifications)
  ));
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
    window.verificacoes?.['ESC-LOCAL']?.['2026-05_BASIC']?.bonificacao?.extCC || ''
  ));
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
    await Promise.all([signInController(pageA), signInController(pageB)]);
    await Promise.all([openSchool(pageA), openSchool(pageB)]);
    await Promise.all([waitRealtimeSubscribed(pageA), waitRealtimeSubscribed(pageB)]);

    const original = await currentExtCC(pageB);
    const changed = original === 'Sim' ? 'Não' : 'Sim';

    await setExtCC(pageA, changed);

    await expect.poll(
      () => currentExtCC(pageB),
      {
        timeout: 10000,
        message: 'Sessão B não recebeu a alteração operacional sem recarregar a página.'
      }
    ).toBe(changed);

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

    await pageB.evaluate(() => document.activeElement?.blur?.());

    await expect.poll(
      () => currentExtCC(pageB),
      {
        timeout: 10000,
        message: 'Sessão B não aplicou a atualização pendente após encerrar a edição.'
      }
    ).toBe(original);

    expect(await pageB.evaluate(() => (
      window.RadarOperationalContextRefreshController?.hasPendingRefresh?.()
    ))).toBe(false);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

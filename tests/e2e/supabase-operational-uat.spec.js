'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_OPERATIONAL_UAT === '1';
test.skip(!enabled, 'Exige Supabase local descartável, Auth/RLS reais e UAT operacional.');

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
const controller = fixtures.find(item => item.profileId === 'controller' && item.active);

if (enabled && !controller) throw new Error('Fixture ativa de Controlador ausente.');
if (enabled && password.length < 24) throw new Error('Senha efêmera do UAT ausente.');

const OPERATIONAL_TABLES = new Set([
  'verifications',
  'registered_invoices',
  'pendencies',
  'pendency_attempts',
  'pendency_contacts',
  'assets',
  'administrative_logs'
]);

function restTable(url) {
  try {
    const parsed = new URL(url);
    const marker = '/rest/v1/';
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length).split('/')[0]);
  } catch (_error) {
    return null;
  }
}

function hasContextFilter(url) {
  const parsed = new URL(url);
  const ignored = new Set(['select', 'order', 'limit', 'offset']);
  return [...parsed.searchParams.keys()].some(key => !ignored.has(key));
}

function observeBrowser(page) {
  const pageErrors = [];
  const consoleErrors = [];
  const requests = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    const table = restTable(request.url());
    if (table && OPERATIONAL_TABLES.has(table)) {
      requests.push({ method: request.method(), table, url: request.url() });
    }
  });
  return { pageErrors, consoleErrors, requests };
}

async function signInController(page) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(controller.email);
  await page.locator('#radar-auth-password').fill(password);

  const startedAt = Date.now();
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && window.RadarDataContext?.capabilities?.mode === 'supabase'
  ), null, { timeout: 15000 });
  const elapsedMs = Date.now() - startedAt;

  await expect(page.locator('#radar-auth-gate')).toBeHidden();
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#main-container')).toBeVisible();
  await expect(page.locator('#nav-dashboard')).toBeVisible();
  return elapsedMs;
}

async function waitForControllerAfterReload(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && window.RadarDataContext?.capabilities?.mode === 'supabase'
  ), null, { timeout: 15000 });
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
}

function documentRow(page, label, programId = 'BASIC') {
  return page.locator(`#prontuario-verif-rows tr[data-program-id="${programId}"]`)
    .filter({ hasText: label })
    .first();
}

async function readRemoteBasicVerification(page, schoolId = 'ESC-LOCAL') {
  return page.evaluate(async targetSchoolId => {
    const client = window.RadarSessionContext?.service?.client;
    if (!client) throw new Error('Cliente Supabase autenticado ausente.');
    const result = await client.from('verifications')
      .select('id,school_id,competence_id,program_id,bonification,analysis,row_version')
      .eq('school_id', targetSchoolId)
      .eq('competence_id', '2026-05')
      .eq('program_id', 'BASIC')
      .single();
    if (result.error) throw result.error;
    return result.data;
  }, schoolId);
}

test.describe.serial('UAT operacional com Supabase real descartável', () => {
  test('login chega ao dashboard sem carregar coleções operacionais globais e busca logs somente sob demanda', async ({ page }, testInfo) => {
    const observed = observeBrowser(page);
    const elapsedMs = await signInController(page);

    await testInfo.attach('auth-to-dashboard.json', {
      body: Buffer.from(JSON.stringify({ elapsedMs }, null, 2)),
      contentType: 'application/json'
    });

    expect(elapsedMs, 'Login até dashboard utilizável excedeu 10 segundos no ambiente descartável.').toBeLessThan(10000);

    const bootstrapRequests = observed.requests.slice();
    expect(
      bootstrapRequests.filter(request => request.table === 'administrative_logs'),
      'Registros administrativos não podem participar do bootstrap remoto.'
    ).toEqual([]);

    const unscopedOperationalReads = bootstrapRequests.filter(request => (
      request.method === 'GET'
      && request.table !== 'administrative_logs'
      && !hasContextFilter(request.url)
    ));
    expect(
      unscopedOperationalReads,
      'O bootstrap emitiu leitura operacional sem filtro contextual.'
    ).toEqual([]);

    const auditRequestPromise = page.waitForRequest(request => (
      request.method() === 'GET' && restTable(request.url()) === 'administrative_logs'
    ));
    await page.locator('#nav-auditoria').click();
    const auditRequest = await auditRequestPromise;
    const auditUrl = new URL(auditRequest.url());

    expect(auditUrl.searchParams.get('limit')).toBe('101');
    expect(auditUrl.searchParams.get('order') || '').toContain('event_at.desc');
    await expect(page.locator('#nav-auditoria')).toHaveClass(/active/);
    await expect(page.locator('#main-container')).toBeVisible();
    await page.waitForFunction(() => (
      window.RadarAdministrativeLogReadContext?.model?.peekAudit?.().loaded === true
    ));

    expect(observed.pageErrors).toEqual([]);
    expect(observed.consoleErrors).toEqual([]);
  });

  test('avalia documento pela interface, grava no Supabase e reencontra o estado após reload sem criar base operacional local', async ({ page }) => {
    const observed = observeBrowser(page);
    await signInController(page);

    await page.goto('/escolas/ESC-LOCAL');
    await waitForControllerAfterReload(page);
    await expect(page).toHaveURL(/\/escolas\/ESC-LOCAL/);
    await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');

    const row = documentRow(page, 'Extrato Conta Corrente');
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Sim', exact: true }).click();
    await row.locator('select.select-analise').selectOption('Correto');

    await expect(row.getByRole('button', { name: 'Sim', exact: true })).toHaveClass(/active-sim/);
    await expect(row.locator('select.select-analise')).toHaveValue('Correto');

    await expect.poll(async () => {
      const remote = await readRemoteBasicVerification(page);
      return {
        delivery: remote.bonification.extCC,
        analysis: remote.analysis.extCC
      };
    }, {
      message: 'A avaliação exibida na interface não convergiu para o Supabase.',
      timeout: 10000
    }).toEqual({ delivery: 'Sim', analysis: 'Correto' });

    const remote = await readRemoteBasicVerification(page);
    expect(remote.row_version).toBeGreaterThan(0);

    const localOperationalStorage = await page.evaluate(() => ({
      verifications: localStorage.getItem('radar_pdde_verificacoes'),
      pendencies: localStorage.getItem('radar_pdde_pendencias'),
      invoices: localStorage.getItem('radar_pdde_notas_registradas'),
      assets: localStorage.getItem('radar_pdde_bens'),
      logs: localStorage.getItem('radar_pdde_logs')
    }));
    expect(localOperationalStorage).toEqual({
      verifications: null,
      pendencies: null,
      invoices: null,
      assets: null,
      logs: null
    });

    await page.reload();
    await waitForControllerAfterReload(page);
    const restoredRow = documentRow(page, 'Extrato Conta Corrente');
    await expect(restoredRow.getByRole('button', { name: 'Sim', exact: true })).toHaveClass(/active-sim/);
    await expect(restoredRow.locator('select.select-analise')).toHaveValue('Correto');

    expect(observed.pageErrors).toEqual([]);
    expect(observed.consoleErrors).toEqual([]);
  });
});

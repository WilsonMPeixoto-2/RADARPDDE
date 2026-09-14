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

// Jornadas adicionais: mutações exclusivamente pelos controles visíveis.
// evaluate é usado somente para observar banco/projeção e aguardar a fila.
async function settleWrites(page) {
  await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
}

async function openUatSchool(page) {
  page.on('dialog', dialog => dialog.accept());
  await signInController(page);
  await page.goto('/escolas/ESC-UAT');
  await waitForControllerAfterReload(page);
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');
}

function fiscalRow(page, program = 'BASIC') {
  return page.locator(`#prontuario-verif-rows tr[data-program-id="${program}"][data-document-key="notaFiscal"]`);
}

function invoiceCard(page, id) {
  return page.locator(`.invoice-document-row[data-invoice-id="${id}"]`);
}

function invoiceEditButton(card) {
  return card.getByRole('button', { name: /^Editar (?:NF:|Boleto Internet:|Despesa a identificar$)/ });
}

async function remoteRows(page, table, filters) {
  return page.evaluate(async ({ entity, where }) => {
    let query = window.RadarSessionContext.service.client.from(entity).select('*');
    Object.entries(where).forEach(([key, value]) => { query = query.eq(key, value); });
    const result = await query.order('id').limit(100);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }, { entity: table, where: filters });
}

async function ensureBonificationSim(page, row) {
  const sim = row.getByRole('button', { name: 'Sim', exact: true });
  const alreadySelected = await sim.evaluate(button => button.classList.contains('active-sim'));
  if (alreadySelected) return;
  await sim.click();
  await settleWrites(page);
  await expect(sim).toHaveClass(/active-sim/);
}

async function createInvoiceUI(page, { type, number, description, amount = '250', program = 'BASIC' }) {
  const row = fiscalRow(page, program);
  if (type === 'a_identificar') {
    await row.getByRole('button', { name: 'Registrar despesa a identificar', exact: true }).click();
  } else {
    await ensureBonificationSim(page, row);
    await row.getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
  }
  const modal = page.locator('#modal-dados-nota');
  await expect(modal).toHaveClass(/show/);
  await modal.locator('#nota-tipo').selectOption(type);
  await modal.locator('#nota-desc').fill(description);
  if (number) await modal.locator('#nota-numero').fill(number);
  await modal.locator('#nota-valor').fill(amount);
  await modal.locator('button[type="submit"]').click();
  await expect(modal).not.toHaveClass(/show/);
  await settleWrites(page);
  const records = await remoteRows(page, 'registered_invoices', { school_id: 'ESC-UAT', description });
  expect(records).toHaveLength(1);
  const invoice = records[0];
  expect(invoice.expense_type).toBe(type);
  expect(Number(invoice.amount)).toBe(Number(amount));
  return invoice;
}

async function closePreview(page, { waitForAppearance = false } = {}) {
  const drawer = page.locator('#pendency-preview-drawer');
  if (waitForAppearance) {
    await drawer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }
  if (!(await drawer.isVisible())) return;
  await drawer.locator('.pendency-preview-close').click();
  await expect(drawer).toBeHidden();
}

async function assertStoredAfterReload(page, invoice) {
  await page.reload();
  await waitForControllerAfterReload(page);
  await expect(invoiceCard(page, invoice.id)).toBeVisible();
  if (invoice.invoice_number) await expect(invoiceCard(page, invoice.id)).toContainText(invoice.invoice_number);
}

async function openInvoicePendencyUI(page, invoiceId, advisory = false) {
  const card = advisory
    ? page.locator(`[data-service-advisory-invoice="${invoiceId}"]`)
    : invoiceCard(page, invoiceId);
  const analysis = advisory ? card.locator('select') : card.locator('select.invoice-document-analysis-select');
  await analysis.selectOption('Incorreto');
  const modal = page.locator('#modal-nova-pendencia');
  await expect(modal).toHaveClass(/show/);
  await modal.locator('input[name="pend-erros"]').first().check();
  await modal.locator('#pend-obs').fill('Documento precisa de correção na homologação.');
  await modal.locator('button[type="submit"]').click();
  await expect(modal).not.toHaveClass(/show/);
  await settleWrites(page);
  await closePreview(page, { waitForAppearance: true });
  const rows = await remoteRows(page, 'pendencies', { registered_invoice_id: invoiceId, document_key: advisory ? 'consAssessoria' : 'notaFiscal' });
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe('Aberta');
  return rows[0];
}

async function submitPendencyUI(page, pendency, identify = false) {
  await page.locator('#nav-pendencias').click();
  await page.getByRole('tab', { name: /^Abertas/ }).click();
  const row = page.locator(`#p-abertas [data-pendency-id="${pendency.id}"]`).filter({ visible: true }).first();
  await expect(row).toBeVisible();

  const drawer = page.locator('#pendency-detail-drawer');
  await drawer.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (!(await drawer.isVisible().catch(() => false))) {
    await row.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await expect(drawer).toBeVisible();
  }
  const drawerAction = drawer.getByRole('button', { name: 'Registrar novo envio', exact: true });
  await expect(drawerAction).toBeVisible();
  await drawerAction.click();

  const modal = page.locator('#modal-registrar-envio');
  await expect(modal).toHaveClass(/show/);
  if (identify) {
    await modal.getByLabel('Tipo da despesa', { exact: true }).selectOption('consumo');
    await modal.getByLabel('Número ou referência do documento', { exact: true }).fill(`NF-ID-${pendency.id}`);
    await modal.getByLabel('Descrição', { exact: true }).fill('Despesa identificada pela escola');
    await modal.getByLabel('Valor (R$)', { exact: true }).fill('850');
  }
  await modal.getByLabel('Data em que o arquivo foi disponibilizado no Drive', { exact: true }).fill('2026-05-20');
  await modal.getByLabel('Observação', { exact: true }).fill('Arquivo corrigido encaminhado pela escola.');
  await modal.getByRole('button', { name: 'Registrar e enviar para reanálise', exact: true }).click();
  await expect(modal).not.toHaveClass(/show/);
  await settleWrites(page);
  const stored = (await remoteRows(page, 'pendencies', { id: pendency.id }))[0];
  expect(stored.status).toBe('Aguardando reanálise');
  expect((await remoteRows(page, 'pendency_attempts', { pendency_id: pendency.id })).length).toBeGreaterThan(0);
  await expect(page.locator(`[data-pendency-id="${pendency.id}"]`).filter({ visible: true }).first()).toContainText('Reanalisar');
  await closePreview(page, { waitForAppearance: true });
}

async function reanalyzePendencyUI(page, pendency, result = 'correto') {
  await page.getByRole('tab', { name: /^Aguardando/ }).click();
  const row = page.locator(`#p-aguardando [data-pendency-id="${pendency.id}"]`).filter({ visible: true }).first();
  await expect(row).toBeVisible();

  const drawer = page.locator('#pendency-detail-drawer');
  await drawer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (!(await drawer.isVisible().catch(() => false))) {
    await row.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    await expect(drawer).toBeVisible();
  }
  const drawerAction = drawer.getByRole('button', { name: 'Reanalisar', exact: true });
  await expect(drawerAction).toBeVisible();
  await drawerAction.click();

  const modal = page.locator('#modal-reanalisar-pendencia');
  await expect(modal).toHaveClass(/show/);
  await modal.getByLabel('Resultado da reanálise', { exact: true }).selectOption(result);
  await modal.getByLabel('Observação da análise', { exact: true }).fill('Reanálise executada pela interface.');
  if (result === 'incorreto') await modal.locator('input[name="reanalisar-erros"]').first().check();
  await modal.getByRole('button', { name: 'Confirmar reanálise', exact: true }).click();
  await expect(modal).not.toHaveClass(/show/);
  await settleWrites(page);
  const expected = result === 'incorreto' ? 'Aberta' : 'Resolvida';
  expect((await remoteRows(page, 'pendencies', { id: pendency.id }))[0].status).toBe(expected);
  const attempts = await remoteRows(page, 'pendency_attempts', { pendency_id: pendency.id });
  expect(attempts.some(attempt => attempt.result === result)).toBe(true);
}

async function assertOperationalReads(observed) {
  expect(observed.requests.filter(request => request.method === 'GET'
    && request.table === 'administrative_logs')).toEqual([]);
  expect(observed.requests.filter(request => request.method === 'GET'
    && !hasContextFilter(request.url))).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
  expect(observed.consoleErrors).toEqual([]);
}

test.describe('Formulários operacionais com banco real', () => {
  test.setTimeout(90000);

  test('consumo: cadastrar, analisar, retificar e excluir pela UI persiste após reload', async ({ page }, testInfo) => {
    const observed = observeBrowser(page);
    await openUatSchool(page);
    const invoice = await createInvoiceUI(page, { type: 'consumo', number: `UAT-CONS-${testInfo.retry}`, description: `Material de consumo UAT ${testInfo.retry}` });
    await invoiceCard(page, invoice.id).locator('select.invoice-document-analysis-select').selectOption('Correto');
    await settleWrites(page);
    expect((await remoteRows(page, 'registered_invoices', { id: invoice.id }))[0].payload.analiseDocumentoFiscal).toBe('Correto');
    await invoiceEditButton(invoiceCard(page, invoice.id)).click();
    await page.locator('#nota-desc').fill('Material de consumo retificado');
    await page.locator('#nota-numero').fill(`UAT-CONS-RET-${testInfo.retry}`);
    await page.locator('#nota-valor').fill('315.50');
    await page.locator('#form-dados-nota button[type="submit"]').click();
    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    const edited = (await remoteRows(page, 'registered_invoices', { id: invoice.id }))[0];
    expect(edited).toMatchObject({ description: 'Material de consumo retificado', amount: 315.5 });
    expect(edited.row_version).toBeGreaterThan(invoice.row_version);
    await assertStoredAfterReload(page, edited);
    await invoiceCard(page, invoice.id).getByRole('button', { name: /^Excluir NF:/ }).click();
    await expect(invoiceCard(page, invoice.id)).toHaveCount(0);
    expect(await remoteRows(page, 'registered_invoices', { id: invoice.id })).toEqual([]);
    await page.reload();
    await waitForControllerAfterReload(page);
    await expect(invoiceCard(page, invoice.id)).toHaveCount(0);
    await assertOperationalReads(observed);
  });

  test('serviço: Assessoria individual abre Pendência, recebe envio, mantém erro e resolve após nova reanálise', async ({ page }, testInfo) => {
    const observed = observeBrowser(page);
    await openUatSchool(page);
    const invoice = await createInvoiceUI(page, { type: 'servico', number: `UAT-SERV-${testInfo.retry}`, description: `Serviço UAT ${testInfo.retry}` });
    const other = await createInvoiceUI(page, { type: 'servico', number: `UAT-OUTRO-${testInfo.retry}`, description: `Outro serviço UAT ${testInfo.retry}` });
    const sent = page.getByLabel(`Consulta enviada à Assessoria para a NF ${invoice.invoice_number}`, { exact: true });
    await sent.check();
    await settleWrites(page);
    expect((await remoteRows(page, 'registered_invoices', { id: invoice.id }))[0].payload.consultaAssessoriaEnviada).toBe(true);
    const pending = await openInvoicePendencyUI(page, invoice.id, true);
    await submitPendencyUI(page, pending);
    await reanalyzePendencyUI(page, pending, 'incorreto');
    await submitPendencyUI(page, pending);
    await reanalyzePendencyUI(page, pending);
    expect((await remoteRows(page, 'registered_invoices', { id: invoice.id }))[0].payload.analiseConsultaAssessoria).toBe('Correto');
    expect((await remoteRows(page, 'registered_invoices', { id: other.id }))[0].payload.analiseConsultaAssessoria).toBe('Não analisado');
    await page.goto('/escolas/ESC-UAT');
    await waitForControllerAfterReload(page);
    await expect(page.getByLabel(`Análise da consulta à Assessoria para a NF ${invoice.invoice_number}`, { exact: true })).toHaveValue('Correto');
    await assertOperationalReads(observed);
  });

  test('a identificar: abertura atômica, retificação sem perder vínculos, identificação e resolução sobrevivem ao reload', async ({ page }, testInfo) => {
    const observed = observeBrowser(page);
    await openUatSchool(page);
    const invoice = await createInvoiceUI(page, { type: 'a_identificar', description: `Débito não identificado UAT ${testInfo.retry}`, amount: '850' });
    expect(invoice.payload.analiseDocumentoFiscal).toBe('Incorreto');
    const pending = (await remoteRows(page, 'pendencies', { registered_invoice_id: invoice.id }))[0];
    expect(pending.status).toBe('Aberta');
    await closePreview(page, { waitForAppearance: true });
    await invoiceEditButton(invoiceCard(page, invoice.id)).click();
    await expect(page.locator('#nota-tipo')).toBeDisabled();
    await page.locator('#nota-desc').fill('Débito retificado, identificação pendente');
    await page.locator('#nota-valor').fill('850');
    await page.locator('#form-dados-nota button[type="submit"]').click();
    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    expect((await remoteRows(page, 'pendencies', { id: pending.id }))[0].registered_invoice_id).toBe(invoice.id);
    await submitPendencyUI(page, pending, true);
    const identified = (await remoteRows(page, 'registered_invoices', { id: invoice.id }))[0];
    expect(identified.expense_type).toBe('consumo');
    expect(identified.payload.analiseDocumentoFiscal).toBe('Não analisado');
    await reanalyzePendencyUI(page, pending);
    await page.goto('/escolas/ESC-UAT');
    await waitForControllerAfterReload(page);
    const restoredCard = invoiceCard(page, invoice.id);
    await expect(restoredCard).toBeVisible();
    await expect(restoredCard).toContainText('Correto');
    expect((await remoteRows(page, 'registered_invoices', { id: invoice.id }))[0].payload.analiseDocumentoFiscal).toBe('Correto');
    expect((await remoteRows(page, 'pendencies', { id: pending.id }))[0].status).toBe('Resolvida');
    await assertOperationalReads(observed);
  });

  test('boleto de internet: documento individual no programa correto persiste e recebe Pendência/reanálise', async ({ page }, testInfo) => {
    const observed = observeBrowser(page);
    await openUatSchool(page);
    const invoice = await createInvoiceUI(page, { type: 'boleto_internet', number: `UAT-BOL-${testInfo.retry}`, description: `Internet UAT ${testInfo.retry}`, program: 'CONECTADA' });
    expect(invoice.linked_asset_id).toBeNull();
    const pending = await openInvoicePendencyUI(page, invoice.id);
    await submitPendencyUI(page, pending);
    await reanalyzePendencyUI(page, pending);
    await page.goto('/escolas/ESC-UAT');
    await waitForControllerAfterReload(page);
    const restoredCard = invoiceCard(page, invoice.id);
    await expect(restoredCard).toBeVisible();
    await expect(restoredCard).toContainText('Correto');
    expect((await remoteRows(page, 'registered_invoices', { id: invoice.id }))[0].payload.analiseDocumentoFiscal).toBe('Correto');
    await expect(page.locator('[data-document-key="boletoInternet"]')).toHaveCount(0);
    await assertOperationalReads(observed);
  });
});

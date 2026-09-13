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

async function signInController(page) {
  await page.goto('/');
  await expect(page.locator('#radar-auth-gate')).toBeVisible();
  await page.locator('#radar-auth-email').fill(controller.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await waitForController(page);
}

async function waitForController(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && window.RadarDataContext?.capabilities?.mode === 'supabase'
  ), null, { timeout: 15000 });
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
}

async function settleWrites(page) {
  await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
}

async function remoteRows(page, table, filters) {
  return page.evaluate(async ({ entity, where }) => {
    let query = window.RadarSessionContext.service.client.from(entity).select('*');
    Object.entries(where).forEach(([key, value]) => { query = query.eq(key, value); });
    const result = await query.order('id').limit(200);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }, { entity: table, where: filters });
}

function fiscalRow(page) {
  return page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="notaFiscal"]');
}

function invoiceCard(page, id) {
  return page.locator(`.invoice-document-row[data-invoice-id="${id}"]`);
}

async function closePendencyPreview(page) {
  const drawer = page.locator('#pendency-preview-drawer');
  await drawer.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (!(await drawer.isVisible())) return;
  await drawer.locator('.pendency-preview-close').click();
  await expect(drawer).toBeHidden();
}

async function createOpenPendencyByUi(page, suffix) {
  await page.goto('/escolas/ESC-UAT');
  await waitForController(page);
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');

  const row = fiscalRow(page);
  await row.getByRole('button', { name: 'Sim', exact: true }).click();
  await settleWrites(page);
  await row.getByRole('button', { name: 'Adicionar Nota', exact: true }).click();

  const modal = page.locator('#modal-dados-nota');
  await expect(modal).toHaveClass(/show/);
  await modal.locator('#nota-tipo').selectOption('consumo');
  await modal.locator('#nota-numero').fill(`UAT-PEND-OPS-${suffix}`);
  await modal.locator('#nota-desc').fill(`Documento para ciclo administrativo ${suffix}`);
  await modal.locator('#nota-valor').fill('123.45');
  await modal.locator('button[type="submit"]').click();
  await expect(modal).not.toHaveClass(/show/);
  await settleWrites(page);

  const invoices = await remoteRows(page, 'registered_invoices', {
    school_id: 'ESC-UAT',
    invoice_number: `UAT-PEND-OPS-${suffix}`
  });
  expect(invoices).toHaveLength(1);
  const invoice = invoices[0];

  await invoiceCard(page, invoice.id).locator('select.invoice-document-analysis-select').selectOption('Incorreto');
  const pendencyModal = page.locator('#modal-nova-pendencia');
  await expect(pendencyModal).toHaveClass(/show/);
  await pendencyModal.locator('input[name="pend-erros"]').first().check();
  await pendencyModal.locator('#pend-obs').fill('Pendência criada para homologação administrativa.');
  await pendencyModal.locator('button[type="submit"]').click();
  await expect(pendencyModal).not.toHaveClass(/show/);
  await settleWrites(page);
  await closePendencyPreview(page);

  const pendencies = await remoteRows(page, 'pendencies', {
    registered_invoice_id: invoice.id,
    document_key: 'notaFiscal'
  });
  expect(pendencies).toHaveLength(1);
  expect(pendencies[0].status).toBe('Aberta');
  return { invoice, pendency: pendencies[0] };
}

async function openPendencyDrawer(page, pendencyId, tabName) {
  await page.locator('#nav-pendencias').click();
  await page.getByRole('tab', { name: tabName }).click();
  const row = page.locator(`[data-pendency-id="${pendencyId}"]`).filter({ visible: true }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
  const drawer = page.getByRole('complementary', { name: 'Detalhes da pendência' });
  await expect(drawer).toBeVisible();
  return drawer;
}

test.describe('UAT Supabase — contato, cancelamento e reabertura de Pendência', () => {
  test.setTimeout(90000);

  test('contato, cancelamento e reabertura persistem no Supabase e sobrevivem a reload', async ({ page }, testInfo) => {
    page.on('dialog', dialog => dialog.accept());
    await signInController(page);
    const suffix = `${testInfo.retry}`;
    const { pendency } = await createOpenPendencyByUi(page, suffix);

    const logsBefore = (await remoteRows(page, 'administrative_logs', { school_id: 'ESC-UAT' })).length;

    let drawer = await openPendencyDrawer(page, pendency.id, /^Abertas\b/);
    await drawer.getByRole('button', { name: 'Registrar contato', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Registrar contato da pendência' });
    await dialog.getByLabel('Canal').selectOption('E-mail');
    await dialog.getByLabel('Descrição do contato').fill('Contato operacional registrado pela UAT Supabase.');
    await dialog.getByRole('button', { name: 'Salvar contato', exact: true }).click();
    await expect(page.locator('#task-10-11-live-region')).toHaveText('Contato registrado e incluído na linha do tempo.');
    await settleWrites(page);

    const contacts = await remoteRows(page, 'pendency_contacts', { pendency_id: pendency.id });
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      contact_type: 'E-mail',
      description: 'Contato operacional registrado pela UAT Supabase.'
    });
    expect((await remoteRows(page, 'pendencies', { id: pendency.id }))[0].status).toBe('Aberta');
    expect((await remoteRows(page, 'administrative_logs', { school_id: 'ESC-UAT' })).length).toBeGreaterThan(logsBefore);

    await page.reload();
    await waitForController(page);
    drawer = await openPendencyDrawer(page, pendency.id, /^Abertas\b/);
    await expect(drawer).toContainText('Contato operacional registrado pela UAT Supabase.');

    const logsBeforeCancel = (await remoteRows(page, 'administrative_logs', { school_id: 'ESC-UAT' })).length;
    await drawer.getByRole('button', { name: 'Cancelar pendência', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Cancelar pendência' });
    await dialog.getByLabel('Justificativa do cancelamento').fill('Cancelamento controlado para homologação de persistência.');
    await dialog.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
    await expect(page.locator('#task-10-11-live-region')).toHaveText('Pendência cancelada e preservada no histórico.');
    await settleWrites(page);

    let stored = (await remoteRows(page, 'pendencies', { id: pendency.id }))[0];
    expect(stored.status).toBe('Cancelada');
    expect(stored.canceled_at).toBeTruthy();
    expect((await remoteRows(page, 'administrative_logs', { school_id: 'ESC-UAT' })).length).toBeGreaterThan(logsBeforeCancel);

    await page.reload();
    await waitForController(page);
    drawer = await openPendencyDrawer(page, pendency.id, /^Canceladas\b/);
    await expect(drawer.getByRole('button', { name: 'Reabrir pendência', exact: true })).toBeVisible();

    const logsBeforeReopen = (await remoteRows(page, 'administrative_logs', { school_id: 'ESC-UAT' })).length;
    await drawer.getByRole('button', { name: 'Reabrir pendência', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Reabrir pendência' });
    await dialog.getByLabel('Documento ilegível').check();
    await dialog.getByLabel('Justificativa da reabertura').fill('Reabertura controlada após nova conferência documental.');
    await dialog.getByRole('button', { name: 'Confirmar reabertura', exact: true }).click();
    await expect(page.locator('#task-10-11-live-region')).toHaveText('Pendência reaberta e devolvida à fila Abertas.');
    await settleWrites(page);

    stored = (await remoteRows(page, 'pendencies', { id: pendency.id }))[0];
    expect(stored.status).toBe('Aberta');
    expect(stored.canceled_at).toBeNull();
    expect((await remoteRows(page, 'administrative_logs', { school_id: 'ESC-UAT' })).length).toBeGreaterThan(logsBeforeReopen);

    await page.reload();
    await waitForController(page);
    drawer = await openPendencyDrawer(page, pendency.id, /^Abertas\b/);
    await expect(drawer).toContainText('Documento ilegível');
    await expect(drawer).toContainText('Reabertura controlada após nova conferência documental.');

    const restoredContacts = await remoteRows(page, 'pendency_contacts', { pendency_id: pendency.id });
    expect(restoredContacts).toHaveLength(1);
    expect(restoredContacts[0].description).toBe('Contato operacional registrado pela UAT Supabase.');
  });
});

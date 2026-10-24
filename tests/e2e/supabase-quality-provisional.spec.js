const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase descartável com Auth e RLS reais.');
const accounts = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const email = process.env.RADAR_QUALITY_TEST_EMAIL
  || accounts.find(account => account.profileId === 'controller' && account.active).email;
const schoolName = process.env.RADAR_QUALITY_TEST_SCHOOL || 'Escola da Conta PDDE Qualidade';

async function ready(page) {
  await page.waitForFunction(() => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller');
  await expect(page.locator('#radar-auth-gate')).toBeHidden();
}

async function state(page, schoolId, movementId) {
  return page.evaluate(async ({ schoolId, movementId }) => {
    const client = window.RadarSessionContext.service.client;
    const results = await Promise.all([
      client.from('registered_invoices').select('id,description,amount,program_id,invoice_number').eq('school_id', schoolId),
      client.from('pendencies').select('id').eq('school_id', schoolId),
      client.from('verifications').select('program_id,bonification').eq('school_id', schoolId).eq('competence_id', '2026-05'),
      client.from('quality_provisional_movements').select('*').eq('id', movementId).single()
    ]);
    for (const result of results) if (result.error) throw new Error(result.error.message);
    return { invoices: results[0].data, pendencies: results[1].data,
      bonification: results[2].data.find(item => item.program_id === 'CONECTADA')?.bonification || {},
      movement: results[3].data };
  }, { schoolId, movementId });
}

test('Controlador registra saída sem programa, reencontra e identifica uma única NF', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(email);
  await page.locator('#radar-auth-password').fill(process.env.RADAR_AUTH_FIXTURE_PASSWORD || '');
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await ready(page);
  await page.locator('#global-competence-select').selectOption('2026-05');
  await page.locator('#nav-escolas').click();
  await page.getByRole('row').filter({ hasText: schoolName })
    .getByRole('link', { name: 'Ver Unidade', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Conta PDDE Qualidade · movimentações sem programa' });
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Registrar saída', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Registrar saída sem programa definido' });
  await expect(editor).toBeVisible();
  const created = page.waitForResponse(response => response.request().method() === 'POST'
    && response.url().includes('/rest/v1/quality_provisional_movements'));
  await editor.getByRole('button', { name: 'Salvar movimentação', exact: true }).click();
  const response = await created;
  expect(response.ok()).toBe(true);
  const inserted = await response.json();
  const movementId = (Array.isArray(inserted) ? inserted[0] : inserted).id;
  expect(typeof movementId).toBe('string');
  await expect(editor).toBeHidden();
  const schoolId = await page.evaluate(() => window.RadarNavigationHistory.currentRoute(window).param);
  const baseline = await state(page, schoolId, movementId);
  expect(baseline.movement).toMatchObject({ status: 'open', amount: null, description: null, registered_invoice_id: null });
  await page.reload();
  await ready(page);
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-05');
  const record = panel.locator('article').first();
  await expect(record).toContainText('Saída sem descrição');
  await expect(record).toContainText('Valor não informado');
  await record.getByRole('button', { name: 'Editar', exact: true }).click();
  const editing = page.getByRole('dialog', { name: 'Editar movimentação provisória' });
  const number = `QUAL-${Date.now()}`;
  await editing.getByLabel('Descrição (opcional)', { exact: true }).fill('Saída conferida no extrato');
  await editing.getByLabel('Valor em R$ (opcional)', { exact: true }).fill('250.35');
  await editing.getByLabel('Referência (opcional)', { exact: true }).fill(number);
  await editing.getByLabel('Observação (opcional)', { exact: true }).fill('Aguardando a identificação do programa.');
  await editing.getByRole('button', { name: 'Salvar movimentação', exact: true }).click();
  await expect(editing).toBeHidden();
  await page.reload();
  await ready(page);
  await expect(record).toContainText('Saída conferida no extrato');
  await expect(record).toContainText('250,35');
  const edited = await state(page, schoolId, movementId);
  expect(edited.invoices).toEqual(baseline.invoices);
  expect(edited.pendencies).toEqual(baseline.pendencies);
  expect(edited.bonification).toEqual(baseline.bonification);
  await page.screenshot({ path: testInfo.outputPath('quality-prontuario-integrated.png') });
  await panel.screenshot({ path: testInfo.outputPath('quality-provisional-before-identification.png') });
  await record.getByRole('combobox').selectOption('CONECTADA');
  await record.getByRole('button', { name: 'Identificar despesa', exact: true }).click();
  const invoice = page.locator('#modal-dados-nota');
  await expect(invoice).toHaveClass(/show/);
  await expect(invoice.locator('#nota-desc')).toHaveValue('Saída conferida no extrato');
  await expect(invoice.locator('#nota-valor')).toHaveValue('250.35');
  await expect(invoice.locator('#nota-tipo option[value="a_identificar"]')).toBeDisabled();
  await invoice.getByLabel('Tipo de Gasto', { exact: true }).selectOption('consumo');
  await invoice.screenshot({ path: testInfo.outputPath('quality-identification-form.png') });

  // Uma falha de rede não pode baixar o provisório nem deixar uma NF parcial.
  const rpc = '**/rest/v1/rpc/identify_quality_provisional_movement';
  await page.route(rpc, route => route.fulfill({ status: 503, contentType: 'application/json',
    body: JSON.stringify({ code: 'CONTROLLED_UNAVAILABLE', message: 'Falha controlada de conexão.' }) }));
  const rejected = page.waitForResponse(response => response.url().endsWith('/rpc/identify_quality_provisional_movement'));
  await invoice.getByRole('button', { name: 'Identificar despesa', exact: true }).click();
  expect((await rejected).status()).toBe(503);
  await expect(invoice.getByRole('button', { name: 'Identificar despesa', exact: true })).toBeEnabled();
  const afterFailure = await state(page, schoolId, movementId);
  expect(afterFailure).toEqual(edited);
  await page.unroute(rpc);
  await invoice.getByRole('button', { name: 'Identificar despesa', exact: true }).click();
  await expect(invoice).not.toHaveClass(/show/);
  await page.reload();
  await ready(page);
  await expect(record).toContainText('Identificada');
  await expect(record.getByRole('button', { name: 'Identificar despesa', exact: true })).toHaveCount(0);
  const final = await state(page, schoolId, movementId);
  expect(final.movement.status).toBe('identified');
  expect(final.invoices).toHaveLength(baseline.invoices.length + 1);
  expect(final.invoices.find(item => item.id === final.movement.registered_invoice_id))
    .toMatchObject({ description: 'Saída conferida no extrato', amount: 250.35, program_id: 'CONECTADA', invoice_number: number });
  expect(final.pendencies).toEqual(baseline.pendencies);
  // Consumo aplica o N/A canônico de Assessoria; não marca bonificação manual.
  expect(final.bonification).toMatchObject({
    extCC: baseline.bonification.extCC || '',
    extINV: baseline.bonification.extINV || '',
    notaFiscal: baseline.bonification.notaFiscal || '',
    declBBAgil: baseline.bonification.declBBAgil || '',
    encampInventario: baseline.bonification.encampInventario || '',
    consAssessoria: 'Não se aplica'
  });
  await expect(page.locator('.invoice-document-row').filter({ hasText: number })).toHaveCount(1);
  expect(browserErrors).toEqual([]);
  await panel.screenshot({ path: testInfo.outputPath('quality-identified-after-reload.png') });
  const evidencePath = testInfo.outputPath('quality-journey.json');
  fs.writeFileSync(evidencePath, JSON.stringify({ schoolId, movementId, baseline, final, browserErrors }, null, 2));
  await testInfo.attach('quality-journey.json', { path: evidencePath, contentType: 'application/json' });
});

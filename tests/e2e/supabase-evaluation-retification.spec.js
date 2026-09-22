'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_OPERATIONAL_UAT === '1';
test.skip(!enabled, 'Exige Supabase descartável com Auth/RLS reais.');
test.use({ trace: 'off', video: 'off' });
const accounts = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const controller = accounts.find(account => account.profileId === 'controller' && account.active);

async function ready(page) {
  await page.waitForFunction(() => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller');
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

async function settleWrites(page) {
  await page.evaluate(() => window.RadarApplicationServices.data.remoteExecutionTail);
}

async function setStableScrollProbe(page, anchor) {
  const contentArea = page.locator('main.content-area');
  await anchor.evaluate(element => {
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  const beforeScroll = await contentArea.evaluate(element => element.scrollTop);
  const beforeAnchorTop = await anchor.evaluate(element => element.getBoundingClientRect().top);
  expect(beforeScroll).toBeGreaterThan(50);
  return { contentArea, anchor, beforeScroll, beforeAnchorTop };
}

async function expectScrollPreserved(page, probe) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const afterScroll = await probe.contentArea.evaluate(element => element.scrollTop);
  const afterAnchorTop = await probe.anchor.evaluate(element => element.getBoundingClientRect().top);
  expect(afterScroll).toBeGreaterThan(0);
  expect(Math.abs(afterAnchorTop - probe.beforeAnchorTop)).toBeLessThanOrEqual(4);
}

async function verification(page) {
  return page.evaluate(async () => {
    const { data, error } = await window.RadarSessionContext.service.client.from('verifications')
      .select('id,bonification,analysis,row_version').eq('school_id', 'ESC-EDIT')
      .eq('competence_id', '2026-05').eq('program_id', 'BASIC').single();
    if (error) throw error;
    return data;
  });
}

test('edição explícita salva, desfaz e retifica Pendência atomicamente sem buscar histórico global', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const reads = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.method() === 'GET' && request.url().includes('/rest/v1/')) reads.push(request.url());
  });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(controller.email);
  await page.locator('#radar-auth-password').fill(process.env.RADAR_AUTH_FIXTURE_PASSWORD);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await ready(page);
  await page.goto('/escolas/ESC-EDIT');
  await ready(page);
  const row = page.locator('#prontuario-verif-rows tr[data-program-id="BASIC"][data-document-key="extCC"]');
  const sim = row.getByRole('button', { name: 'Sim', exact: true });

  await sim.click();
  await settleWrites(page);
  await expect(sim).toHaveClass(/active-sim/);
  await expect.poll(async () => (await verification(page)).bonification.extCC).toBe('Sim');

  await row.locator('select.select-analise').selectOption('Correto');
  await settleWrites(page);
  await expect(row.locator('select.select-analise')).toHaveValue('Correto');
  await expect.poll(async () => (await verification(page)).analysis.extCC).toBe('Correto');

  await row.getByRole('button', { name: 'Editar análise', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Editar análise técnica', exact: true });
  await expect(dialog).toContainText('Registrar novo envio');
  await dialog.getByLabel('Nova análise técnica').selectOption('Não analisado');
  await expect(dialog.locator('.evaluation-retification-preview')).toHaveText('Correto → Não analisado');
  const editScroll = await setStableScrollProbe(page, row);
  await dialog.getByRole('button', { name: 'Salvar edição', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expectScrollPreserved(page, editScroll);
  await expect(row.locator('select.select-analise')).toHaveValue('Não analisado');
  await expect.poll(async () => (await verification(page)).analysis.extCC).toBe('Não analisado');

  await expect(row.getByRole('button', { name: 'Editar bonificação', exact: true })).toBeHidden();
  await sim.click();
  await settleWrites(page);
  await expect(page.locator('#pendency-notice')).toContainText('Bonificação desfeita com sucesso.');
  await expect(sim).not.toHaveClass(/active-sim/);
  await expect.poll(async () => (await verification(page)).bonification.extCC).toBe('');
  await expect.poll(async () => (await verification(page)).analysis.extCC).toBe('Não analisado');
  await page.reload();
  await ready(page);
  await expect(sim).not.toHaveClass(/active-sim/);
  await expect(row.locator('select.select-analise')).toHaveValue('Não analisado');

  await sim.click();
  await settleWrites(page);
  await expect(sim).toHaveClass(/active-sim/);
  await expect.poll(async () => (await verification(page)).bonification.extCC).toBe('Sim');
  await row.locator('select.select-analise').selectOption('Incorreto');
  const pendencyForm = page.locator('#modal-nova-pendencia');
  await expect(pendencyForm).toHaveClass(/show/);
  await pendencyForm.locator('input[name="pend-erros"]').first().check();
  await pendencyForm.locator('#pend-obs').fill('Lançamento incorreto para homologar retificação auditável.');
  const pendencySaveScroll = await setStableScrollProbe(page, row);
  await pendencyForm.locator('button[type="submit"]').click();
  await expect(pendencyForm).not.toHaveClass(/show/);
  await expectScrollPreserved(page, pendencySaveScroll);
  await expect(pendencyForm).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(async () => (await verification(page)).analysis.extCC).toBe('Incorreto');
  const viewPendency = row.getByRole('button', { name: 'Visualizar pendência', exact: true });
  await expect(viewPendency).toBeVisible();
  await viewPendency.click();
  const preview = page.locator('#pendency-preview-drawer');
  await expect(preview).toBeVisible();
  await preview.locator('.pendency-preview-close').click();
  await expect(preview).toBeHidden();

  await row.getByRole('button', { name: 'Editar análise', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Editar análise técnica', exact: true });
  await dialog.getByLabel('Nova análise técnica').selectOption('Correto');
  const submit = dialog.getByRole('button', { name: 'Confirmar retificação e anular Pendência' });
  await expect(submit).toBeDisabled();
  await dialog.getByLabel(/Confirmo que estou corrigindo um lançamento/).check();
  await expect(submit).toBeDisabled();
  await dialog.getByLabel('Justificativa da retificação').fill('A conferência confirmou erro do operador; o documento original está correto.');
  await testInfo.attach('confirmacao-retificacao.png', { body: await page.screenshot(), contentType: 'image/png' });
  const formalRetificationScroll = await setStableScrollProbe(page, row);
  const rpcResponse = page.waitForResponse(response => response.url().endsWith('/rpc/retify_verification_with_pendency_cancel'));
  await submit.click();
  const response = await rpcResponse;
  expect(response.ok()).toBe(true);
  const saved = await response.json();
  expect(saved.verification.analysis.extCC).toBe('Correto');
  expect(saved.pendency.status).toBe('Cancelada');
  expect(saved.pendency.payload.cancelamento.tipo).toBe('retificacao_avaliacao');
  expect(saved.administrative_log.action).toBe('Avaliação técnica retificada');
  await expect(dialog).toBeHidden();
  await expect(row.locator('select.select-analise')).toHaveValue('Correto');
  await expectScrollPreserved(page, formalRetificationScroll);
  await expect(page.locator('#pendency-notice')).toContainText('Avaliação retificada e Pendência anulada com sucesso.');
  await expect.poll(async () => (await verification(page)).row_version).toBe(saved.verification.row_version);
  await page.reload();
  await ready(page);
  await expect(row.locator('select.select-analise')).toHaveValue('Correto');
  const persisted = await page.evaluate(async id => {
    const { data, error } = await window.RadarSessionContext.service.client.from('pendencies')
      .select('id,status,payload').eq('id', id).single();
    if (error) throw error;
    return data;
  }, saved.pendency.id);
  expect(persisted.status).toBe('Cancelada');
  expect(persisted.payload.historico.at(-1).tipo).toBe('retificacao_avaliacao');
  expect(reads.filter(url => new URL(url).pathname.endsWith('/administrative_logs'))).toEqual([]);
  for (const url of reads) {
    const parsed = new URL(url);
    if (!/\/(verifications|pendencies|registered_invoices|pendency_attempts|pendency_contacts|assets)$/.test(parsed.pathname)) continue;
    expect([...parsed.searchParams.entries()].some(([key, value]) =>
      !['select', 'order', 'limit', 'offset'].includes(key) && /(?:eq\.|in\.|and\(|or\()/.test(value)
    ), `Consulta operacional sem contexto: ${parsed.pathname}`).toBe(true);
  }
  expect(errors).toEqual([]);
});

'use strict';

const { test, expect } = require('@playwright/test');
const {
  signInAs,
  reloadAndWait,
  loadEntity,
  countEntity
} = require('../support/real-use-supabase');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável, Auth e persistência reais.');

const SCHOOL_ID = 'ESC-LOCAL';
const COMPETENCE = '2026-05';
const PROGRAM_ID = 'BASIC';
const COMP_KEY = `${COMPETENCE}_${PROGRAM_ID}`;
const VERIFICATION_ID = `${SCHOOL_ID}::${COMPETENCE}::${PROGRAM_ID}`;

async function prepareInvoiceContext(page) {
  await page.evaluate(async ({ schoolId, competence, programId, verificationId }) => {
    const client = window.RadarSessionContext?.service?.client;
    if (!client) throw new Error('Cliente Supabase autenticado ausente.');

    const schoolWrite = await client.from('schools')
      .update({ inventory_process: 'PROC-REAL-USE-2026' })
      .eq('id', schoolId);
    if (schoolWrite.error) throw schoolWrite.error;

    const template = window.buildVerificationSnapshot({});
    template.bonificacao.notaFiscal = 'Sim';
    template.bonificacao.consAssessoria = 'Não se aplica';
    template.bonificacao.encampInventario = 'Não';
    template.analise.notaFiscal = 'Não analisado';
    template.analise.consAssessoria = 'Correto';
    template.analise.encampInventario = 'Não analisado';

    const verificationWrite = await client.from('verifications').upsert({
      id: verificationId,
      school_id: schoolId,
      competence_id: competence,
      program_id: programId,
      bonification: template.bonificacao,
      analysis: template.analise,
      bonus_result: null,
      payload: {}
    });
    if (verificationWrite.error) throw verificationWrite.error;
  }, { schoolId: SCHOOL_ID, competence: COMPETENCE, programId: PROGRAM_ID, verificationId: VERIFICATION_ID });
}

async function openSchoolFromCarteira(page) {
  await page.goto('/carteira');
  const link = page.locator(`a[data-radar-route="true"][href="/escolas/${SCHOOL_ID}"]`).first();
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForFunction(schoolId => {
    const route = window.RadarNavigationHistory?.currentRoute?.(window);
    return window.RadarDataContext?.ready === true
      && route?.view === 'prontuario'
      && String(route?.param) === String(schoolId);
  }, SCHOOL_ID);

  const competenceButton = page.locator(`.comp-sub-tab[data-competence="${COMPETENCE}"]`);
  if (await competenceButton.count()) {
    await expect(competenceButton).toBeEnabled();
    if ((await competenceButton.getAttribute('aria-pressed')) !== 'true') {
      await competenceButton.click();
    }
  }

  await expect(page.locator(
    `#prontuario-verif-rows tr[data-program-id="${PROGRAM_ID}"][data-document-key="notaFiscal"]`
  )).toBeVisible();
}

function invoiceDocumentRow(page) {
  return page.locator(
    `#prontuario-verif-rows tr[data-program-id="${PROGRAM_ID}"][data-document-key="notaFiscal"]`
  );
}

test.describe.serial('Uso real — Nota Fiscal e Capital/Inventário', () => {
  test('NF permanente entra automaticamente em Aguardando Inventariação, sobrevive ao reload e pode ser inventariada', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await signInAs(page, 'controller');
    await prepareInvoiceContext(page);
    await reloadAndWait(page, 'controller');
    await openSchoolFromCarteira(page);

    const invoiceNumber = `NF-UI-REAL-${Date.now()}`;
    const row = invoiceDocumentRow(page);
    const addButton = row.getByRole('button', { name: 'Adicionar Nota', exact: true });
    await expect(addButton).toBeVisible();
    await addButton.click();

    const modal = page.locator('#modal-dados-nota');
    await expect(modal).toHaveClass(/show/);
    await modal.locator('#nota-tipo').selectOption('permanente');
    await modal.locator('#nota-numero').fill(invoiceNumber);
    await modal.locator('#nota-desc').fill('Impressora de certificação funcional por uso real');
    await modal.locator('#nota-valor').fill('2000');
    await modal.locator('#form-dados-nota button[type="submit"]').click();
    await expect(modal).not.toHaveClass(/show/);

    const persistedInvoices = await loadEntity(page, 'registeredInvoices');
    const invoice = persistedInvoices.find(item => item.invoice_number === invoiceNumber);
    expect(invoice).toBeTruthy();
    expect(invoice.expense_type).toBe('permanente');
    expect(invoice.linked_asset_id).toBeTruthy();

    const persistedAssets = await loadEntity(page, 'assets');
    const asset = persistedAssets.find(item => item.id === invoice.linked_asset_id);
    expect(asset).toBeTruthy();
    expect(asset.invoice_number).toBe(invoiceNumber);
    expect(asset.status).toBe('Encaminhada');

    const persistedVerifications = await loadEntity(page, 'verifications');
    const verification = persistedVerifications.find(item => item.id === VERIFICATION_ID);
    expect(verification?.bonification?.encampInventario).toBe('Sim');
    expect(verification?.analysis?.encampInventario).toBe('Não analisado');

    await reloadAndWait(page, 'controller');
    await openSchoolFromCarteira(page);
    await expect(invoiceDocumentRow(page).getByText(invoiceNumber, { exact: false })).toBeVisible();

    const inventoryRow = page.locator(
      `#prontuario-verif-rows tr[data-program-id="${PROGRAM_ID}"][data-document-key="encampInventario"]`
    );
    await expect(inventoryRow.getByText(invoiceNumber, { exact: false })).toBeVisible();
    await expect(inventoryRow.getByText('Encaminhada', { exact: true })).toBeVisible();

    await page.locator('#nav-inventario').click();
    await expect(page.getByText(invoiceNumber, { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Aguardando Inventariação', { exact: true }).first()).toBeVisible();

    const assetContainer = page.locator(`[data-asset-id="${invoice.linked_asset_id}"]`).first();
    const target = (await assetContainer.count())
      ? assetContainer
      : page.getByText(invoiceNumber, { exact: false }).first()
        .locator('xpath=ancestor::*[self::tr or contains(@class,"card")][1]');
    const inventoryButton = target.getByRole('button', { name: /Inventariar|Marcar como Inventariado/i });
    await expect(inventoryButton).toBeVisible();
    await inventoryButton.click();

    const inventoryModal = page.locator('#modal-inventario-confirm');
    await expect(inventoryModal).toHaveClass(/show/);
    const responsible = inventoryModal.locator('#inventario-responsavel');
    if (await responsible.count()) await responsible.fill('Inventariador de certificação real');
    const notes = inventoryModal.locator('#inventario-obs');
    if (await notes.count()) await notes.fill('Inventariação executada pela jornada real.');
    await inventoryModal.locator('#form-inventario-confirm button[type="submit"]').click();
    await expect(inventoryModal).not.toHaveClass(/show/);

    await expect.poll(async () => {
      const rows = await loadEntity(page, 'assets');
      return rows.find(item => item.id === invoice.linked_asset_id)?.status;
    }).toBe('Inventariada');

    await reloadAndWait(page, 'controller');
    await page.locator('#nav-inventario').click();
    await expect(page.getByText(invoiceNumber, { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Inventariada', { exact: true }).first()).toBeVisible();

    expect(await countEntity(page, 'registeredInvoices', { invoice_number: invoiceNumber })).toBe(1);
  });
});

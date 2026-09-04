'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável, Auth e persistência reais.');

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

async function signInController(page) {
  const fixture = fixtures.find(item => item.profileId === 'controller' && item.active);
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.invoices)
  ));
}

async function waitForRestore(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.invoices)
  ));
}

async function prepareVerification(page) {
  return page.evaluate(async () => {
    const client = window.RadarSessionContext.service.client;
    const schoolId = 'ESC-OTHER';
    const competence = '2026-05';
    const programId = 'BASIC';
    const compKey = `${competence}_${programId}`;
    const verificationId = `${schoolId}::${competence}::${programId}`;
    const template = window.buildVerificationSnapshot({});
    template.bonificacao.notaFiscal = 'Sim';
    const write = await client.from('verifications').upsert({
      id: verificationId,
      school_id: schoolId,
      competence_id: competence,
      program_id: programId,
      bonification: template.bonificacao,
      analysis: template.analise,
      bonus_result: null,
      payload: {}
    }).select('*').single();
    if (write.error) throw write.error;

    verificacoes[schoolId] = verificacoes[schoolId] || {};
    const local = window.buildVerificationSnapshot({
      bonificacao: write.data.bonification,
      analise: write.data.analysis,
      resultadoBonif: write.data.bonus_result || ''
    });
    local.rowVersion = write.data.row_version;
    verificacoes[schoolId][compKey] = local;

    return { schoolId, competence, programId, compKey, verificationId };
  });
}

test('criar, editar, converter, reverter e excluir Nota Fiscal permanece correto após cada recarga', async ({ page }) => {
  await signInController(page);
  const context = await prepareVerification(page);
  const stamp = Date.now();

  const created = await page.evaluate(async input => {
    const saved = await window.RadarApplicationServices.invoices.save({
      schoolId: input.schoolId,
      compKey: input.compKey,
      description: 'Material de consumo confiabilidade',
      expenseType: 'consumo',
      invoiceNumber: `NF-CONS-${input.stamp}`,
      amount: 123.45,
      profile: 'controlador'
    });
    return {
      id: saved.value.invoice.id,
      invoiceNumber: saved.value.invoice.numero,
      assetId: saved.value.invoice.bemId || null
    };
  }, { ...context, stamp });

  expect(created.assetId).toBeNull();

  const remoteCreated = await page.evaluate(async id => {
    const repository = window.RadarApplicationServices.data.repository;
    const [invoices, assets] = await Promise.all([
      repository.load('registeredInvoices'),
      repository.load('assets')
    ]);
    const invoice = invoices.find(item => item.id === id);
    return {
      description: invoice?.description,
      amount: Number(invoice?.amount),
      expenseType: invoice?.expense_type,
      linkedAssetId: invoice?.linked_asset_id || null,
      assetExists: assets.some(item => item.id === invoice?.linked_asset_id)
    };
  }, created.id);
  expect(remoteCreated).toEqual({
    description: 'Material de consumo confiabilidade',
    amount: 123.45,
    expenseType: 'consumo',
    linkedAssetId: null,
    assetExists: false
  });

  await page.reload();
  await waitForRestore(page);
  expect(await page.evaluate(id => {
    const invoice = notasRegistradas.find(item => item.id === id);
    return { description: invoice?.desc, amount: Number(invoice?.valor), type: invoice?.tipo };
  }, created.id)).toEqual({
    description: 'Material de consumo confiabilidade',
    amount: 123.45,
    type: 'consumo'
  });

  await page.evaluate(async ({ id, ...input }) => {
    await window.RadarApplicationServices.invoices.save({
      id,
      schoolId: input.schoolId,
      compKey: input.compKey,
      description: 'Material de consumo editado',
      expenseType: 'consumo',
      invoiceNumber: `NF-CONS-EDIT-${input.stamp}`,
      amount: 456.78,
      profile: 'controlador'
    });
  }, { ...context, id: created.id, stamp });

  let remote = await page.evaluate(async id => {
    const invoices = await window.RadarApplicationServices.data.repository.load('registeredInvoices');
    const invoice = invoices.find(item => item.id === id);
    return {
      description: invoice?.description,
      number: invoice?.invoice_number,
      amount: Number(invoice?.amount),
      type: invoice?.expense_type
    };
  }, created.id);
  expect(remote).toEqual({
    description: 'Material de consumo editado',
    number: `NF-CONS-EDIT-${stamp}`,
    amount: 456.78,
    type: 'consumo'
  });

  await page.reload();
  await waitForRestore(page);

  const permanent = await page.evaluate(async ({ id, ...input }) => {
    const saved = await window.RadarApplicationServices.invoices.save({
      id,
      schoolId: input.schoolId,
      compKey: input.compKey,
      description: 'Notebook convertido para patrimônio',
      expenseType: 'permanente',
      invoiceNumber: `NF-PERM-${input.stamp}`,
      amount: 3000,
      profile: 'controlador'
    });
    return { assetId: saved.value.asset.id, invoiceAssetId: saved.value.invoice.bemId };
  }, { ...context, id: created.id, stamp });
  expect(permanent.assetId).toBeTruthy();
  expect(permanent.invoiceAssetId).toBe(permanent.assetId);

  remote = await page.evaluate(async ({ id, assetId }) => {
    const repository = window.RadarApplicationServices.data.repository;
    const [invoices, assets, verifications] = await Promise.all([
      repository.load('registeredInvoices'),
      repository.load('assets'),
      repository.load('verifications')
    ]);
    const invoice = invoices.find(item => item.id === id);
    const asset = assets.find(item => item.id === assetId);
    const verification = verifications.find(item => item.id === 'ESC-OTHER::2026-05::BASIC');
    return {
      type: invoice?.expense_type,
      linkedAssetId: invoice?.linked_asset_id,
      assetStatus: asset?.status,
      assetNumber: asset?.invoice_number,
      inventoryDelivery: verification?.bonification?.encampInventario
    };
  }, { id: created.id, assetId: permanent.assetId });
  expect(remote).toEqual({
    type: 'permanente',
    linkedAssetId: permanent.assetId,
    assetStatus: 'Encaminhada',
    assetNumber: `NF-PERM-${stamp}`,
    inventoryDelivery: 'Sim'
  });

  await page.reload();
  await waitForRestore(page);
  expect(await page.evaluate(({ id, assetId }) => ({
    type: notasRegistradas.find(item => item.id === id)?.tipo,
    linkedAssetId: notasRegistradas.find(item => item.id === id)?.bemId,
    assetStatus: bens.find(item => item.id === assetId)?.status
  }), { id: created.id, assetId: permanent.assetId })).toEqual({
    type: 'permanente',
    linkedAssetId: permanent.assetId,
    assetStatus: 'Encaminhada'
  });

  await page.evaluate(async ({ id, ...input }) => {
    await window.RadarApplicationServices.invoices.save({
      id,
      schoolId: input.schoolId,
      compKey: input.compKey,
      description: 'Material revertido para consumo',
      expenseType: 'consumo',
      invoiceNumber: `NF-CONS-BACK-${input.stamp}`,
      amount: 500,
      profile: 'controlador'
    });
  }, { ...context, id: created.id, stamp });

  remote = await page.evaluate(async ({ id, oldAssetId }) => {
    const repository = window.RadarApplicationServices.data.repository;
    const [invoices, assets] = await Promise.all([
      repository.load('registeredInvoices'),
      repository.load('assets')
    ]);
    const invoice = invoices.find(item => item.id === id);
    return {
      type: invoice?.expense_type,
      linkedAssetId: invoice?.linked_asset_id || null,
      oldAssetStillExists: assets.some(item => item.id === oldAssetId)
    };
  }, { id: created.id, oldAssetId: permanent.assetId });
  expect(remote).toEqual({ type: 'consumo', linkedAssetId: null, oldAssetStillExists: false });

  await page.reload();
  await waitForRestore(page);
  expect(await page.evaluate(({ id, oldAssetId }) => ({
    type: notasRegistradas.find(item => item.id === id)?.tipo,
    linkedAssetId: notasRegistradas.find(item => item.id === id)?.bemId || null,
    oldAssetStillExists: bens.some(item => item.id === oldAssetId)
  }), { id: created.id, oldAssetId: permanent.assetId })).toEqual({
    type: 'consumo', linkedAssetId: null, oldAssetStillExists: false
  });

  await page.evaluate(async ({ id, schoolId }) => {
    await window.RadarApplicationServices.invoices.remove({
      id,
      schoolId,
      profile: 'controlador'
    });
  }, { id: created.id, schoolId: context.schoolId });

  expect(await page.evaluate(async id => {
    const invoices = await window.RadarApplicationServices.data.repository.load('registeredInvoices');
    return invoices.some(item => item.id === id);
  }, created.id)).toBe(false);

  await page.reload();
  await waitForRestore(page);
  expect(await page.evaluate(id => notasRegistradas.some(item => item.id === id), created.id)).toBe(false);
});

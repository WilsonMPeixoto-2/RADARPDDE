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
  if (!fixture) throw new Error('Fixture ativa de Controlador ausente.');
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.invoices)
    && Boolean(window.RadarApplicationServices?.inventory)
  ));
}

async function waitForRestoredController(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.invoices)
    && Boolean(window.RadarApplicationServices?.inventory)
  ));
}

test.describe.serial('Confiabilidade funcional com Supabase real descartável', () => {
  test('Nota Fiscal permanente permanece sincronizada com Inventário e Prontuário após cada recarga', async ({ page }) => {
    await signInController(page);

    const created = await page.evaluate(async () => {
      const services = window.RadarApplicationServices;
      const client = window.RadarSessionContext?.service?.client;
      if (!client) throw new Error('Cliente Supabase autenticado ausente.');

      const schoolId = 'ESC-LOCAL';
      const competence = '2026-05';
      const programId = 'BASIC';
      const compKey = `${competence}_${programId}`;
      const verificationId = `${schoolId}::${competence}::${programId}`;
      const stamp = Date.now();
      const invoiceNumber = `NF-RELIABILITY-${stamp}`;

      const schoolUpdate = await client.from('schools')
        .update({ inventory_process: '' })
        .eq('id', schoolId);
      if (schoolUpdate.error) throw schoolUpdate.error;

      const verificationTemplate = window.buildVerificationSnapshot({});
      verificationTemplate.bonificacao.notaFiscal = 'Sim';
      const verificationWrite = await client.from('verifications').upsert({
        id: verificationId,
        school_id: schoolId,
        competence_id: competence,
        program_id: programId,
        bonification: verificationTemplate.bonificacao,
        analysis: verificationTemplate.analise,
        bonus_result: null,
        payload: {}
      }).select('*').single();
      if (verificationWrite.error) throw verificationWrite.error;

      const school = escolas.find(item => item.id === schoolId);
      if (!school) throw new Error('Escola local não carregada.');
      school.processoInventario = '';
      verificacoes[schoolId] = verificacoes[schoolId] || {};
      const localVerification = window.buildVerificationSnapshot({
        bonificacao: verificationWrite.data.bonification,
        analise: verificationWrite.data.analysis,
        resultadoBonif: verificationWrite.data.bonus_result || ''
      });
      localVerification.rowVersion = verificationWrite.data.row_version;
      verificacoes[schoolId][compKey] = localVerification;

      const saved = await services.invoices.save({
        schoolId,
        compKey,
        description: 'Impressora de confiabilidade funcional',
        expenseType: 'permanente',
        invoiceNumber,
        amount: 2000,
        profile: 'controlador'
      });
      if (!saved?.ok) throw new Error('Cadastro da Nota Fiscal permanente não retornou sucesso.');

      return {
        schoolId,
        competence,
        programId,
        compKey,
        verificationId,
        invoiceId: saved.value.invoice.id,
        assetId: saved.value.asset.id,
        invoiceNumber
      };
    });

    const persistedAfterCreate = await page.evaluate(async context => {
      const repository = window.RadarApplicationServices.data.repository;
      const [invoices, assets, verifications] = await Promise.all([
        repository.load('registeredInvoices'),
        repository.load('assets'),
        repository.load('verifications')
      ]);
      const invoice = invoices.find(item => item.id === context.invoiceId);
      const asset = assets.find(item => item.id === context.assetId);
      const verification = verifications.find(item => item.id === context.verificationId);
      return {
        invoiceNumber: invoice?.invoice_number,
        linkedAssetId: invoice?.linked_asset_id,
        assetInvoiceNumber: asset?.invoice_number,
        assetStatus: asset?.status,
        inventoryProcess: asset?.inventory_process,
        inventoryDelivery: verification?.bonification?.encampInventario,
        inventoryAnalysis: verification?.analysis?.encampInventario
      };
    }, created);

    expect(persistedAfterCreate).toEqual({
      invoiceNumber: created.invoiceNumber,
      linkedAssetId: created.assetId,
      assetInvoiceNumber: created.invoiceNumber,
      assetStatus: 'Não encaminhada',
      inventoryProcess: '',
      inventoryDelivery: 'Não',
      inventoryAnalysis: 'Não analisado'
    });

    await page.reload();
    await waitForRestoredController(page);

    const restoredAfterCreate = await page.evaluate(context => {
      const invoice = notasRegistradas.find(item => item.id === context.invoiceId);
      const asset = bens.find(item => item.id === context.assetId);
      const verification = verificacoes[context.schoolId]?.[context.compKey];
      return {
        invoiceNumber: invoice?.numero,
        linkedAssetId: invoice?.bemId,
        assetInvoiceNumber: asset?.notaFiscal,
        assetStatus: asset?.status,
        inventoryDelivery: verification?.bonificacao?.encampInventario
      };
    }, created);

    expect(restoredAfterCreate).toEqual({
      invoiceNumber: created.invoiceNumber,
      linkedAssetId: created.assetId,
      assetInvoiceNumber: created.invoiceNumber,
      assetStatus: 'Não encaminhada',
      inventoryDelivery: 'Não'
    });

    const prematureInventory = await page.evaluate(async context => {
      try {
        await window.RadarApplicationServices.inventory.inventory({
          assetId: context.assetId,
          responsible: 'Inventariador de teste',
          responsibleId: 'inventory-local',
          notes: 'Tentativa antes do encaminhamento.',
          profile: 'controlador'
        });
        return { accepted: true, code: null };
      } catch (error) {
        return { accepted: false, code: error?.code || null };
      }
    }, created);
    expect(prematureInventory).toEqual({ accepted: false, code: 'ASSET_NOT_FORWARDED' });

    const linkedEdit = await page.evaluate(async context => {
      const repository = window.RadarApplicationServices.data.repository;
      const beforeAssets = await repository.load('assets');
      const before = beforeAssets.find(item => item.id === context.assetId)?.invoice_number;
      try {
        await window.RadarApplicationServices.inventory.updateAsset({
          assetId: context.assetId,
          field: 'notaFiscal',
          value: `${context.invoiceNumber}-ALTERADA`,
          profile: 'controlador'
        });
        return { accepted: true, code: null, before, after: null };
      } catch (error) {
        const afterAssets = await repository.load('assets');
        const after = afterAssets.find(item => item.id === context.assetId)?.invoice_number;
        return { accepted: false, code: error?.code || null, before, after };
      }
    }, created);
    expect(linkedEdit.accepted).toBe(false);
    expect(linkedEdit.code).toBe('LINKED_INVOICE_FIELD_LOCKED');
    expect(linkedEdit.after).toBe(linkedEdit.before);

    const forwarded = await page.evaluate(async context => {
      const client = window.RadarSessionContext.service.client;
      const process = 'PROC-RELIABILITY-2026';
      const schoolUpdate = await client.from('schools')
        .update({ inventory_process: process })
        .eq('id', context.schoolId);
      if (schoolUpdate.error) throw schoolUpdate.error;
      const school = escolas.find(item => item.id === context.schoolId);
      school.processoInventario = process;

      const result = await window.RadarApplicationServices.inventory.forward({
        assetId: context.assetId,
        profile: 'controlador'
      });
      return {
        assetStatus: result.value.asset.status,
        inventoryDelivery: result.value.inventoryDelivery
      };
    }, created);
    expect(forwarded).toEqual({ assetStatus: 'Encaminhada', inventoryDelivery: 'Sim' });

    const persistedAfterForward = await page.evaluate(async context => {
      const repository = window.RadarApplicationServices.data.repository;
      const [assets, verifications] = await Promise.all([
        repository.load('assets'),
        repository.load('verifications')
      ]);
      const asset = assets.find(item => item.id === context.assetId);
      const verification = verifications.find(item => item.id === context.verificationId);
      return {
        assetStatus: asset?.status,
        inventoryProcess: asset?.inventory_process,
        inventoryDelivery: verification?.bonification?.encampInventario,
        inventoryAnalysis: verification?.analysis?.encampInventario
      };
    }, created);
    expect(persistedAfterForward).toEqual({
      assetStatus: 'Encaminhada',
      inventoryProcess: 'PROC-RELIABILITY-2026',
      inventoryDelivery: 'Sim',
      inventoryAnalysis: 'Não analisado'
    });

    await page.reload();
    await waitForRestoredController(page);
    expect(await page.evaluate(context => ({
      assetStatus: bens.find(item => item.id === context.assetId)?.status,
      inventoryDelivery: verificacoes[context.schoolId]?.[context.compKey]?.bonificacao?.encampInventario
    }), created)).toEqual({ assetStatus: 'Encaminhada', inventoryDelivery: 'Sim' });

    await page.evaluate(async context => {
      await window.RadarApplicationServices.inventory.inventory({
        assetId: context.assetId,
        responsible: 'Inventariador de teste',
        responsibleId: 'inventory-local',
        notes: 'Conferido após encaminhamento.',
        profile: 'controlador'
      });
    }, created);

    const persistedAfterInventory = await page.evaluate(async context => {
      const repository = window.RadarApplicationServices.data.repository;
      const assets = await repository.load('assets');
      const asset = assets.find(item => item.id === context.assetId);
      return {
        status: asset?.status,
        responsibleId: asset?.inventoried_by_member_id,
        inventoriedAt: asset?.inventoried_at
      };
    }, created);
    expect(persistedAfterInventory.status).toBe('Inventariada');
    expect(persistedAfterInventory.responsibleId).toBe('inventory-local');
    expect(persistedAfterInventory.inventoriedAt).toBeTruthy();

    await page.reload();
    await waitForRestoredController(page);
    expect(await page.evaluate(context => ({
      status: bens.find(item => item.id === context.assetId)?.status,
      invoiceNumber: notasRegistradas.find(item => item.id === context.invoiceId)?.numero,
      inventoryDelivery: verificacoes[context.schoolId]?.[context.compKey]?.bonificacao?.encampInventario
    }), created)).toEqual({
      status: 'Inventariada',
      invoiceNumber: created.invoiceNumber,
      inventoryDelivery: 'Sim'
    });
  });
});

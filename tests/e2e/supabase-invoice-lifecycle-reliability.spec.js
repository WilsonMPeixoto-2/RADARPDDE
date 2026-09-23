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

async function prepareIdentificationVerification(page, programId) {
  return page.evaluate(async inputProgramId => {
    const client = window.RadarSessionContext.service.client;
    const schoolId = 'ESC-UAT';
    const competence = '2026-05';
    const compKey = `${competence}_${inputProgramId}`;
    const verificationId = `${schoolId}::${competence}::${inputProgramId}`;
    const template = window.buildVerificationSnapshot({});
    template.bonificacao.notaFiscal = 'Não';
    template.analise.notaFiscal = 'Não analisado';

    const write = await client.from('verifications').upsert({
      id: verificationId,
      school_id: schoolId,
      competence_id: competence,
      program_id: inputProgramId,
      bonification: template.bonificacao,
      analysis: template.analise,
      bonus_result: null,
      payload: {}
    }).select('*').single();
    if (write.error) throw write.error;

    verificacoes[schoolId] ||= {};
    const local = window.buildVerificationSnapshot({
      bonificacao: write.data.bonification,
      analise: write.data.analysis,
      resultadoBonif: write.data.bonus_result || ''
    });
    local.rowVersion = write.data.row_version;
    verificacoes[schoolId][compKey] = local;

    const school = escolas.find(item => item.id === schoolId);
    if (!school) throw new Error('ESC-UAT não carregada no contexto autenticado.');

    return {
      schoolId,
      competence,
      programId: inputProgramId,
      compKey,
      verificationId,
      inventoryProcess: school.processoInventario || ''
    };
  }, programId);
}

async function createUnidentifiedRemote(page, context, { description, amount }) {
  return page.evaluate(async ({ context: inputContext, description: inputDescription, amount: inputAmount }) => {
    const created = await window.RadarApplicationServices.invoices.saveUnidentifiedExpenseWithPendency({
      schoolId: inputContext.schoolId,
      compKey: inputContext.compKey,
      description: inputDescription,
      expenseType: 'a_identificar',
      invoiceNumber: '',
      amount: inputAmount,
      profile: 'controlador',
      pendencyObservation: 'Aguardando documento fiscal para identificação.'
    });
    rebuildOperationalIndexes();
    switchView('pendencias');
    return {
      invoiceId: created.value.invoice.id,
      pendencyId: created.value.pendency.id
    };
  }, { context, description, amount });
}

async function identifyRemoteThroughModal(page, ids, {
  expenseType,
  invoiceNumber,
  description,
  amount,
  expectDialog = null
}) {
  expect(await page.evaluate(
    pendencyId => abrirModalRegistrarNovoEnvio(pendencyId),
    ids.pendencyId
  )).toBe(true);

  const modal = page.locator('#modal-registrar-envio');
  await expect(modal).toHaveClass(/show/);

  let dialogMessage = '';
  if (expectDialog) {
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });
  }

  await modal.getByLabel('Tipo da despesa', { exact: true }).selectOption(expenseType);
  await modal.getByLabel('Número ou referência do documento', { exact: true }).fill(invoiceNumber);
  await modal.getByLabel('Descrição', { exact: true }).fill(description);
  await modal.getByLabel('Valor (R$)', { exact: true }).fill(String(amount));
  await modal.getByLabel(
    'Data em que o arquivo foi disponibilizado no Drive',
    { exact: true }
  ).fill('2026-09-23');
  await modal.getByLabel('Observação', { exact: true }).fill('Documento fiscal apresentado.');
  await modal.getByRole('button', {
    name: 'Registrar e enviar para reanálise',
    exact: true
  }).click();
  await expect(modal).not.toHaveClass(/show/);

  if (expectDialog) expect(dialogMessage).toContain(expectDialog);
}

async function readRemoteIdentification(page, { invoiceId, pendencyId, verificationId }) {
  return page.evaluate(async input => {
    const repository = window.RadarApplicationServices.data.repository;
    const [invoices, assets, pendencies, attempts, verifications] = await Promise.all([
      repository.load('registeredInvoices'),
      repository.load('assets'),
      repository.load('pendencies'),
      repository.load('pendencyAttempts'),
      repository.load('verifications')
    ]);
    const invoice = invoices.find(item => item.id === input.invoiceId);
    const pendency = pendencies.find(item => item.id === input.pendencyId);
    const asset = invoice?.linked_asset_id
      ? assets.find(item => item.id === invoice.linked_asset_id)
      : null;
    const verification = verifications.find(item => item.id === input.verificationId);
    return {
      invoice: invoice ? {
        id: invoice.id,
        type: invoice.expense_type,
        number: invoice.invoice_number,
        description: invoice.description,
        amount: Number(invoice.amount),
        linkedAssetId: invoice.linked_asset_id || null,
        analysis: invoice.payload?.analiseDocumentoFiscal || null,
        advisorySent: Object.hasOwn(invoice.payload || {}, 'consultaAssessoriaEnviada')
          ? invoice.payload.consultaAssessoriaEnviada
          : null,
        advisoryAnalysis: Object.hasOwn(invoice.payload || {}, 'analiseConsultaAssessoria')
          ? invoice.payload.analiseConsultaAssessoria
          : null
      } : null,
      pendency: pendency ? {
        id: pendency.id,
        status: pendency.status,
        invoiceId: pendency.registered_invoice_id
      } : null,
      attempts: attempts.filter(item => item.pendency_id === input.pendencyId).length,
      asset: asset ? {
        id: asset.id,
        description: asset.description,
        type: asset.expense_type,
        amount: Number(asset.amount),
        invoiceNumber: asset.invoice_number,
        status: asset.status,
        inventoryProcess: asset.inventory_process || ''
      } : null,
      verification: verification ? {
        advisoryDelivery: verification.bonification?.consAssessoria,
        advisorySent: verification.bonification?.consEnviada,
        advisoryAnalysis: verification.analysis?.consAssessoria,
        inventoryDelivery: verification.bonification?.encampInventario,
        inventoryAnalysis: verification.analysis?.encampInventario,
        invoiceAnalysis: verification.analysis?.notaFiscal
      } : null
    };
  }, { invoiceId, pendencyId, verificationId });
}

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


test('matriz a_identificar persiste consumo, serviço, permanente e boleto com RPC real e recarga', async ({ page }) => {
  await signInController(page);
  const basic = await prepareIdentificationVerification(page, 'BASIC');
  const connected = await prepareIdentificationVerification(page, 'CONECTADA');
  expect(basic.inventoryProcess).toBeTruthy();

  const consumo = await createUnidentifiedRemote(page, basic, {
    description: 'Débito consumo não identificado',
    amount: 101.25
  });
  await identifyRemoteThroughModal(page, consumo, {
    expenseType: 'consumo',
    invoiceNumber: 'NF-MATRIX-CONS',
    description: 'Material de consumo identificado',
    amount: 101.25
  });
  let remote = await readRemoteIdentification(page, {
    ...consumo,
    verificationId: basic.verificationId
  });
  expect(remote.invoice).toMatchObject({
    id: consumo.invoiceId,
    type: 'consumo',
    number: 'NF-MATRIX-CONS',
    description: 'Material de consumo identificado',
    amount: 101.25,
    linkedAssetId: null,
    analysis: 'Não analisado'
  });
  expect(remote.pendency).toEqual({
    id: consumo.pendencyId,
    status: 'Aguardando reanálise',
    invoiceId: consumo.invoiceId
  });
  expect(remote.attempts).toBe(1);
  expect(remote.asset).toBeNull();

  const servico = await createUnidentifiedRemote(page, basic, {
    description: 'Débito serviço não identificado',
    amount: 202.5
  });
  await identifyRemoteThroughModal(page, servico, {
    expenseType: 'servico',
    invoiceNumber: 'NF-MATRIX-SERV',
    description: 'Serviço de limpeza identificado',
    amount: 202.5,
    expectDialog: 'Consulta à Assessoria passa a ser exigida'
  });
  remote = await readRemoteIdentification(page, {
    ...servico,
    verificationId: basic.verificationId
  });
  expect(remote.invoice).toMatchObject({
    id: servico.invoiceId,
    type: 'servico',
    number: 'NF-MATRIX-SERV',
    description: 'Serviço de limpeza identificado',
    amount: 202.5,
    linkedAssetId: null,
    analysis: 'Não analisado',
    advisorySent: false,
    advisoryAnalysis: 'Não analisado'
  });
  expect(remote.pendency.status).toBe('Aguardando reanálise');
  expect(remote.attempts).toBe(1);
  expect(remote.verification.advisoryDelivery).toBe('Não');
  expect(remote.verification.advisorySent).toBe(false);
  expect(remote.verification.advisoryAnalysis).toBe('Não analisado');

  const permanente = await createUnidentifiedRemote(page, basic, {
    description: 'Débito patrimônio não identificado',
    amount: 303.75
  });
  await identifyRemoteThroughModal(page, permanente, {
    expenseType: 'permanente',
    invoiceNumber: 'NF-MATRIX-PERM',
    description: 'CAIXAS DE SOM',
    amount: 303.75
  });
  remote = await readRemoteIdentification(page, {
    ...permanente,
    verificationId: basic.verificationId
  });
  expect(remote.invoice).toMatchObject({
    id: permanente.invoiceId,
    type: 'permanente',
    number: 'NF-MATRIX-PERM',
    description: 'CAIXAS DE SOM',
    amount: 303.75,
    linkedAssetId: expect.any(String),
    analysis: 'Não analisado'
  });
  expect(remote.asset).toEqual({
    id: remote.invoice.linkedAssetId,
    description: 'PDDE Básico - CAIXAS DE SOM',
    type: 'permanente',
    amount: 303.75,
    invoiceNumber: 'NF-MATRIX-PERM',
    status: 'Encaminhada',
    inventoryProcess: basic.inventoryProcess
  });
  expect(remote.pendency.status).toBe('Aguardando reanálise');
  expect(remote.attempts).toBe(1);
  expect(remote.verification.inventoryDelivery).toBe('Sim');
  expect(remote.verification.inventoryAnalysis).toBe('Não analisado');

  const boleto = await createUnidentifiedRemote(page, connected, {
    description: 'Débito conectividade não identificado',
    amount: 179.9
  });
  expect(await page.evaluate(
    pendencyId => abrirModalRegistrarNovoEnvio(pendencyId),
    boleto.pendencyId
  )).toBe(true);
  const modal = page.locator('#modal-registrar-envio');
  const boletoOption = modal.locator('#envio-identificacao-tipo option[value="boleto_internet"]');
  expect(await boletoOption.evaluate(option => option.hidden)).toBe(false);
  await expect(boletoOption).toBeEnabled();
  await modal.getByLabel('Tipo da despesa', { exact: true }).selectOption('boleto_internet');
  await modal.getByLabel('Número ou referência do documento', { exact: true }).fill('BOL-MATRIX-EC');
  await modal.getByLabel('Descrição', { exact: true }).fill('Acesso mensal à Internet');
  await modal.getByLabel('Valor (R$)', { exact: true }).fill('179.90');
  await modal.getByLabel(
    'Data em que o arquivo foi disponibilizado no Drive',
    { exact: true }
  ).fill('2026-09-23');
  await modal.getByLabel('Observação', { exact: true }).fill('Boleto identificado.');
  await modal.getByRole('button', {
    name: 'Registrar e enviar para reanálise',
    exact: true
  }).click();
  await expect(modal).not.toHaveClass(/show/);

  remote = await readRemoteIdentification(page, {
    ...boleto,
    verificationId: connected.verificationId
  });
  expect(remote.invoice).toMatchObject({
    id: boleto.invoiceId,
    type: 'boleto_internet',
    number: 'BOL-MATRIX-EC',
    description: 'Acesso mensal à Internet',
    amount: 179.9,
    linkedAssetId: null,
    analysis: 'Não analisado',
    advisorySent: null,
    advisoryAnalysis: null
  });
  expect(remote.pendency.status).toBe('Aguardando reanálise');
  expect(remote.attempts).toBe(1);
  expect(remote.asset).toBeNull();

  const invalidBill = await createUnidentifiedRemote(page, basic, {
    description: 'Débito básico para teste de boleto inválido',
    amount: 88.8
  });
  expect(await page.evaluate(
    pendencyId => abrirModalRegistrarNovoEnvio(pendencyId),
    invalidBill.pendencyId
  )).toBe(true);
  const invalidOption = page.locator(
    '#modal-registrar-envio #envio-identificacao-tipo option[value="boleto_internet"]'
  );
  expect(await invalidOption.evaluate(option => option.hidden)).toBe(true);
  await expect(invalidOption).toBeDisabled();
  await page.evaluate(() => closeRegistrarNovoEnvioModal());

  const rejected = await page.evaluate(async pendencyId => {
    try {
      await radarPendencyService.registerAttempt({
        pendencyId,
        availabilityDate: '2026-09-23',
        observation: 'Tentativa inválida.',
        identification: {
          expenseType: 'boleto_internet',
          invoiceNumber: 'BOL-FORA-CONECTADA',
          description: 'Boleto fora da Educação Conectada',
          amount: 88.8
        }
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        code: error?.code || null,
        message: error?.message || ''
      };
    }
  }, invalidBill.pendencyId);
  expect(rejected).toMatchObject({
    ok: false,
    code: 'DOCUMENT_NOT_APPLICABLE'
  });

  remote = await readRemoteIdentification(page, {
    ...invalidBill,
    verificationId: basic.verificationId
  });
  expect(remote.invoice).toMatchObject({
    id: invalidBill.invoiceId,
    type: 'a_identificar',
    number: '',
    description: 'Débito básico para teste de boleto inválido',
    amount: 88.8,
    linkedAssetId: null,
    analysis: 'Incorreto'
  });
  expect(remote.pendency.status).toBe('Aberta');
  expect(remote.attempts).toBe(0);

  await page.reload();
  await waitForRestore(page);

  const restored = await page.evaluate(ids => {
    const invoice = id => notasRegistradas.find(item => item.id === id);
    const pendency = id => pendencias.find(item => item.id === id);
    const permanentInvoice = invoice(ids.permanente.invoiceId);
    const asset = permanentInvoice?.bemId
      ? bens.find(item => item.id === permanentInvoice.bemId)
      : null;
    return {
      consumo: {
        type: invoice(ids.consumo.invoiceId)?.tipo,
        status: pendency(ids.consumo.pendencyId)?.status
      },
      servico: {
        type: invoice(ids.servico.invoiceId)?.tipo,
        advisory: invoice(ids.servico.invoiceId)?.analiseConsultaAssessoria,
        status: pendency(ids.servico.pendencyId)?.status
      },
      permanente: {
        type: permanentInvoice?.tipo,
        assetStatus: asset?.status,
        assetDescription: asset?.descricao || asset?.item,
        status: pendency(ids.permanente.pendencyId)?.status
      },
      boleto: {
        type: invoice(ids.boleto.invoiceId)?.tipo,
        status: pendency(ids.boleto.pendencyId)?.status
      },
      invalidBill: {
        type: invoice(ids.invalidBill.invoiceId)?.tipo,
        status: pendency(ids.invalidBill.pendencyId)?.status
      }
    };
  }, { consumo, servico, permanente, boleto, invalidBill });

  expect(restored).toEqual({
    consumo: { type: 'consumo', status: 'Aguardando reanálise' },
    servico: {
      type: 'servico',
      advisory: 'Não analisado',
      status: 'Aguardando reanálise'
    },
    permanente: {
      type: 'permanente',
      assetStatus: 'Encaminhada',
      assetDescription: 'PDDE Básico - CAIXAS DE SOM',
      status: 'Aguardando reanálise'
    },
    boleto: { type: 'boleto_internet', status: 'Aguardando reanálise' },
    invalidBill: { type: 'a_identificar', status: 'Aberta' }
  });
});

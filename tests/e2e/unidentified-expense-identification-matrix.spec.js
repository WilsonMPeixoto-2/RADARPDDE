'use strict';

const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

async function createUnidentified(page, {
  programId = 'BASIC',
  description,
  amount,
  requireInventoryProcess = false
}) {
  return page.evaluate(async input => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes(input.programId)
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
      && (!input.requireInventoryProcess || Boolean(String(candidate.processoInventario || '').trim()))
    ));
    if (!escola) {
      throw new Error(`Fixture sem escola disponível para ${input.programId}.`);
    }

    const compKey = `${competencia}_${input.programId}`;
    verificacoes[escola.id] ||= {};
    const verification = RadarFluxoOperacional.createEmptyVerification();
    verification.bonificacao.notaFiscal = 'Não';
    verification.analise.notaFiscal = 'Não analisado';
    verificacoes[escola.id][compKey] = verification;

    const assetCountBefore = bens.filter(asset => (
      asset.escolaId === escola.id
      && (asset.competencia || asset.competenciaKey) === competencia
    )).length;

    const created = await window.RadarApplicationServices.invoices.saveUnidentifiedExpenseWithPendency({
      schoolId: escola.id,
      compKey,
      description: input.description,
      expenseType: 'a_identificar',
      invoiceNumber: '',
      amount: input.amount,
      profile: 'controlador',
      pendencyObservation: 'Aguardando documento fiscal para identificação.'
    });

    rebuildOperationalIndexes();
    switchView('pendencias');

    return {
      escolaId: escola.id,
      escolaNome: escola.denominação || escola.denominacao || escola.id,
      processoInventario: escola.processoInventario || '',
      competencia,
      compKey,
      programId: input.programId,
      invoiceId: created.value.invoice.id,
      pendencyId: created.value.pendency.id,
      assetCountBefore
    };
  }, { programId, description, amount, requireInventoryProcess });
}

async function identifyThroughModal(page, context, {
  expenseType,
  invoiceNumber,
  description,
  amount,
  observation = 'Documento fiscal apresentado pela escola.'
}) {
  expect(await page.evaluate(
    pendencyId => abrirModalRegistrarNovoEnvio(pendencyId),
    context.pendencyId
  )).toBe(true);

  const modal = page.locator('#modal-registrar-envio');
  await expect(modal).toHaveClass(/show/);
  await expect(modal.locator('#envio-identificacao')).toBeVisible();

  await modal.getByLabel('Tipo da despesa', { exact: true }).selectOption(expenseType);
  await modal.getByLabel('Número ou referência do documento', { exact: true }).fill(invoiceNumber);
  await modal.getByLabel('Descrição', { exact: true }).fill(description);
  await modal.getByLabel('Valor (R$)', { exact: true }).fill(String(amount));
  await modal.getByLabel(
    'Data em que o arquivo foi disponibilizado no Drive',
    { exact: true }
  ).fill('2026-09-23');
  await modal.getByLabel('Observação', { exact: true }).fill(observation);

  await modal.getByRole('button', {
    name: 'Identificar e enviar para reanálise',
    exact: true
  }).click();

  await expect(modal).not.toHaveClass(/show/);
}

async function stateFor(page, context) {
  return page.evaluate(({ invoiceId, pendencyId, escolaId, competencia, compKey }) => {
    const invoice = notasRegistradas.find(item => String(item.id) === String(invoiceId));
    const pendency = pendencias.find(item => String(item.id) === String(pendencyId));
    const asset = invoice?.bemId
      ? bens.find(item => String(item.id) === String(invoice.bemId))
      : null;
    const verification = verificacoes[escolaId]?.[compKey] || null;
    const contextAssets = bens.filter(item => (
      item.escolaId === escolaId
      && (item.competencia || item.competenciaKey) === competencia
    ));

    return {
      invoice: invoice ? {
        id: invoice.id,
        type: invoice.tipo,
        number: invoice.numero,
        description: invoice.desc || invoice.descricao,
        amount: Number(invoice.valor),
        assetId: invoice.bemId || null,
        documentAnalysis: invoice.analiseDocumentoFiscal,
        advisorySent: Object.hasOwn(invoice, 'consultaAssessoriaEnviada')
          ? invoice.consultaAssessoriaEnviada
          : null,
        advisoryAnalysis: Object.hasOwn(invoice, 'analiseConsultaAssessoria')
          ? invoice.analiseConsultaAssessoria
          : null
      } : null,
      pendency: pendency ? {
        id: pendency.id,
        status: pendency.status,
        invoiceId: pendency.registeredInvoiceId || pendency.registered_invoice_id || null,
        attempts: Array.isArray(pendency.tentativas) ? pendency.tentativas.length : 0
      } : null,
      asset: asset ? {
        id: asset.id,
        description: asset.descricao || asset.item,
        type: asset.tipo,
        amount: Number(asset.valor),
        invoiceNumber: asset.notaFiscal,
        status: asset.status,
        inventoryProcess: asset.processoInventario || ''
      } : null,
      assetCount: contextAssets.length,
      verification: verification ? {
        advisoryDelivery: verification.bonificacao?.consAssessoria,
        advisorySent: verification.bonificacao?.consEnviada,
        advisoryAnalysis: verification.analise?.consAssessoria,
        inventoryDelivery: verification.bonificacao?.encampInventario,
        inventoryAnalysis: verification.analise?.encampInventario,
        invoiceAnalysis: verification.analise?.notaFiscal
      } : null
    };
  }, context);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await selectFixtureCompetence(page);
});

test('Despesa a identificar vira Material de Consumo preservando a mesma NF e Pendência', async ({ page }) => {
  const context = await createUnidentified(page, {
    description: 'Débito ainda não identificado - consumo',
    amount: 321.45
  });

  await identifyThroughModal(page, context, {
    expenseType: 'consumo',
    invoiceNumber: 'NF-CONS-321',
    description: 'Materiais de expediente',
    amount: 321.45
  });

  const state = await stateFor(page, context);
  expect(state.invoice).toMatchObject({
    id: context.invoiceId,
    type: 'consumo',
    number: 'NF-CONS-321',
    description: 'Materiais de expediente',
    amount: 321.45,
    assetId: null,
    documentAnalysis: 'Não analisado'
  });
  expect(state.pendency).toMatchObject({
    id: context.pendencyId,
    status: 'Aguardando reanálise',
    invoiceId: context.invoiceId,
    attempts: 1
  });
  expect(state.asset).toBeNull();
  expect(state.assetCount).toBe(context.assetCountBefore);
});

test('Despesa a identificar vira Prestação de Serviço e passa a exigir Consulta à Assessoria', async ({ page }) => {
  const context = await createUnidentified(page, {
    description: 'Débito ainda não identificado - serviço',
    amount: 480
  });

  let advisoryDialog = '';
  page.once('dialog', async dialog => {
    advisoryDialog = dialog.message();
    await dialog.accept();
  });

  await identifyThroughModal(page, context, {
    expenseType: 'servico',
    invoiceNumber: 'NF-SERV-480',
    description: 'Limpeza de reservatório',
    amount: 480
  });

  expect(advisoryDialog).toContain('Consulta à Assessoria passa a ser exigida');

  const state = await stateFor(page, context);
  expect(state.invoice).toMatchObject({
    id: context.invoiceId,
    type: 'servico',
    number: 'NF-SERV-480',
    description: 'Limpeza de reservatório',
    amount: 480,
    assetId: null,
    documentAnalysis: 'Não analisado',
    advisorySent: false,
    advisoryAnalysis: 'Não analisado'
  });
  expect(state.pendency).toMatchObject({
    id: context.pendencyId,
    status: 'Aguardando reanálise',
    invoiceId: context.invoiceId,
    attempts: 1
  });
  expect(state.asset).toBeNull();
  expect(state.verification.advisoryDelivery).toBe('Não');
  expect(state.verification.advisorySent).toBe(false);
  expect(state.verification.advisoryAnalysis).toBe('Não analisado');
});

test('Despesa a identificar vira Bem Permanente, cria patrimônio novo e fica disponível ao Inventário', async ({ page }) => {
  const context = await createUnidentified(page, {
    description: 'Débito de patrimônio ainda não identificado',
    amount: 200,
    requireInventoryProcess: true
  });

  await identifyThroughModal(page, context, {
    expenseType: 'permanente',
    invoiceNumber: '116',
    description: '4 CAIXAS DE SOM',
    amount: 200,
    observation: 'Nota Fiscal das caixas de som apresentada.'
  });

  const state = await stateFor(page, context);
  expect(state.invoice).toMatchObject({
    id: context.invoiceId,
    type: 'permanente',
    number: '116',
    description: '4 CAIXAS DE SOM',
    amount: 200,
    assetId: expect.any(String),
    documentAnalysis: 'Não analisado'
  });
  expect(state.pendency).toMatchObject({
    id: context.pendencyId,
    status: 'Aguardando reanálise',
    invoiceId: context.invoiceId,
    attempts: 1
  });
  expect(state.asset).toEqual({
    id: state.invoice.assetId,
    description: 'PDDE Básico - 4 CAIXAS DE SOM',
    type: 'permanente',
    amount: 200,
    invoiceNumber: '116',
    status: 'Encaminhada',
    inventoryProcess: context.processoInventario
  });
  expect(state.assetCount).toBe(context.assetCountBefore + 1);
  expect(state.verification.inventoryDelivery).toBe('Sim');
  expect(state.verification.inventoryAnalysis).toBe('Não analisado');

  await page.evaluate(() => {
    switchProfile('inventario');
    switchView('inventario');
  });
  const row = page.locator('table.data-table tbody tr').filter({
    hasText: 'PDDE Básico - 4 CAIXAS DE SOM'
  });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Aguardando Inventariação');
  await expect(row.getByRole('button', {
    name: 'Marcar como Inventariado',
    exact: true
  })).toBeVisible();
});

test('Educação Conectada identifica Despesa a identificar como Boleto de pagamento de Internet', async ({ page }) => {
  const context = await createUnidentified(page, {
    programId: 'CONECTADA',
    description: 'Débito de conectividade ainda não identificado',
    amount: 179.9
  });

  expect(await page.evaluate(
    pendencyId => abrirModalRegistrarNovoEnvio(pendencyId),
    context.pendencyId
  )).toBe(true);
  const modal = page.locator('#modal-registrar-envio');
  const billOption = modal.locator('#envio-identificacao-tipo option[value="boleto_internet"]');
  await expect(billOption).toBeEnabled();
  expect(await billOption.evaluate(option => option.hidden)).toBe(false);

  await modal.getByLabel('Tipo da despesa', { exact: true }).selectOption('boleto_internet');
  await modal.getByLabel('Número ou referência do documento', { exact: true }).fill('BOL-EC-17990');
  await modal.getByLabel('Descrição', { exact: true }).fill('Acesso mensal à Internet');
  await modal.getByLabel('Valor (R$)', { exact: true }).fill('179.90');
  await modal.getByLabel(
    'Data em que o arquivo foi disponibilizado no Drive',
    { exact: true }
  ).fill('2026-09-23');
  await modal.getByLabel('Observação', { exact: true }).fill('Boleto e comprovante apresentados.');
  await modal.getByRole('button', {
    name: 'Identificar e enviar para reanálise',
    exact: true
  }).click();
  await expect(modal).not.toHaveClass(/show/);

  const state = await stateFor(page, context);
  expect(state.invoice).toMatchObject({
    id: context.invoiceId,
    type: 'boleto_internet',
    number: 'BOL-EC-17990',
    description: 'Acesso mensal à Internet',
    amount: 179.9,
    assetId: null,
    documentAnalysis: 'Não analisado',
    advisorySent: null,
    advisoryAnalysis: null
  });
  expect(state.pendency).toMatchObject({
    id: context.pendencyId,
    status: 'Aguardando reanálise',
    invoiceId: context.invoiceId,
    attempts: 1
  });
  expect(state.asset).toBeNull();
  expect(state.verification.advisoryDelivery).toBe('Não se aplica');
  expect(state.verification.advisoryAnalysis).toBe('Correto');
});

test('Boleto de Internet fica indisponível fora da Educação Conectada e a tentativa forçada não altera a despesa', async ({ page }) => {
  const context = await createUnidentified(page, {
    programId: 'BASIC',
    description: 'Débito básico sem identificação',
    amount: 99.9
  });

  expect(await page.evaluate(
    pendencyId => abrirModalRegistrarNovoEnvio(pendencyId),
    context.pendencyId
  )).toBe(true);

  const modal = page.locator('#modal-registrar-envio');
  const billOption = modal.locator('#envio-identificacao-tipo option[value="boleto_internet"]');
  expect(await billOption.evaluate(option => option.hidden)).toBe(true);
  await expect(billOption).toBeDisabled();
  await page.evaluate(() => closeRegistrarNovoEnvioModal());

  const forced = await page.evaluate(async pendencyId => {
    try {
      await radarPendencyService.registerAttempt({
        pendencyId,
        availabilityDate: '2026-09-23',
        observation: 'Tentativa forçada fora da Educação Conectada.',
        identification: {
          expenseType: 'boleto_internet',
          invoiceNumber: 'BOL-INVALIDO',
          description: 'Internet fora da ação',
          amount: 99.9
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
  }, context.pendencyId);

  expect(forced.ok).toBe(false);
  expect(forced.code).toBe('DOCUMENT_NOT_APPLICABLE');

  const state = await stateFor(page, context);
  expect(state.invoice).toMatchObject({
    id: context.invoiceId,
    type: 'a_identificar',
    number: '',
    description: 'Débito básico sem identificação',
    amount: 99.9,
    assetId: null,
    documentAnalysis: 'Incorreto'
  });
  expect(state.pendency).toMatchObject({
    id: context.pendencyId,
    status: 'Aberta',
    invoiceId: context.invoiceId,
    attempts: 0
  });
  expect(state.asset).toBeNull();
});

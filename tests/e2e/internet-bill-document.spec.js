const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

test('Boleto de Internet existe somente como Tipo de Gasto de Notas Fiscais em Educação Conectada', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

  await page.goto('/');
  await selectFixtureCompetence(page);
  const context = await page.evaluate(() => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('CONECTADA')
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) throw new Error('Fixture sem escola com Educação Conectada.');

    const compKey = `${competencia}_CONECTADA`;
    const serviceInvoiceCountBefore = notasRegistradas.filter(note => (
      note.escolaId === escola.id
      && note.compKey === compKey
      && note.tipo === 'servico'
    )).length;
    const billInvoiceCountBefore = notasRegistradas.filter(note => (
      note.escolaId === escola.id
      && note.compKey === compKey
      && note.tipo === 'boleto_internet'
    )).length;
    const assetCountBefore = bens.filter(asset => (
      asset.escolaId === escola.id
      && (asset.competencia || asset.competenciaKey) === competencia
    )).length;

    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);
    return {
      escolaId: escola.id,
      compKey,
      serviceInvoiceCountBefore,
      billInvoiceCountBefore,
      assetCountBefore
    };
  });

  await expect(
    page.locator('#prontuario-verif-rows tr[data-document-key="boletoInternet"]')
  ).toHaveCount(0);
  await expect(page.locator('[data-internet-bill-subitem]')).toHaveCount(0);
  await expect(page.locator('[data-internet-bill-evaluation]')).toHaveCount(0);
  await expect(page.locator('[data-internet-bill-analysis]')).toHaveCount(0);

  const notesRow = page.locator(
    '#prontuario-verif-rows tr[data-program-id="CONECTADA"][data-document-key="notaFiscal"]'
  );
  await expect(notesRow).toBeVisible();

  const noteBonification = notesRow.locator('.invoice-bonification-toggle').first();
  await noteBonification.getByRole('button', { name: 'Sim', exact: true }).click();

  await notesRow.getByRole('button', { name: 'Adicionar Nota' }).click();
  const invoiceModal = page.locator('#modal-dados-nota');
  await expect(invoiceModal).toHaveClass(/show/);

  const connectedState = await invoiceModal
    .locator('#nota-tipo option[value="boleto_internet"]')
    .evaluate(option => ({
      hidden: option.hidden,
      disabled: option.disabled,
      text: option.textContent.trim()
    }));
  expect(connectedState).toEqual({
    hidden: false,
    disabled: false,
    text: 'Boleto de pagamento de Internet'
  });

  await page.evaluate(() => configureInvoiceExpenseTypeOptions('2026-08_BASIC'));
  const basicState = await invoiceModal
    .locator('#nota-tipo option[value="boleto_internet"]')
    .evaluate(option => ({ hidden: option.hidden, disabled: option.disabled }));
  expect(basicState).toEqual({ hidden: true, disabled: true });
  await page.evaluate(compKey => configureInvoiceExpenseTypeOptions(compKey), context.compKey);

  await invoiceModal.locator('#nota-desc').fill('Pagamento de acesso à Internet');
  await invoiceModal.locator('#nota-tipo').selectOption('boleto_internet');
  await invoiceModal.locator('#nota-numero').fill('BOL-E2E-001');
  await invoiceModal.locator('#nota-valor').fill('250');
  await invoiceModal.locator('button[type="submit"]').click();
  await expect(invoiceModal).not.toHaveClass(/show/);

  const afterSave = await page.evaluate(({ escolaId, compKey }) => {
    const bills = notasRegistradas.filter(note => (
      note.escolaId === escolaId
      && note.compKey === compKey
      && note.tipo === 'boleto_internet'
    ));
    const last = bills.at(-1) || null;
    const verification = verificacoes[escolaId]?.[compKey] || null;
    const serviceInvoices = notasRegistradas.filter(note => (
      note.escolaId === escolaId
      && note.compKey === compKey
      && note.tipo === 'servico'
    ));
    const contextAssets = bens.filter(asset => (
      asset.escolaId === escolaId
      && (asset.competencia || asset.competenciaKey) === activeCompetenciaKey
    ));
    return {
      billCount: bills.length,
      invoice: last ? {
        id: last.id,
        tipo: last.tipo,
        numero: last.numero,
        bemId: last.bemId || null,
        documentAnalysis: last.analiseDocumentoFiscal,
        hasSent: Object.hasOwn(last, 'consultaAssessoriaEnviada'),
        hasAnalysis: Object.hasOwn(last, 'analiseConsultaAssessoria')
      } : null,
      serviceInvoiceCount: serviceInvoices.length,
      assetCount: contextAssets.length,
      advisoryDelivery: verification?.bonificacao?.consAssessoria || '',
      advisoryAnalysis: verification?.analise?.consAssessoria || ''
    };
  }, context);

  expect(afterSave.billCount).toBe(context.billInvoiceCountBefore + 1);
  expect(afterSave.invoice).toEqual({
    id: expect.any(String),
    tipo: 'boleto_internet',
    numero: 'BOL-E2E-001',
    bemId: null,
    documentAnalysis: 'Não analisado',
    hasSent: false,
    hasAnalysis: false
  });
  expect(afterSave.serviceInvoiceCount).toBe(context.serviceInvoiceCountBefore);
  expect(afterSave.assetCount).toBe(context.assetCountBefore);
  expect(afterSave.advisoryDelivery).toBe('Não se aplica');
  expect(afterSave.advisoryAnalysis).toBe('Correto');

  await expect(notesRow).toContainText('Boleto Internet: BOL-E2E-001');

  const billRow = page.locator(
    `.invoice-document-row[data-invoice-id="${afterSave.invoice.id}"]`
  );
  const noteAnalysis = billRow.locator('select.invoice-document-analysis-select');
  await expect(noteAnalysis).toBeVisible();
  await noteAnalysis.selectOption('Incorreto');

  const pendencyModal = page.locator('#modal-nova-pendencia');
  await expect(pendencyModal).toHaveClass(/show/);
  await expect(pendencyModal).toContainText('Notas Fiscais');
  await pendencyModal.locator('input[name="pend-erros"]').first().check();
  await pendencyModal.locator('#pend-obs').fill('Documento de gasto com inconsistência.');
  await pendencyModal.locator('button[type="submit"]').click();
  await expect(pendencyModal).not.toHaveClass(/show/);

  const pendency = await page.evaluate(({ escolaId }) => {
    const active = pendencias.filter(item => (
      RadarPendencias.isActivePendency(item)
      && item.escolaId === escolaId
      && item.programaId === 'CONECTADA'
      && item.documentoKey === 'notaFiscal'
    ));
    const legacy = pendencias.filter(item => (
      RadarPendencias.isActivePendency(item)
      && item.escolaId === escolaId
      && item.documentoKey === 'boletoInternet'
    ));
    return {
      notes: active.length,
      legacy: legacy.length,
      registeredInvoiceIds: active.map(item => (
        item.registeredInvoiceId || item.registered_invoice_id || null
      ))
    };
  }, context);

  expect(pendency.notes).toBe(1);
  expect(pendency.legacy).toBe(0);
  expect(pendency.registeredInvoiceIds).toEqual([afterSave.invoice.id]);
  await expect(page.locator('#pendency-preview-drawer')).toBeVisible();
  await expect(
    page.locator('#pendency-preview-drawer').getByText('Boleto Internet: BOL-E2E-001', { exact: true })
  ).toBeVisible();
});

test('Despesa a identificar oferece todos os tipos finais e permite identificar Boleto de Internet em Educação Conectada', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

  await page.goto('/');
  await selectFixtureCompetence(page);

  const context = await page.evaluate(async () => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const programaId = 'CONECTADA';
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes(programaId)
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) throw new Error('Fixture sem escola com Educação Conectada.');

    const compKey = `${competencia}_${programaId}`;
    verificacoes[escola.id] = verificacoes[escola.id] || {};
    const verification = RadarFluxoOperacional.createEmptyVerification();
    verification.bonificacao.notaFiscal = 'Não';
    verification.analise.notaFiscal = 'Não analisado';
    verificacoes[escola.id][compKey] = verification;

    const created = await window.RadarApplicationServices.invoices.saveUnidentifiedExpenseWithPendency({
      schoolId: escola.id,
      compKey,
      description: 'Débito de conectividade ainda não identificado',
      expenseType: 'a_identificar',
      invoiceNumber: '',
      amount: 179.9,
      profile: 'controlador',
      pendencyObservation: 'Aguardando documento que identifique a despesa.'
    });

    rebuildOperationalIndexes();
    switchView('pendencias');

    return {
      escolaId: escola.id,
      compKey,
      invoiceId: created.value.invoice.id,
      pendencyId: created.value.pendency.id
    };
  });

  const opened = await page.evaluate(pendencyId => abrirModalRegistrarNovoEnvio(pendencyId), context.pendencyId);
  expect(opened).toBe(true);

  const modal = page.locator('#modal-registrar-envio');
  await expect(modal).toHaveClass(/show/);
  await expect(modal.locator('#envio-identificacao')).toBeVisible();

  const typeSelect = modal.getByLabel('Tipo da despesa', { exact: true });
  const options = await typeSelect.locator('option').evaluateAll(nodes => nodes
    .filter(option => option.value)
    .map(option => ({
      value: option.value,
      label: option.textContent.trim(),
      hidden: option.hidden,
      disabled: option.disabled
    })));

  expect(options).toEqual([
    {
      value: 'consumo',
      label: 'Material de Consumo',
      hidden: false,
      disabled: false
    },
    {
      value: 'permanente',
      label: 'Bem Permanente',
      hidden: false,
      disabled: false
    },
    {
      value: 'servico',
      label: 'Prestação de Serviço',
      hidden: false,
      disabled: false
    },
    {
      value: 'boleto_internet',
      label: 'Boleto de pagamento de Internet',
      hidden: false,
      disabled: false
    }
  ]);

  await typeSelect.selectOption('boleto_internet');
  await modal.getByLabel('Número ou referência do documento', { exact: true }).fill('BOL-IDENT-17990');
  await modal.getByLabel('Descrição', { exact: true }).fill('Pagamento mensal de acesso à Internet');
  await modal.getByLabel('Valor (R$)', { exact: true }).fill('179.90');
  await modal.getByLabel('Data em que o arquivo foi disponibilizado no Drive', { exact: true }).fill('2026-09-22');
  await modal.getByLabel('Observação', { exact: true }).fill('Boleto e comprovante apresentados pela escola.');
  await modal.getByRole('button', {
    name: 'Registrar e enviar para reanálise',
    exact: true
  }).click();
  await expect(modal).not.toHaveClass(/show/);

  const persisted = await page.evaluate(({ invoiceId, pendencyId }) => {
    const invoice = notasRegistradas.find(item => String(item.id) === String(invoiceId));
    const pendency = pendencias.find(item => String(item.id) === String(pendencyId));
    return {
      invoiceId: invoice?.id || null,
      type: invoice?.tipo || null,
      number: invoice?.numero || null,
      description: invoice?.desc || invoice?.descricao || null,
      amount: invoice?.valor ?? null,
      pendencyId: pendency?.id || null,
      pendencyStatus: pendency?.status || null
    };
  }, context);

  expect(persisted).toEqual({
    invoiceId: context.invoiceId,
    type: 'boleto_internet',
    number: 'BOL-IDENT-17990',
    description: 'Pagamento mensal de acesso à Internet',
    amount: 179.9,
    pendencyId: context.pendencyId,
    pendencyStatus: 'Aguardando reanálise'
  });
});

test('boletoInternet legado permanece armazenado, mas não aparece nem participa da consolidação', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

  await page.goto('/');
  await selectFixtureCompetence(page);
  const context = await page.evaluate(() => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('CONECTADA')
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) throw new Error('Fixture sem escola com Educação Conectada.');

    const compKey = `${competencia}_CONECTADA`;
    verificacoes[escola.id] ||= {};
    verificacoes[escola.id][compKey] = {
      bonificacao: {
        extCC: 'Sim',
        extINV: 'Sim',
        notaFiscal: 'Não se aplica',
        boletoInternet: 'Não',
        consAssessoria: 'Não se aplica',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica'
      },
      analise: {
        extCC: 'Correto',
        extINV: 'Correto',
        notaFiscal: 'Correto',
        boletoInternet: 'Incorreto',
        consAssessoria: 'Correto',
        declBBAgil: 'Correto',
        encampInventario: 'Correto'
      },
      resultadoBonif: ''
    };
    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);

    const evaluation = RadarFluxoOperacional.evaluateMonthlyEvaluation({
      bonification: verificacoes[escola.id][compKey].bonificacao,
      analysis: verificacoes[escola.id][compKey].analise,
      programId: 'CONECTADA',
      pendencies: []
    });

    return {
      escolaId: escola.id,
      compKey,
      evaluation,
      storedBonification: verificacoes[escola.id][compKey].bonificacao.boletoInternet,
      storedAnalysis: verificacoes[escola.id][compKey].analise.boletoInternet
    };
  });

  expect(context.evaluation.canConsolidate).toBe(true);
  expect(context.evaluation.bonusResult).toBe('apta');
  expect(context.evaluation.technicalStatus).toBe('correto');
  expect(context.storedBonification).toBe('Não');
  expect(context.storedAnalysis).toBe('Incorreto');

  await expect(page.locator('[data-internet-bill-subitem]')).toHaveCount(0);
  await expect(page.locator('[data-internet-bill-evaluation]')).toHaveCount(0);
  await expect(page.locator('[data-internet-bill-analysis]')).toHaveCount(0);
  await expect(
    page.locator('#prontuario-verif-rows tr[data-document-key="boletoInternet"]')
  ).toHaveCount(0);
});

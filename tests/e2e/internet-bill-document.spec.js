const { test, expect } = require('@playwright/test');

test('Boleto de Internet fica aninhado em Notas Fiscais, registra gasto só em Conectada e preserva Pendência canônica', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

  await page.goto('/');
  const context = await page.evaluate(() => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('CONECTADA')
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) throw new Error('Fixture sem escola com Educação Conectada.');

    const programaId = 'CONECTADA';
    const compKey = `${competencia}_${programaId}`;
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
      programaId,
      compKey,
      serviceInvoiceCountBefore,
      billInvoiceCountBefore,
      assetCountBefore
    };
  });

  await expect(
    page.locator('#prontuario-verif-rows tr[data-document-key="boletoInternet"]')
  ).toHaveCount(0);

  const notesRow = page.locator(
    '#prontuario-verif-rows tr[data-program-id="CONECTADA"][data-document-key="notaFiscal"]'
  );
  await expect(notesRow).toBeVisible();
  await expect(notesRow.locator('[data-internet-bill-subitem]')).toContainText(
    'Boleto de pagamento de Internet'
  );
  await expect(
    notesRow.getByRole('button', { name: 'Boleto de pagamento de Internet: Sim' })
  ).toBeVisible();
  await expect(
    notesRow.getByRole('button', { name: 'Boleto de pagamento de Internet: Não' })
  ).toBeVisible();
  await expect(
    notesRow.getByRole('button', { name: 'Boleto de pagamento de Internet: N/A' })
  ).toBeVisible();

  const billAnalysis = notesRow.locator('[data-internet-bill-analysis]');
  await expect(billAnalysis.locator('option')).toHaveCount(4);
  await expect(billAnalysis.locator('option').nth(0)).toHaveText('Não analisado');
  await expect(billAnalysis.locator('option').nth(1)).toHaveText('Correto');
  await expect(billAnalysis.locator('option').nth(2)).toHaveText('Correto (Atrasado)');
  await expect(billAnalysis.locator('option').nth(3)).toHaveText('Incorreto');

  const noteBonificationCell = notesRow.locator('td').filter({
    has: notesRow.locator('[data-internet-bill-evaluation="bonification"]')
  });
  const noteBonificationGroup = noteBonificationCell.locator('.btn-group-toggle').first();
  await noteBonificationGroup.getByRole('button', { name: 'Sim', exact: true }).click();

  await notesRow.getByRole('button', { name: 'Adicionar Nota' }).click();
  const invoiceModal = page.locator('#modal-dados-nota');
  await expect(invoiceModal).toHaveClass(/show/);

  const billOptionState = await invoiceModal
    .locator('#nota-tipo option[value="boleto_internet"]')
    .evaluate(option => ({ hidden: option.hidden, disabled: option.disabled, text: option.textContent.trim() }));
  expect(billOptionState).toEqual({
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
    return {
      count: bills.length,
      invoice: last ? {
        tipo: last.tipo,
        numero: last.numero,
        bemId: last.bemId || null,
        hasSent: Object.hasOwn(last, 'consultaAssessoriaEnviada'),
        hasAnalysis: Object.hasOwn(last, 'analiseConsultaAssessoria')
      } : null
    };
  }, context);

  expect(afterSave.count).toBe(context.billInvoiceCountBefore + 1);
  expect(afterSave.invoice).toEqual({
    tipo: 'boleto_internet',
    numero: 'BOL-E2E-001',
    bemId: null,
    hasSent: false,
    hasAnalysis: false
  });

  await expect(notesRow).toContainText('Boleto Internet: BOL-E2E-001');

  await page.waitForFunction(() => window.RADAR_ATOMIC_ANALYSIS_READY === true, null, {
    timeout: 15_000
  });
  await notesRow
    .getByRole('button', { name: 'Boleto de pagamento de Internet: Sim' })
    .click();
  await notesRow.locator('[data-internet-bill-analysis]').selectOption('Incorreto');

  const pendencyModal = page.locator('#modal-nova-pendencia');
  await expect(pendencyModal).toHaveClass(/show/);
  await expect(notesRow.locator('[data-internet-bill-analysis]')).toHaveValue('Não analisado');
  await pendencyModal.locator('input[name="pend-erros"]').first().check();
  await pendencyModal.locator('#pend-obs').fill('Boleto de Internet com inconsistência.');
  await pendencyModal.locator('button[type="submit"]').click();
  await expect(pendencyModal).not.toHaveClass(/show/);

  const persisted = await page.evaluate(({ escolaId, compKey }) => {
    const active = pendencias.filter(pendency => (
      RadarPendencias.isActivePendency(pendency)
      && pendency.escolaId === escolaId
      && pendency.programaId === 'CONECTADA'
      && pendency.documentoKey === 'boletoInternet'
    ));
    const verification = verificacoes[escolaId]?.[compKey];
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
      activePendencies: active.length,
      analysis: verification?.analise?.boletoInternet,
      serviceInvoiceCount: serviceInvoices.length,
      assetCount: contextAssets.length
    };
  }, context);

  expect(persisted.activePendencies).toBe(1);
  expect(persisted.analysis).toBe('Incorreto');
  expect(persisted.serviceInvoiceCount).toBe(context.serviceInvoiceCountBefore);
  expect(persisted.assetCount).toBe(context.assetCountBefore);
});

test('consolidação conectada legada projeta N/A e Correto no subitem sem materializar o boleto', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

  await page.goto('/');
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
        consAssessoria: 'Não se aplica',
        declBBAgil: 'Sim',
        encampInventario: 'Não se aplica'
      },
      analise: {
        extCC: 'Correto',
        extINV: 'Correto',
        notaFiscal: 'Correto',
        consAssessoria: 'Correto',
        declBBAgil: 'Correto',
        encampInventario: 'Correto'
      },
      resultadoBonif: 'apta'
    };
    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);
    return { escolaId: escola.id, compKey };
  });

  await expect(
    page.locator('#prontuario-verif-rows tr[data-document-key="boletoInternet"]')
  ).toHaveCount(0);

  const notesRow = page.locator(
    '#prontuario-verif-rows tr[data-program-id="CONECTADA"][data-document-key="notaFiscal"]'
  );
  await expect(
    notesRow.getByRole('button', { name: 'Boleto de pagamento de Internet: N/A' })
  ).toHaveClass(/active-naoseaplica/);
  await expect(notesRow.locator('[data-internet-bill-analysis]')).toHaveValue('Correto');

  const storedKeys = await page.evaluate(({ escolaId, compKey }) => {
    const stored = verificacoes[escolaId][compKey];
    return {
      hasBonification: Object.hasOwn(stored.bonificacao, 'boletoInternet'),
      hasAnalysis: Object.hasOwn(stored.analise, 'boletoInternet')
    };
  }, context);
  expect(storedKeys).toEqual({ hasBonification: false, hasAnalysis: false });
});

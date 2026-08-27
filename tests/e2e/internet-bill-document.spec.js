const { test, expect } = require('@playwright/test');

test('Boleto de pagamento de Internet aparece somente em Educação Conectada e usa o fluxo canônico de Pendência', async ({ page }, testInfo) => {
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
      assetCountBefore
    };
  });

  const allInternetBillRows = page.locator('#prontuario-verif-rows tr[data-document-key="boletoInternet"]');
  await expect(allInternetBillRows).toHaveCount(1);
  await expect(allInternetBillRows).toHaveAttribute('data-program-id', 'CONECTADA');

  const row = page.locator(
    '#prontuario-verif-rows tr[data-program-id="CONECTADA"][data-document-key="boletoInternet"]'
  );
  await expect(row).toBeVisible();
  await expect(row).toContainText('Boleto de pagamento de Internet');
  await expect(row.getByRole('button', { name: 'Sim', exact: true })).toBeVisible();
  await expect(row.getByRole('button', { name: 'Não', exact: true })).toBeVisible();
  await expect(row.getByRole('button', { name: 'N/A', exact: true })).toBeVisible();

  const analysis = row.locator('select.select-analise');
  await expect(analysis.locator('option')).toHaveCount(4);
  await expect(analysis.locator('option').nth(0)).toHaveText('Não analisado');
  await expect(analysis.locator('option').nth(1)).toHaveText('Correto');
  await expect(analysis.locator('option').nth(2)).toHaveText('Correto (Atrasado)');
  await expect(analysis.locator('option').nth(3)).toHaveText('Incorreto');

  await expect(row.getByRole('button', { name: 'Adicionar Nota' })).toHaveCount(0);
  await expect(row.locator('[data-service-advisory-invoice]')).toHaveCount(0);

  await page.waitForFunction(() => window.RADAR_ATOMIC_ANALYSIS_READY === true, null, {
    timeout: 15_000
  });
  await row.getByRole('button', { name: 'Sim', exact: true }).click();
  await analysis.selectOption('Incorreto');

  const pendencyModal = page.locator('#modal-nova-pendencia');
  await expect(pendencyModal).toHaveClass(/show/);
  await expect(analysis).toHaveValue('Não analisado');
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

test('consolidação conectada legada projeta N/A e Correto sem materializar o boleto', async ({ page }, testInfo) => {
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

  const row = page.locator(
    '#prontuario-verif-rows tr[data-program-id="CONECTADA"][data-document-key="boletoInternet"]'
  );
  await expect(row.getByRole('button', { name: 'N/A', exact: true })).toHaveClass(/active-naoseaplica/);
  await expect(row.locator('select.select-analise')).toHaveValue('Correto');

  const storedKeys = await page.evaluate(({ escolaId, compKey }) => {
    const stored = verificacoes[escolaId][compKey];
    return {
      hasBonification: Object.hasOwn(stored.bonificacao, 'boletoInternet'),
      hasAnalysis: Object.hasOwn(stored.analise, 'boletoInternet')
    };
  }, context);
  expect(storedKeys).toEqual({ hasBonification: false, hasAnalysis: false });
});

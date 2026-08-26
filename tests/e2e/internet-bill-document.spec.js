const { test, expect } = require('@playwright/test');

test('Boleto de pagamento de Internet aparece como documento independente sem controles de NF, Assessoria ou inventário', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

  await page.goto('/');
  const context = await page.evaluate(() => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);
    return { escolaId: escola.id, programaId: escola.programasIds[0] };
  });

  const row = page.locator(
    `#prontuario-verif-rows tr[data-program-id="${context.programaId}"][data-document-key="boletoInternet"]`
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
  await expect(row.getByText(/Inventariação/i)).toHaveCount(0);

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

  const persisted = await page.evaluate(({ escolaId, programaId }) => {
    const compKey = `${activeCompetenciaKey}_${programaId}`;
    const active = pendencias.filter(pendency => (
      RadarPendencias.isActivePendency(pendency)
      && pendency.escolaId === escolaId
      && pendency.programaId === programaId
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
  expect(persisted.serviceInvoiceCount).toBe(0);
  expect(persisted.assetCount).toBe(0);
});

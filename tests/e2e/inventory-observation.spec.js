const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

test('Equipe de Inventário registra observação sem concluir a inventariação', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário focal do inventário no desktop.');

  await page.goto('/');
  await selectFixtureCompetence(page);

  const context = await page.evaluate(async () => {
    switchProfile('controlador');
    const escola = escolas.find(candidate => isCompetenceInScope(
      candidate.competenciaInicial,
      activeCompetenciaKey
    ));
    if (!escola) throw new Error('Fixture sem escola disponível para o inventário.');

    if (!escola.processoInventario) escola.processoInventario = 'PROC-E2E-OBS/2026';

    const saved = await window.RadarApplicationServices.inventory.createAsset({
      schoolId: escola.id,
      competence: activeCompetenciaKey,
      description: 'ITEM OBSERVAÇÃO E2E',
      amount: 321,
      invoiceNumber: 'NF-OBS-E2E',
      profile: 'controlador'
    });

    rebuildOperationalIndexes();
    switchProfile('inventario');
    switchView('inventario');

    return {
      assetId: saved.value.asset.id,
      schoolName: escola.denominação
    };
  });

  const row = page.locator('table.data-table tbody tr').filter({ hasText: 'ITEM OBSERVAÇÃO E2E' });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Aguardando Inventariação');

  await row.getByRole('button', { name: 'Adicionar observação', exact: true }).click();

  const modal = page.locator('#modal-inventory-observation');
  await expect(modal).toHaveClass(/show/);
  await expect(modal).toContainText('ITEM OBSERVAÇÃO E2E');
  await expect(modal).toContainText(context.schoolName);

  const note = 'Processo com documento faltante; aguardando Nota Fiscal.';
  await modal.locator('#inventory-observation-text').fill(note);
  await modal.getByRole('button', { name: 'Salvar observação', exact: true }).click();
  await expect(modal).not.toHaveClass(/show/);

  const updatedRow = page.locator('table.data-table tbody tr').filter({ hasText: 'ITEM OBSERVAÇÃO E2E' });
  await expect(updatedRow).toContainText('Aguardando Inventariação');
  await expect(updatedRow).toContainText(note);
  await expect(updatedRow.getByRole('button', { name: 'Editar observação', exact: true })).toBeVisible();

  const state = await page.evaluate(assetId => {
    const asset = bens.find(item => String(item.id) === String(assetId));
    return {
      status: asset?.status || null,
      notes: asset?.observacoes || null
    };
  }, context.assetId);
  expect(state).toEqual({
    status: 'Encaminhada',
    notes: note
  });

  await updatedRow.getByRole('button', { name: 'Marcar como Inventariado', exact: true }).click();
  const inventoryModal = page.locator('#modal-inventario-confirm');
  await expect(inventoryModal).toHaveClass(/show/);
  await expect(inventoryModal.locator('#inventario-observacoes')).toHaveValue(note);
});

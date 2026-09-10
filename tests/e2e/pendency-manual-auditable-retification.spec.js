'use strict';

const { test, expect } = require('@playwright/test');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

test.describe('Edição auditável de Pendência manual', () => {
  test('edita item, motivo, responsável e observação sem alterar ID, status ou histórico', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/');
    await waitForProductExtensions(page);

    const pendencyId = await page.evaluate(() => {
      switchProfile('controlador');
      const escola = escolas[0];
      const id = 'manual-retification-e2e';
      for (let index = pendencias.length - 1; index >= 0; index -= 1) {
        if (pendencias[index].id === id) pendencias.splice(index, 1);
      }
      pendencias.push({
        id,
        escolaId: escola.id,
        competencia: activeCompetenciaKey,
        item: 'Extrato Conta Corrente',
        motivo: 'Documento ausente',
        responsavel: 'Escola',
        status: 'Aberta',
        dataAbertura: '2026-09-01',
        dataResolucao: null,
        observacao: 'Observação manual antiga.',
        historico: [{
          id: 'manual-retification-event',
          tipo: 'abertura',
          at: '2026-09-01T12:00:00.000Z',
          usuario: 'Teste'
        }]
      });
      rebuildOperationalIndexes();
      openPendencyDrawer(id);
      return id;
    });

    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: 'Editar', exact: true }).click();

    await expect(drawer.locator('#pendency-preview-item')).toBeVisible();
    await expect(drawer.locator('#pendency-preview-responsible')).toBeVisible();
    await drawer.locator('#pendency-preview-item').selectOption('Extrato Investimento');
    await drawer.locator('#pendency-preview-reason').selectOption('Documento ausente');
    await drawer.locator('#pendency-preview-responsible').selectOption('Verbas Federais');
    await drawer.locator('#pendency-preview-observation').fill('Observação manual corrigida.');
    await drawer.getByRole('button', { name: 'Salvar', exact: true }).click();

    const state = await page.evaluate(id => {
      const p = pendencias.find(item => item.id === id);
      return {
        id: p.id,
        item: p.item,
        motivo: p.motivo,
        responsavel: p.responsavel,
        observacao: p.observacao,
        status: p.status,
        dataAbertura: p.dataAbertura,
        historyLength: Array.isArray(p.historico) ? p.historico.length : 0
      };
    }, pendencyId);

    expect(state).toMatchObject({
      id: pendencyId,
      item: 'Extrato Investimento',
      motivo: 'Documento ausente',
      responsavel: 'Verbas Federais',
      observacao: 'Observação manual corrigida.',
      status: 'Aberta',
      dataAbertura: '2026-09-01',
      historyLength: 1
    });

    await expect(drawer.getByText('Extrato Investimento', { exact: true })).toBeVisible();
    await expect(drawer.getByText('Observação manual corrigida.', { exact: true })).toBeVisible();
  });
});

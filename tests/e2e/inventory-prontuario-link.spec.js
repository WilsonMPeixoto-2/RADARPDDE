const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

test.describe('Prontuário — vínculo patrimonial da inventariação', () => {
  test('exibe NF permanente e bem vinculado sob Encaminhado para Inventariação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await selectFixtureCompetence(page);
    await waitForProductExtensions(page);

    const context = await page.evaluate(() => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const programaId = 'BASIC';
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) throw new Error('Escola com PDDE Básico não encontrada para o E2E.');

      const compKey = `${competencia}_${programaId}`;
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compKey] = {
        bonificacao: {
          extCC: 'Sim',
          extINV: 'Sim',
          notaFiscal: 'Sim',
          consAssessoria: 'Não se aplica',
          consEnviada: false,
          declBBAgil: 'Sim',
          encampInventario: 'Sim'
        },
        analise: {
          extCC: 'Correto',
          extINV: 'Correto',
          notaFiscal: 'Não analisado',
          consAssessoria: 'Correto',
          declBBAgil: 'Correto',
          encampInventario: 'Não analisado'
        },
        resultadoBonif: ''
      };

      const removedAssetIds = new Set();
      for (let index = notasRegistradas.length - 1; index >= 0; index -= 1) {
        const invoice = notasRegistradas[index];
        if (
          invoice.escolaId === escola.id
          && invoice.compKey === compKey
          && invoice.tipo === 'permanente'
        ) {
          if (invoice.bemId) removedAssetIds.add(String(invoice.bemId));
          notasRegistradas.splice(index, 1);
        }
      }
      for (let index = bens.length - 1; index >= 0; index -= 1) {
        if (removedAssetIds.has(String(bens[index].id))) bens.splice(index, 1);
      }

      const asset = {
        id: 'e2e-asset-impressora-teste-2',
        escolaId: escola.id,
        competencia,
        item: 'Impressora',
        descricao: 'Impressora',
        tipo: 'permanente',
        valor: 2000,
        notaFiscal: 'Teste 2',
        processoInventario: escola.processoInventario || 'PROC-E2E-2026',
        status: 'Encaminhada'
      };
      const invoice = {
        id: 'e2e-invoice-impressora-teste-2',
        escolaId: escola.id,
        compKey,
        competencia,
        programaId,
        desc: 'Impressora',
        descricao: 'Impressora',
        tipo: 'permanente',
        numero: 'Teste 2',
        valor: 2000,
        bemId: asset.id,
        analiseDocumentoFiscal: 'Não analisado',
        dataRegistro: '2026-09-03T21:20:00.000Z'
      };
      bens.push(asset);
      notasRegistradas.push(invoice);

      activeProntuarioCompetencia = competencia;
      rebuildOperationalIndexes();
      switchView('prontuario', escola.id);
      return {
        escolaId: escola.id,
        programaId,
        invoiceId: invoice.id
      };
    });

    const row = page.locator(
      `#prontuario-verif-rows tr[data-program-id="${context.programaId}"][data-document-key="encampInventario"]`
    );
    await expect(row).toBeVisible();
    await expect(row.getByRole('button', { name: 'Sim', exact: true })).toHaveClass(/active-sim/);

    const linked = row.locator(
      `[data-inventory-linked-invoice-id="${context.invoiceId}"]`
    );
    await expect(linked).toBeVisible();
    await expect(row.getByText('1 aquisição patrimonial vinculada', { exact: true })).toBeVisible();
    await expect(linked.getByText('NF: Teste 2', { exact: true })).toBeVisible();
    await expect(linked.getByText('Impressora · R$ 2.000,00', { exact: true })).toBeVisible();
    await expect(linked.getByText('Encaminhada', { exact: true })).toBeVisible();

    await page.evaluate(escolaId => renderProntuario(escolaId), context.escolaId);
    const rerenderedRow = page.locator(
      `#prontuario-verif-rows tr[data-program-id="${context.programaId}"][data-document-key="encampInventario"]`
    );
    await expect(rerenderedRow.locator('[data-inventory-document-links]')).toHaveCount(1);
    await expect(
      rerenderedRow.locator(`[data-inventory-linked-invoice-id="${context.invoiceId}"]`)
    ).toHaveCount(1);

    const overflow = await rerenderedRow.evaluate(element => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});

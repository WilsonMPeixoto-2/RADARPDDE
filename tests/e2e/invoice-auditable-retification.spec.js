'use strict';

const { test, expect } = require('@playwright/test');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

function fiscalRow(page) {
  return page.locator('#prontuario-verif-rows tr[data-document-key="notaFiscal"]').first();
}

async function prepareContext(page, { unidentified = false } = {}) {
  return page.evaluate(({ isUnidentified }) => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) throw new Error('Escola determinística não encontrada.');
    const programaId = escola.programasIds[0];
    const compKey = `${competencia}_${programaId}`;
    const invoiceId = isUnidentified ? 'retify-unidentified-e2e' : 'retify-invoice-e2e';
    const pendencyId = isUnidentified ? 'retify-pendency-unidentified-e2e' : 'retify-pendency-invoice-e2e';

    verificacoes[escola.id] = verificacoes[escola.id] || {};
    verificacoes[escola.id][compKey] = {
      bonificacao: {
        extCC: '', extINV: '', notaFiscal: 'Sim', consAssessoria: 'Não se aplica',
        declBBAgil: '', encampInventario: 'Não se aplica'
      },
      analise: {
        extCC: 'Não analisado', extINV: 'Não analisado',
        notaFiscal: 'Incorreto', consAssessoria: 'Correto',
        declBBAgil: 'Não analisado', encampInventario: 'Correto'
      },
      resultadoBonif: ''
    };

    for (let index = notasRegistradas.length - 1; index >= 0; index -= 1) {
      if (notasRegistradas[index].escolaId === escola.id && notasRegistradas[index].compKey === compKey) {
        notasRegistradas.splice(index, 1);
      }
    }
    for (let index = pendencias.length - 1; index >= 0; index -= 1) {
      const p = pendencias[index];
      if (
        p.escolaId === escola.id
        && (p.competenciaOrigem || p.competencia) === competencia
        && p.programaId === programaId
        && p.documentoKey === 'notaFiscal'
      ) pendencias.splice(index, 1);
    }

    const invoice = {
      id: invoiceId,
      escolaId: escola.id,
      compKey,
      competencia,
      programaId,
      tipo: isUnidentified ? 'a_identificar' : 'consumo',
      numero: isUnidentified ? 'REF-ANTIGA' : 'NF-ANTIGA',
      desc: isUnidentified ? 'Débito ainda não identificado' : 'Material pedagógico antigo',
      descricao: isUnidentified ? 'Débito ainda não identificado' : 'Material pedagógico antigo',
      valor: isUnidentified ? 321.45 : 100,
      bemId: null,
      analiseDocumentoFiscal: 'Incorreto',
      dataRegistro: '2026-09-01T12:00:00.000Z',
      rowVersion: 1
    };
    notasRegistradas.push(invoice);

    const opened = RadarPendencias.createDocumentPendency({
      id: pendencyId,
      escolaId: escola.id,
      competencia,
      programaId,
      documentoKey: 'notaFiscal',
      registeredInvoiceId: invoiceId,
      item: isUnidentified ? 'Despesa a identificar' : 'Nota Fiscal',
      erros: ['Documento ausente'],
      observacao: 'Pendência original preservada.',
      dataAbertura: '2026-09-01'
    }, {
      eventId: `${pendencyId}-event`,
      at: '2026-09-01T12:00:00.000Z',
      usuario: 'Teste',
      perfil: 'controlador'
    });
    opened.documentSnapshot = {
      registeredInvoiceId: invoiceId,
      tipo: invoice.tipo,
      numero: invoice.numero,
      descricao: invoice.desc,
      valor: invoice.valor
    };
    pendencias.push(opened);

    activeProntuarioCompetencia = competencia;
    rebuildOperationalIndexes();
    switchView('prontuario', escola.id);
    return { escolaId: escola.id, compKey, invoiceId, pendencyId };
  }, { isUnidentified: unidentified });
}

test.describe('Edição auditável de lançamentos', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await page.goto('/');
    await waitForProductExtensions(page);
  });

  test('retifica descrição, número e valor de NF com Pendência ativa e propaga ao drawer sem alterar o ciclo', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    const context = await prepareContext(page);
    const invoiceRow = fiscalRow(page).locator(`.invoice-document-row[data-invoice-id="${context.invoiceId}"]`);

    const editButton = invoiceRow.getByRole('button', { name: /Editar NF/ });
    await expect(editButton).toBeVisible();
    await editButton.click();

    await expect(page.locator('#nota-tipo')).toBeDisabled();
    await page.locator('#nota-desc').fill('Material pedagógico corrigido');
    await page.locator('#nota-numero').fill('NF-CORRIGIDA');
    await page.locator('#nota-valor').fill('175.50');
    await page.locator('#form-dados-nota button[type="submit"]').click();
    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);

    const state = await page.evaluate(({ invoiceId, pendencyId }) => {
      const invoice = notasRegistradas.find(item => item.id === invoiceId);
      const pendency = pendencias.find(item => item.id === pendencyId);
      return {
        invoiceId: invoice.id,
        description: invoice.desc,
        number: invoice.numero,
        amount: invoice.valor,
        type: invoice.tipo,
        pendencyId: pendency.id,
        pendencyStatus: pendency.status,
        activeEquivalentCount: pendencias.filter(item => (
          RadarPendencias.isActivePendency(item)
          && String(item.registeredInvoiceId || item.registered_invoice_id || '') === invoiceId
        )).length,
        snapshot: pendency.documentSnapshot
      };
    }, context);

    expect(state).toMatchObject({
      invoiceId: context.invoiceId,
      description: 'Material pedagógico corrigido',
      number: 'NF-CORRIGIDA',
      amount: 175.5,
      type: 'consumo',
      pendencyId: context.pendencyId,
      pendencyStatus: 'Aberta',
      activeEquivalentCount: 1
    });
    expect(state.snapshot.numero).toBe('NF-ANTIGA');
    expect(state.snapshot.valor).toBe(100);
    expect(state.snapshot.descricao).toBe('Material pedagógico antigo');

    const refreshed = fiscalRow(page).locator(`.invoice-document-row[data-invoice-id="${context.invoiceId}"]`);
    await expect(refreshed.getByText('NF: NF-CORRIGIDA', { exact: true })).toBeVisible();
    await expect(refreshed.getByText('R$ 175,50', { exact: true })).toBeVisible();
    await refreshed.getByRole('button', { name: 'Visualizar pendência' }).click();
    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer.getByText('NF: NF-CORRIGIDA', { exact: true })).toBeVisible();
    await expect(drawer.getByText(/R\$ 175,50/)).toBeVisible();
  });

  test('retifica despesa a identificar mantendo tipo, Incorreto, ID e mesma Pendência', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    const context = await prepareContext(page, { unidentified: true });
    const invoiceRow = fiscalRow(page).locator(`.invoice-document-row[data-invoice-id="${context.invoiceId}"]`);

    const editButton = invoiceRow.getByRole('button', { name: /Editar/ }).filter({ hasNotText: 'Editar análise' });
    await expect(editButton).toHaveCount(1);
    await editButton.click();

    await expect(page.locator('#nota-tipo')).toBeDisabled();
    await expect(page.locator('#nota-tipo')).toHaveValue('a_identificar');
    await page.locator('#nota-desc').fill('Débito corrigido, documentação ainda pendente');
    await page.locator('#nota-numero').fill('REF-CORRIGIDA');
    await page.locator('#nota-valor').fill('400.25');
    await page.locator('#form-dados-nota button[type="submit"]').click();
    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);

    const state = await page.evaluate(({ invoiceId, pendencyId }) => {
      const invoice = notasRegistradas.find(item => item.id === invoiceId);
      const pendency = pendencias.find(item => item.id === pendencyId);
      return {
        id: invoice.id,
        type: invoice.tipo,
        description: invoice.desc,
        number: invoice.numero,
        amount: invoice.valor,
        analysis: invoice.analiseDocumentoFiscal,
        pendencyId: pendency.id,
        pendencyStatus: pendency.status,
        snapshot: pendency.documentSnapshot
      };
    }, context);

    expect(state).toMatchObject({
      id: context.invoiceId,
      type: 'a_identificar',
      description: 'Débito corrigido, documentação ainda pendente',
      number: 'REF-CORRIGIDA',
      amount: 400.25,
      analysis: 'Incorreto',
      pendencyId: context.pendencyId,
      pendencyStatus: 'Aberta'
    });
    expect(state.snapshot.numero).toBe('REF-ANTIGA');
    expect(state.snapshot.valor).toBe(321.45);

    const refreshed = fiscalRow(page).locator(`.invoice-document-row[data-invoice-id="${context.invoiceId}"]`);
    await expect(refreshed.getByText(/REF-CORRIGIDA/)).toBeVisible();
    await expect(refreshed.getByText('R$ 400,25', { exact: true })).toBeVisible();
    await refreshed.getByRole('button', { name: 'Visualizar pendência' }).click();
    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer.getByText(/REF-CORRIGIDA/)).toBeVisible();
    await expect(drawer.getByText(/R\$ 400,25/)).toBeVisible();
  });
});

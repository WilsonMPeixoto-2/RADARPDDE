const { test, expect } = require('@playwright/test');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

function invoiceRow(page, invoiceId) {
  return page.locator(`.invoice-document-row[data-invoice-id="${invoiceId}"]`);
}

async function markIncorrectAndOpenPendency(page, invoiceId, observation) {
  const row = invoiceRow(page, invoiceId);
  const select = row.locator('select.invoice-document-analysis-select');
  await select.selectOption('Incorreto');

  const modal = page.locator('#modal-nova-pendencia');
  await expect(modal).toHaveClass(/show/);
  await modal.locator('input[name="pend-erros"]').first().check();
  await modal.locator('#pend-obs').fill(observation);
  await modal.locator('button[type="submit"]').click();
  await expect(modal).not.toHaveClass(/show/);

  const drawer = page.locator('#pendency-preview-drawer');
  await expect(drawer).toBeVisible();
  await drawer.locator('.pendency-preview-close').click();
  await expect(drawer).toBeHidden();
}

test.describe('Prontuário — análise individual de Notas Fiscais', () => {
  test('duas despesas incorretas coexistem sem bloquear a análise das demais', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/');
    await waitForProductExtensions(page);

    const context = await page.evaluate(() => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const programaId = 'CONECTADA';
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) throw new Error('Escola com Educação Conectada não encontrada para o E2E.');

      const compKey = `${competencia}_${programaId}`;
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compKey] = {
        bonificacao: {
          extCC: 'Sim',
          extINV: 'Sim',
          notaFiscal: 'Sim',
          consAssessoria: 'Sim',
          consEnviada: true,
          declBBAgil: 'Sim',
          encampInventario: 'Não se aplica'
        },
        analise: {
          extCC: 'Correto',
          extINV: 'Correto',
          notaFiscal: 'Não analisado',
          consAssessoria: 'Correto',
          declBBAgil: 'Correto',
          encampInventario: 'Correto'
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
        ) {
          pendencias.splice(index, 1);
        }
      }

      const invoices = [
        {
          id: 'e2e-invoice-service-1234',
          escolaId: escola.id,
          compKey,
          competencia,
          programaId,
          desc: 'Serviço de limpeza',
          descricao: 'Serviço de limpeza',
          tipo: 'servico',
          numero: 'NFS-E 1234',
          valor: 500,
          analiseDocumentoFiscal: 'Não analisado',
          consultaAssessoriaEnviada: true,
          analiseConsultaAssessoria: 'Correto',
          bemId: null,
          dataRegistro: '2026-08-28T10:00:00.000Z'
        },
        {
          id: 'e2e-invoice-boleto-1234',
          escolaId: escola.id,
          compKey,
          competencia,
          programaId,
          desc: 'Pagamento de provedor',
          descricao: 'Pagamento de provedor',
          tipo: 'boleto_internet',
          numero: 'Boleto 1234',
          valor: 100,
          analiseDocumentoFiscal: 'Não analisado',
          bemId: null,
          dataRegistro: '2026-08-28T10:01:00.000Z'
        },
        {
          id: 'e2e-invoice-service-2345',
          escolaId: escola.id,
          compKey,
          competencia,
          programaId,
          desc: 'Serviço de manutenção',
          descricao: 'Serviço de manutenção',
          tipo: 'servico',
          numero: '2345',
          valor: 1345,
          analiseDocumentoFiscal: 'Não analisado',
          consultaAssessoriaEnviada: true,
          analiseConsultaAssessoria: 'Correto',
          bemId: null,
          dataRegistro: '2026-08-28T10:02:00.000Z'
        }
      ];
      notasRegistradas.push(...invoices);

      activeProntuarioCompetencia = competencia;
      rebuildOperationalIndexes();
      switchView('prontuario', escola.id);
      return {
        escolaId: escola.id,
        competencia,
        programaId,
        compKey,
        invoiceIds: invoices.map(item => item.id)
      };
    });

    const [service1234, boleto1234, service2345] = context.invoiceIds;
    const panel = page.locator('[data-invoice-document-panel]');
    await expect(panel).toBeVisible();
    await expect(panel.getByText('3 registros', { exact: true })).toBeVisible();
    await expect(panel.getByText('NFS-E 1234')).toBeVisible();
    await expect(panel.getByText('Boleto Internet: Boleto 1234')).toBeVisible();
    await expect(panel.getByText('NF: 2345')).toBeVisible();

    await invoiceRow(page, service1234)
      .locator('select.invoice-document-analysis-select')
      .selectOption('Correto');

    await expect(invoiceRow(page, service1234).locator('select.invoice-document-analysis-select'))
      .toHaveValue('Correto');

    await markIncorrectAndOpenPendency(
      page,
      boleto1234,
      'Identificado erro técnico no boleto de pagamento do provedor.'
    );

    await expect(invoiceRow(page, service1234).locator('select.invoice-document-analysis-select'))
      .toBeEnabled();
    await expect(invoiceRow(page, service2345).locator('select.invoice-document-analysis-select'))
      .toBeEnabled();

    await markIncorrectAndOpenPendency(
      page,
      service2345,
      'Identificado erro técnico na Nota Fiscal 2345.'
    );

    const result = await page.evaluate(({ escolaId, competencia, programaId, compKey, invoiceIds }) => {
      const active = pendencias.filter(p => (
        RadarPendencias.isActivePendency(p)
        && p.escolaId === escolaId
        && (p.competenciaOrigem || p.competencia) === competencia
        && p.programaId === programaId
        && p.documentoKey === 'notaFiscal'
      ));
      const verification = verificacoes[escolaId][compKey];
      return {
        bonification: verification.bonificacao.notaFiscal,
        aggregateAnalysis: verification.analise.notaFiscal,
        activeCount: active.length,
        linkedIds: active
          .map(p => p.registeredInvoiceId || p.registered_invoice_id)
          .sort(),
        invoiceStates: invoiceIds.map(id => {
          const invoice = notasRegistradas.find(item => item.id === id);
          return { id, analysis: invoice?.analiseDocumentoFiscal };
        })
      };
    }, context);

    expect(result.bonification).toBe('Sim');
    expect(result.aggregateAnalysis).toBe('Incorreto');
    expect(result.activeCount).toBe(2);
    expect(result.linkedIds).toEqual([boleto1234, service2345].sort());
    expect(result.invoiceStates).toEqual([
      { id: service1234, analysis: 'Correto' },
      { id: boleto1234, analysis: 'Incorreto' },
      { id: service2345, analysis: 'Incorreto' }
    ]);

    await expect(invoiceRow(page, boleto1234).getByRole('button', { name: 'Visualizar pendência' }))
      .toBeVisible();
    await expect(invoiceRow(page, service2345).getByRole('button', { name: 'Visualizar pendência' }))
      .toBeVisible();
    await expect(invoiceRow(page, service1234).getByRole('button', { name: 'Visualizar pendência' }))
      .toHaveCount(0);

    const summary = panel.locator('.invoice-document-panel-summary');
    await expect(summary.getByText('Incorreto', { exact: true })).toBeVisible();
    await expect(summary.getByText('2 pendências', { exact: true })).toBeVisible();

    await invoiceRow(page, boleto1234).getByRole('button', { name: 'Visualizar pendência' }).click();
    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Boleto Internet: Boleto 1234', { exact: true })).toBeVisible();
  });
});

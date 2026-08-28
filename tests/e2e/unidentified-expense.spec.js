const { test, expect } = require('@playwright/test');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

function fiscalNoteRow(page) {
  return page.locator('#prontuario-verif-rows tr[data-document-key="notaFiscal"]').first();
}

test.describe('Prontuário — despesa a identificar', () => {
  test('nasce Incorreto + Pendência, preserva ID ao ser identificada e então aceita novo envio', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/');
    await waitForProductExtensions(page);

    const context = await page.evaluate(() => {
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

      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compKey] = {
        bonificacao: {
          extCC: '',
          extINV: '',
          notaFiscal: 'Não',
          consAssessoria: 'Não se aplica',
          declBBAgil: '',
          encampInventario: 'Não se aplica'
        },
        analise: {
          extCC: 'Não analisado',
          extINV: 'Não analisado',
          notaFiscal: 'Não analisado',
          consAssessoria: 'Correto',
          declBBAgil: 'Não analisado',
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

      activeProntuarioCompetencia = competencia;
      rebuildOperationalIndexes();
      switchView('prontuario', escola.id);
      return { escolaId: escola.id, compKey, competencia, programaId };
    });

    const row = fiscalNoteRow(page);
    await expect(row.getByRole('button', { name: 'Adicionar Nota' })).toHaveCount(0);

    const provisionalButton = row.getByRole('button', { name: 'Registrar despesa a identificar' });
    await expect(provisionalButton).toBeVisible();
    await expect(provisionalButton).toBeEnabled();
    await provisionalButton.click();

    await expect(page.locator('#modal-dados-nota')).toHaveClass(/show/);
    await expect(page.locator('#nota-tipo')).toHaveValue('a_identificar');
    await expect(page.locator('#nota-numero')).not.toHaveAttribute('required');
    await expect(page.getByText('Número da Nota Fiscal (opcional neste estágio)')).toBeVisible();
    await expect(page.locator('#modal-dados-nota h3')).toHaveText('Registrar despesa a identificar');

    await page.locator('#nota-desc').fill('Saída de R$ 850,00 observada no extrato; documentação pendente');
    await page.locator('#nota-valor').fill('850');
    await page.locator('#form-dados-nota button[type="submit"]').click();

    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);
    await expect(page.locator('#pendency-preview-drawer')).toBeVisible();

    const stateAfterCreate = await page.evaluate(({ escolaId, compKey, competencia, programaId }) => {
      const invoice = notasRegistradas.find(note => note.escolaId === escolaId && note.compKey === compKey);
      const linked = pendencias.find(p => (
        RadarPendencias.isActivePendency(p)
        && p.escolaId === escolaId
        && (p.competenciaOrigem || p.competencia) === competencia
        && p.programaId === programaId
        && p.documentoKey === 'notaFiscal'
        && String(p.registeredInvoiceId || p.registered_invoice_id || '') === String(invoice?.id || '')
      ));
      const verification = verificacoes[escolaId][compKey];
      return {
        id: invoice?.id,
        tipo: invoice?.tipo,
        numero: invoice?.numero,
        bemId: invoice?.bemId,
        individualAnalysis: invoice?.analiseDocumentoFiscal,
        aggregateAnalysis: verification?.analise?.notaFiscal,
        bonification: verification?.bonificacao?.notaFiscal,
        consAssessoria: verification?.bonificacao?.consAssessoria,
        pendencyId: linked?.id || null,
        pendencyStatus: linked?.status || null
      };
    }, context);

    expect(stateAfterCreate.id).toBeTruthy();
    expect(stateAfterCreate.tipo).toBe('a_identificar');
    expect(stateAfterCreate.numero || '').toBe('');
    expect(stateAfterCreate.bemId).toBeNull();
    expect(stateAfterCreate.individualAnalysis).toBe('Incorreto');
    expect(stateAfterCreate.aggregateAnalysis).toBe('Incorreto');
    expect(stateAfterCreate.bonification).toBe('Não');
    expect(stateAfterCreate.consAssessoria).toBe('Não se aplica');
    expect(stateAfterCreate.pendencyId).toBeTruthy();
    expect(stateAfterCreate.pendencyStatus).toBe('Aberta');

    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer.getByText('Despesa a identificar', { exact: true }).first()).toBeVisible();
    await drawer.locator('.pendency-preview-close').click();
    await expect(drawer).toBeHidden();

    const refreshedRow = fiscalNoteRow(page);
    const provisionalInvoiceRow = refreshedRow.locator(
      `.invoice-document-row[data-invoice-id="${stateAfterCreate.id}"]`
    );
    await expect(
      provisionalInvoiceRow.locator('select.invoice-document-analysis-select')
    ).toHaveValue('Incorreto');
    await expect(
      refreshedRow.locator('.invoice-document-panel-summary').getByText('Incorreto', { exact: true })
    ).toBeVisible();
    await expect(
      provisionalInvoiceRow.getByRole('button', { name: 'Visualizar pendência' })
    ).toBeVisible();

    await provisionalInvoiceRow.locator('button[aria-label^="Editar"]').click();
    await expect(page.locator('#nota-tipo')).toHaveValue('a_identificar');
    await page.locator('#nota-tipo').selectOption('consumo');
    await expect(page.locator('#nota-numero')).toHaveAttribute('required');
    await page.locator('#nota-numero').fill('NF-IDENT-850');
    await page.locator('#form-dados-nota button[type="submit"]').click();
    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);

    const afterIdentification = await page.evaluate(({ escolaId, compKey }) => {
      const invoice = notasRegistradas.find(note => note.escolaId === escolaId && note.compKey === compKey);
      return {
        id: invoice?.id,
        tipo: invoice?.tipo,
        numero: invoice?.numero,
        analysis: invoice?.analiseDocumentoFiscal
      };
    }, context);
    expect(afterIdentification).toEqual({
      id: stateAfterCreate.id,
      tipo: 'consumo',
      numero: 'NF-IDENT-850',
      analysis: 'Incorreto'
    });

    const afterSubmission = await page.evaluate(async pendencyId => {
      await radarPendencyService.registerAttempt({
        pendencyId,
        availabilityDate: '2026-08-28',
        observation: 'Documento fiscal identificado e disponibilizado pela escola.'
      });
      rebuildOperationalIndexes();
      const p = pendencias.find(item => item.id === pendencyId);
      const invoiceId = p.registeredInvoiceId || p.registered_invoice_id;
      const invoice = notasRegistradas.find(item => String(item.id) === String(invoiceId));
      return {
        status: p.status,
        invoiceId: invoice?.id,
        type: invoice?.tipo,
        analysis: invoice?.analiseDocumentoFiscal
      };
    }, stateAfterCreate.pendencyId);

    expect(afterSubmission).toEqual({
      status: 'Aguardando reanálise',
      invoiceId: stateAfterCreate.id,
      type: 'consumo',
      analysis: 'Não analisado'
    });
  });
});

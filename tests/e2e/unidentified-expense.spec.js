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

    await page.evaluate(({ escolaId, compKey }) => openModalDadosNota(escolaId, compKey), context);
    const normalUnidentifiedOption = page.locator('#nota-tipo option[value="a_identificar"]');
    await expect(normalUnidentifiedOption).toBeHidden();
    await expect(normalUnidentifiedOption).toBeDisabled();
    await expect(page.locator('#nota-tipo')).not.toHaveValue('a_identificar');
    await page.locator('#modal-dados-nota button[type="button"]', { hasText: 'Cancelar' }).click();

    const provisionalButton = row.getByRole('button', { name: 'Registrar despesa a identificar' });
    await expect(provisionalButton).toBeVisible();
    await expect(provisionalButton).toBeEnabled();
    await provisionalButton.click();

    await expect(page.locator('#modal-dados-nota')).toHaveClass(/show/);
    await expect(page.locator('#nota-tipo')).toHaveValue('a_identificar');
    await expect(page.locator('#nota-tipo option[value="a_identificar"]')).toBeEnabled();
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
    ).toHaveCount(0);
    await expect(
      provisionalInvoiceRow.locator('.invoice-document-status')
    ).toHaveText('Incorreto');
    await expect(
      refreshedRow.locator('.invoice-document-panel-summary').getByText('1 pendência', { exact: true })
    ).toBeVisible();
    await expect(
      provisionalInvoiceRow.getByRole('button', { name: 'Visualizar pendência' })
    ).toBeVisible();

    await page.evaluate(() => switchView('pendencias'));
    const pendingRow = page.locator(
      `#p-abertas tr[data-pendency-ref*="${stateAfterCreate.pendencyId}"]`
    );
    await expect(pendingRow).toHaveCount(1);
    await pendingRow.getByRole('button', {
      name: 'Registrar novo envio',
      exact: true
    }).click();

    const submissionModal = page.locator('#modal-registrar-envio');
    await expect(submissionModal).toHaveClass(/show/);
    await expect(submissionModal.locator('#envio-identificacao')).toBeVisible();
    await submissionModal.getByLabel('Tipo da despesa', { exact: true }).selectOption('consumo');
    await submissionModal.getByLabel('Número ou referência do documento', { exact: true }).fill('NF-IDENT-850');
    await submissionModal.getByLabel('Descrição', { exact: true }).fill('Material identificado pela escola');
    await submissionModal.getByLabel('Valor (R$)', { exact: true }).fill('850');
    await submissionModal.getByLabel('Data em que o arquivo foi disponibilizado no Drive', { exact: true }).fill('2026-08-28');
    await submissionModal.getByLabel('Observação', { exact: true })
      .fill('Documento fiscal identificado e disponibilizado pela escola.');
    await submissionModal.getByRole('button', {
      name: 'Registrar e enviar para reanálise',
      exact: true
    }).click();
    await expect(submissionModal).not.toHaveClass(/show/);

    const afterSubmission = await page.evaluate(pendencyId => {
      const p = pendencias.find(item => item.id === pendencyId);
      const invoiceId = p.registeredInvoiceId || p.registered_invoice_id;
      const invoice = notasRegistradas.find(item => String(item.id) === String(invoiceId));
      return {
        status: p.status,
        pendencyId: p.id,
        invoiceId: invoice?.id,
        type: invoice?.tipo,
        number: invoice?.numero,
        analysis: invoice?.analiseDocumentoFiscal
      };
    }, stateAfterCreate.pendencyId);

    expect(afterSubmission).toEqual({
      status: 'Aguardando reanálise',
      pendencyId: stateAfterCreate.pendencyId,
      invoiceId: stateAfterCreate.id,
      type: 'consumo',
      number: 'NF-IDENT-850',
      analysis: 'Não analisado'
    });
  });

  test('preserva despesa a identificar legítima anterior ao hotfix como registro legado sem inventar Pendência', async ({ page }, testInfo) => {
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
          notaFiscal: 'Sim',
          consAssessoria: 'Não se aplica',
          declBBAgil: '',
          encampInventario: 'Não se aplica'
        },
        analise: {
          extCC: 'Não analisado',
          extINV: 'Não analisado',
          notaFiscal: 'Correto',
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

      notasRegistradas.push({
        id: 'legacy-unidentified-e2e',
        escolaId: escola.id,
        compKey,
        competencia,
        programaId,
        tipo: 'a_identificar',
        numero: '',
        desc: 'Débito histórico sem documentação suficiente',
        descricao: 'Débito histórico sem documentação suficiente',
        valor: 321.45,
        dataRegistro: '2026-08-20T12:00:00.000Z'
      });

      activeProntuarioCompetencia = competencia;
      rebuildOperationalIndexes();
      switchView('prontuario', escola.id);
      return { escolaId: escola.id, compKey };
    });

    const row = fiscalNoteRow(page).locator(
      '.invoice-document-row[data-invoice-id="legacy-unidentified-e2e"]'
    );
    await expect(row).toBeVisible();
    await expect(row.getByText('Registro legado', { exact: true })).toBeVisible();
    await expect(row.locator('.invoice-document-status')).toHaveText('Não analisado');
    await expect(row.locator('select.invoice-document-analysis-select')).toHaveCount(0);
    await expect(row.getByRole('button', { name: /Editar/ })).toHaveCount(0);
    await expect(row.getByRole('button', { name: /Excluir/ })).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'Visualizar pendência' })).toHaveCount(0);

    const state = await page.evaluate(({ escolaId, compKey }) => {
      const invoice = notasRegistradas.find(item => (
        item.id === 'legacy-unidentified-e2e'
        && item.escolaId === escolaId
        && item.compKey === compKey
      ));
      return {
        type: invoice?.tipo,
        hasIndividualAnalysis: Object.prototype.hasOwnProperty.call(
          invoice || {},
          'analiseDocumentoFiscal'
        )
      };
    }, context);

    expect(state).toEqual({
      type: 'a_identificar',
      hasIndividualAnalysis: false
    });
  });

});

'use strict';

const { test, expect } = require('@playwright/test');

async function waitReady(page) {
  await page.goto('/');
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

function fiscalRow(page) {
  return page.locator('#prontuario-verif-rows tr[data-document-key="notaFiscal"]').first();
}

async function prepareProjectionContext(page, kind) {
  return page.evaluate(targetKind => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) throw new Error('Escola determinística não encontrada.');
    const programaId = escola.programasIds[0];
    const programa = programas.find(item => item.id === programaId);
    const compKey = `${competencia}_${programaId}`;
    const invoiceId = targetKind === 'permanente' ? 'retify-permanent-e2e' : 'retify-service-e2e';
    const assetId = 'retify-permanent-asset-e2e';
    const pendencyId = `${invoiceId}-pendency`;

    verificacoes[escola.id] = verificacoes[escola.id] || {};
    verificacoes[escola.id][compKey] = {
      bonificacao: {
        extCC: '', extINV: '', notaFiscal: 'Sim',
        consAssessoria: targetKind === 'servico' ? 'Sim' : 'Não se aplica',
        consEnviada: targetKind === 'servico',
        declBBAgil: '',
        encampInventario: targetKind === 'permanente' ? 'Sim' : 'Não se aplica'
      },
      analise: {
        extCC: 'Não analisado', extINV: 'Não analisado', notaFiscal: 'Incorreto',
        consAssessoria: 'Correto', declBBAgil: 'Não analisado',
        encampInventario: 'Correto'
      },
      resultadoBonif: ''
    };

    for (let index = notasRegistradas.length - 1; index >= 0; index -= 1) {
      if (notasRegistradas[index].escolaId === escola.id && notasRegistradas[index].compKey === compKey) {
        notasRegistradas.splice(index, 1);
      }
    }
    for (let index = bens.length - 1; index >= 0; index -= 1) {
      if (bens[index].escolaId === escola.id && bens[index].competencia === competencia) {
        bens.splice(index, 1);
      }
    }
    for (let index = pendencias.length - 1; index >= 0; index -= 1) {
      const p = pendencias[index];
      if (p.escolaId === escola.id && (p.competenciaOrigem || p.competencia) === competencia) {
        pendencias.splice(index, 1);
      }
    }

    const invoice = {
      id: invoiceId,
      escolaId: escola.id,
      compKey,
      competencia,
      programaId,
      tipo: targetKind,
      numero: targetKind === 'permanente' ? 'NF-PERM-ANTIGA' : 'NF-SERV-ANTIGA',
      desc: targetKind === 'permanente' ? 'Notebook antigo' : 'Manutenção antiga',
      descricao: targetKind === 'permanente' ? 'Notebook antigo' : 'Manutenção antiga',
      valor: targetKind === 'permanente' ? 5000 : 800,
      bemId: targetKind === 'permanente' ? assetId : null,
      analiseDocumentoFiscal: 'Incorreto',
      consultaAssessoriaEnviada: targetKind === 'servico',
      analiseConsultaAssessoria: targetKind === 'servico' ? 'Correto' : undefined,
      dataRegistro: '2026-09-01T12:00:00.000Z',
      rowVersion: 2
    };
    notasRegistradas.push(invoice);

    if (targetKind === 'permanente') {
      bens.push({
        id: assetId,
        escolaId: escola.id,
        competencia,
        item: `${programa?.name || programaId} - Notebook antigo`,
        descricao: `${programa?.name || programaId} - Notebook antigo`,
        tipo: 'permanente',
        valor: 5000,
        notaFiscal: 'NF-PERM-ANTIGA',
        processoInventario: 'PROC-HISTORICO-001',
        status: 'Inventariada',
        rowVersion: 3
      });
    }

    const documentKey = targetKind === 'servico' ? 'consAssessoria' : 'notaFiscal';
    const opened = RadarPendencias.createDocumentPendency({
      id: pendencyId,
      escolaId: escola.id,
      competencia,
      programaId,
      documentoKey: documentKey,
      registeredInvoiceId: invoiceId,
      item: targetKind === 'servico' ? 'Consulta Assessoria' : 'Nota Fiscal',
      erros: ['Documento ausente'],
      observacao: 'Histórico original.',
      dataAbertura: '2026-09-01'
    }, {
      eventId: `${pendencyId}-event`,
      at: '2026-09-01T12:00:00.000Z',
      usuario: 'Teste',
      perfil: 'controlador'
    });
    opened.documentSnapshot = {
      registeredInvoiceId: invoiceId,
      tipo: targetKind,
      numero: invoice.numero,
      descricao: invoice.desc,
      valor: invoice.valor
    };
    pendencias.push(opened);

    activeProntuarioCompetencia = competencia;
    rebuildOperationalIndexes();
    switchView('prontuario', escola.id);
    return {
      escolaId: escola.id,
      compKey,
      competencia,
      programaId,
      programName: programa?.name || programaId,
      invoiceId,
      assetId,
      pendencyId
    };
  }, kind);
}

test.describe('Retificação auditável — projeções derivadas', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await waitReady(page);
  });

  test('bem permanente atualiza Capital/Inventário e preserva identidade patrimonial terminal', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    const context = await prepareProjectionContext(page, 'permanente');
    const row = fiscalRow(page).locator(`.invoice-document-row[data-invoice-id="${context.invoiceId}"]`);

    await row.getByRole('button', { name: /Editar NF/ }).click();
    await expect(page.locator('#nota-tipo')).toBeDisabled();
    await page.locator('#nota-desc').fill('Notebook corrigido');
    await page.locator('#nota-numero').fill('NF-PERM-CORRIGIDA');
    await page.locator('#nota-valor').fill('5250.75');
    await page.locator('#form-dados-nota button[type="submit"]').click();
    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);

    const state = await page.evaluate(({ invoiceId, assetId, pendencyId }) => {
      const invoice = notasRegistradas.find(item => item.id === invoiceId);
      const asset = bens.find(item => item.id === assetId);
      const pendency = pendencias.find(item => item.id === pendencyId);
      return {
        invoice: { id: invoice?.id, desc: invoice?.desc, numero: invoice?.numero, valor: invoice?.valor, bemId: invoice?.bemId },
        asset: {
          id: asset?.id,
          item: asset?.item,
          notaFiscal: asset?.notaFiscal,
          valor: asset?.valor,
          status: asset?.status,
          processoInventario: asset?.processoInventario
        },
        pendency: { id: pendency?.id, status: pendency?.status, snapshot: pendency?.documentSnapshot }
      };
    }, context);

    expect(state.invoice).toEqual({
      id: context.invoiceId,
      desc: 'Notebook corrigido',
      numero: 'NF-PERM-CORRIGIDA',
      valor: 5250.75,
      bemId: context.assetId
    });
    expect(state.asset).toEqual({
      id: context.assetId,
      item: `${context.programName} - Notebook corrigido`,
      notaFiscal: 'NF-PERM-CORRIGIDA',
      valor: 5250.75,
      status: 'Inventariada',
      processoInventario: 'PROC-HISTORICO-001'
    });
    expect(state.pendency.id).toBe(context.pendencyId);
    expect(state.pendency.status).toBe('Aberta');
    expect(state.pendency.snapshot.numero).toBe('NF-PERM-ANTIGA');
    expect(state.pendency.snapshot.valor).toBe(5000);
  });

  test('serviço atualiza a projeção corrente de Assessoria sem reescrever a Pendência histórica', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    const context = await prepareProjectionContext(page, 'servico');
    const row = fiscalRow(page).locator(`.invoice-document-row[data-invoice-id="${context.invoiceId}"]`);

    await row.getByRole('button', { name: /Editar NF/ }).click();
    await expect(page.locator('#nota-tipo')).toBeDisabled();
    await page.locator('#nota-desc').fill('Manutenção elétrica corrigida');
    await page.locator('#nota-numero').fill('NF-SERV-CORRIGIDA');
    await page.locator('#nota-valor').fill('950');
    await page.locator('#form-dados-nota button[type="submit"]').click();
    await expect(page.locator('#modal-dados-nota')).not.toHaveClass(/show/);

    const state = await page.evaluate(({ invoiceId, pendencyId }) => {
      const invoice = notasRegistradas.find(item => item.id === invoiceId);
      const pendency = pendencias.find(item => item.id === pendencyId);
      return {
        invoice: {
          id: invoice?.id,
          desc: invoice?.desc,
          numero: invoice?.numero,
          valor: invoice?.valor,
          tipo: invoice?.tipo,
          consultaAssessoriaEnviada: invoice?.consultaAssessoriaEnviada,
          analiseConsultaAssessoria: invoice?.analiseConsultaAssessoria
        },
        pendency: { id: pendency?.id, status: pendency?.status, snapshot: pendency?.documentSnapshot }
      };
    }, context);

    expect(state.invoice).toEqual({
      id: context.invoiceId,
      desc: 'Manutenção elétrica corrigida',
      numero: 'NF-SERV-CORRIGIDA',
      valor: 950,
      tipo: 'servico',
      consultaAssessoriaEnviada: true,
      analiseConsultaAssessoria: 'Correto'
    });
    expect(state.pendency.id).toBe(context.pendencyId);
    expect(state.pendency.status).toBe('Aberta');
    expect(state.pendency.snapshot.numero).toBe('NF-SERV-ANTIGA');

    await expect(page.locator('.service-advisory-description').filter({ hasText: 'Manutenção elétrica corrigida' }).first()).toBeVisible();
  });
});

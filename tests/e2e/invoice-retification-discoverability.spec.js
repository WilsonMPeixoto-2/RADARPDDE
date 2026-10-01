'use strict';

const { test, expect } = require('@playwright/test');

async function waitForProductExtensions(page) {
  await page.evaluate(() => window.RadarProductExtensionsReady);
}

async function prepareRetificationContext(page, { unidentified = false } = {}) {
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
    const invoiceId = isUnidentified
      ? 'ux-retification-unidentified'
      : 'ux-retification-invoice';
    const pendencyId = isUnidentified
      ? 'ux-retification-pendency-unidentified'
      : 'ux-retification-pendency-invoice';

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
      const pendency = pendencias[index];
      if (
        pendency.escolaId === escola.id
        && (pendency.competenciaOrigem || pendency.competencia) === competencia
        && pendency.programaId === programaId
        && pendency.documentoKey === 'notaFiscal'
      ) pendencias.splice(index, 1);
    }

    const invoice = {
      id: invoiceId,
      escolaId: escola.id,
      compKey,
      competencia,
      programaId,
      tipo: isUnidentified ? 'a_identificar' : 'consumo',
      numero: isUnidentified ? 'REF-UX-ANTIGA' : 'NF-UX-ANTIGA',
      desc: isUnidentified ? 'Débito ainda não identificado' : 'Material pedagógico antigo',
      descricao: isUnidentified ? 'Débito ainda não identificado' : 'Material pedagógico antigo',
      valor: isUnidentified ? 321.45 : 100,
      bemId: null,
      analiseDocumentoFiscal: 'Incorreto',
      dataRegistro: '2026-09-01T12:00:00.000Z',
      rowVersion: 1
    };
    notasRegistradas.push(invoice);

    const pendency = RadarPendencias.createDocumentPendency({
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
    pendency.documentSnapshot = {
      registeredInvoiceId: invoiceId,
      tipo: invoice.tipo,
      numero: invoice.numero,
      descricao: invoice.desc,
      valor: invoice.valor
    };
    pendencias.push(pendency);

    activeProntuarioCompetencia = competencia;
    rebuildOperationalIndexes();
    switchView('prontuario', escola.id);

    return { escolaId: escola.id, compKey, invoiceId, pendencyId };
  }, { isUnidentified: unidentified });
}

function invoiceRow(page, invoiceId) {
  return page.locator(
    `#prontuario-verif-rows tr[data-document-key="notaFiscal"] .invoice-document-row[data-invoice-id="${invoiceId}"]`
  );
}

test.describe('Descoberta da retificação de lançamentos', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await page.goto('/');
    await waitForProductExtensions(page);
  });

  test('controlador encontra Editar lançamento e entende o que pode corrigir com Pendência ativa', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    const context = await prepareRetificationContext(page);
    const row = invoiceRow(page, context.invoiceId);

    const editButton = row.getByRole('button', { name: /Editar lançamento/ });
    await expect(editButton).toBeVisible();
    await expect(editButton).toContainText('Editar lançamento');
    await editButton.click();

    const guidance = page.locator('[data-auditable-retification-guidance]');
    await expect(guidance).toBeVisible();
    await expect(guidance).toContainText('Você pode corrigir descrição, número/referência e valor.');
    await expect(guidance).toContainText('A Pendência e o histórico serão preservados.');
    await expect(page.locator('#nota-tipo')).toBeDisabled();
    await expect(page.locator('[data-auditable-retification-type-hint]'))
      .toContainText('A classificação fica preservada porque este lançamento já possui histórico de Pendência.');

    await page.locator('#nota-desc').fill('Material pedagógico corrigido');
    await page.locator('#nota-numero').fill('NF-UX-CORRIGIDA');
    await page.locator('#nota-valor').fill('150');
    await page.locator('#form-dados-nota button[type="submit"]').click();

    const state = await page.evaluate(({ invoiceId, pendencyId }) => {
      const invoice = notasRegistradas.find(item => item.id === invoiceId);
      const pendency = pendencias.find(item => item.id === pendencyId);
      return {
        invoice: {
          id: invoice?.id,
          type: invoice?.tipo,
          description: invoice?.desc,
          number: invoice?.numero,
          amount: invoice?.valor
        },
        pendency: {
          id: pendency?.id,
          status: pendency?.status,
          snapshot: pendency?.documentSnapshot
        }
      };
    }, context);

    expect(state.invoice).toEqual({
      id: context.invoiceId,
      type: 'consumo',
      description: 'Material pedagógico corrigido',
      number: 'NF-UX-CORRIGIDA',
      amount: 150
    });
    expect(state.pendency.id).toBe(context.pendencyId);
    expect(state.pendency.status).toBe('Aberta');
    expect(state.pendency.snapshot.numero).toBe('NF-UX-ANTIGA');
    expect(state.pendency.snapshot.valor).toBe(100);
  });

  test('a identificar comunica que os dados provisórios podem ser corrigidos sem mudar a natureza', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');
    const context = await prepareRetificationContext(page, { unidentified: true });
    const row = invoiceRow(page, context.invoiceId);

    const editButton = row.getByRole('button', { name: /Editar lançamento/ });
    await expect(editButton).toBeVisible();
    await expect(editButton).toContainText('Editar lançamento');
    await editButton.click();

    const guidance = page.locator('[data-auditable-retification-guidance]');
    await expect(guidance).toContainText('Você pode corrigir descrição, referência e valor.');
    await expect(guidance).toContainText('A despesa continuará “A identificar”.');
    await expect(page.locator('#nota-tipo')).toHaveValue('a_identificar');
    await expect(page.locator('#nota-tipo')).toBeDisabled();
    await expect(page.locator('[data-auditable-retification-type-hint]'))
      .toContainText('A classificação definitiva continua em “Registrar envio / identificação da despesa”.');
  });
});

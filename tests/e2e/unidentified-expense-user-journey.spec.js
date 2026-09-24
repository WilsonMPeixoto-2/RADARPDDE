'use strict';

const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

async function prepareSchool(page, { withOpenUnidentified = false } = {}) {
  await page.goto('/');
  await selectFixtureCompetence(page, '2026-05');

  return page.evaluate(async ({ seedOpen }) => {
    switchProfile('controlador');
    const competence = window.RadarCompetenceContext.getState().activeKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competence)
    ));
    if (!school) throw new Error('Escola de fixture não encontrada.');

    const compKey = competence + '_BASIC';
    verificacoes[school.id] ||= {};
    const verification = RadarFluxoOperacional.createEmptyVerification('BASIC');
    verification.bonificacao.notaFiscal = 'Não';
    verification.analise.notaFiscal = 'Não analisado';
    verificacoes[school.id][compKey] = verification;

    notasRegistradas = notasRegistradas.filter(item => !(
      item.escolaId === school.id && item.compKey === compKey
    ));
    pendencias = pendencias.filter(item => !(
      String(item.escolaId) === String(school.id)
      && String(item.competenciaOrigem || item.competencia) === competence
      && String(item.programaId || '') === 'BASIC'
      && item.documentoKey === 'notaFiscal'
    ));

    let seeded = null;
    if (seedOpen) {
      seeded = await window.RadarApplicationServices.invoices.saveUnidentifiedExpenseWithPendency({
        schoolId: school.id,
        compKey,
        description: 'Débito bancário ainda sem documento',
        expenseType: 'a_identificar',
        invoiceNumber: '',
        amount: 145.67,
        profile: 'controlador',
        pendencyObservation: 'Aguardando documento para identificar a despesa.'
      });
    }

    rebuildOperationalIndexes();
    persist();
    activeProntuarioCompetencia = competence;
    switchView('prontuario', school.id);

    return {
      schoolId: school.id,
      competence,
      compKey,
      seededPendencyId: seeded?.value?.pendency?.id || null
    };
  }, { seedOpen: withOpenUnidentified });
}

async function settleVisualState(page) {
  // A interface usa transições curtas e reconciliação incremental. Para a auditoria
  // visual, o estado precisa continuar correto depois que essas tarefas terminarem.
  await page.waitForTimeout(350);
}

async function attachScreenshot(page, testInfo, name) {
  await testInfo.attach(name, {
    // O Prontuário usa rolagem interna; capturar o viewport reproduz o que o usuário
    // realmente vê e evita que a captura fullPage altere a composição observada.
    body: await page.screenshot(),
    contentType: 'image/png'
  });
}

test.describe('Jornada real — Despesa a identificar', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Auditoria orientada ao fluxo desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('conduz um usuário do débito sem documento até a reanálise sem atalhos internos', async ({ page }, testInfo) => {
    const context = await prepareSchool(page);
    await attachScreenshot(page, testInfo, '01-prontuario-inicio-fluxo');

    const start = page.getByRole('button', {
      name: 'Registrar despesa a identificar',
      exact: true
    });
    await expect(start).toBeVisible();
    await expect(start).toHaveAttribute(
      'data-tooltip',
      'Use quando houver uma saída no extrato, mas a documentação ainda não permitir identificar a natureza da despesa ou o documento fiscal.'
    );
    await start.hover();
    await expect.poll(async () => start.evaluate(element => {
      const style = getComputedStyle(element, '::after');
      return {
        content: style.content,
        opacity: Number.parseFloat(style.opacity),
        visibility: style.visibility,
        bottom: style.bottom,
        left: style.left
      };
    })).toMatchObject({
      content: expect.stringContaining('saída no extrato'),
      opacity: 1,
      visibility: 'visible',
      left: '0px'
    });
    await attachScreenshot(page, testInfo, '01b-ajuda-contextual-despesa-a-identificar');
    await start.click();

    const expenseModal = page.locator('#modal-dados-nota');
    await expect(expenseModal).toHaveClass(/show/);
    await expect(expenseModal.getByRole('heading', {
      name: 'Registrar despesa a identificar',
      exact: true
    })).toBeVisible();
    await expect(expenseModal.locator('#nota-modal-intro')).toContainText('Não invente');
    await expect(expenseModal.getByLabel(
      'Número da Nota Fiscal (opcional neste estágio)',
      { exact: true }
    )).not.toHaveAttribute('required', '');

    await expenseModal.getByLabel('Descrição do Gasto', { exact: true })
      .fill('Débito visto no extrato; documento ainda não recebido');
    await expenseModal.getByLabel('Valor do Gasto (R$)', { exact: true }).fill('123.45');
    await expenseModal.getByRole('button', { name: 'Registrar Despesa', exact: true }).click();
    await expect(expenseModal).not.toHaveClass(/show/);

    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Próximo passo', { exact: true })).toBeVisible();
    await expect(drawer).toContainText('Quando a documentação chegar');
    await attachScreenshot(page, testInfo, '02-pendencia-proximo-passo');

    const flowIds = await page.evaluate(({ schoolId, compKey }) => {
      const invoice = [...notasRegistradas].reverse().find(item => (
        item.escolaId === schoolId
        && item.compKey === compKey
        && item.tipo === 'a_identificar'
      ));
      const pendency = invoice
        ? [...pendencias].reverse().find(item => (
            String(item.registeredInvoiceId || item.registered_invoice_id || '')
              === String(invoice.id)
            && item.status === 'Aberta'
          ))
        : null;
      return {
        invoiceId: invoice?.id || null,
        pendencyId: pendency?.id || null
      };
    }, context);
    expect(flowIds.invoiceId).toBeTruthy();
    expect(flowIds.pendencyId).toBeTruthy();

    const identifyExpense = drawer.getByRole('button', {
      name: 'Identificar despesa',
      exact: true
    });
    await expect(identifyExpense).toBeVisible();

    const initialInvoiceRow = page.locator(
      `.invoice-document-row[data-invoice-id="${flowIds.invoiceId}"]`
    );
    await expect(initialInvoiceRow).toContainText('Aguardando identificação');
    await expect(
      initialInvoiceRow.getByRole('button', { name: 'Identificar despesa', exact: true })
    ).toBeVisible();
    await expect(
      initialInvoiceRow.getByRole('button', { name: 'Visualizar pendência', exact: true })
    ).toBeVisible();

    await page.locator('#nav-pendencias').click();
    await expect(page.getByRole('heading', { name: 'Pendências operacionais' })).toBeVisible();
    const task9Row = page.locator(
      `[data-pendency-id="${flowIds.pendencyId}"]`
    ).filter({ visible: true }).first();
    await expect(task9Row).toBeVisible();
    await expect(
      task9Row.getByRole('button', { name: 'Identificar despesa', exact: true })
    ).toBeVisible();
    await expect(
      task9Row.getByRole('button', { name: 'Registrar novo envio', exact: true })
    ).toHaveCount(0);

    await task9Row.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
    const task9Drawer = page.locator('#pendency-detail-drawer');
    await expect(task9Drawer).toBeVisible();
    await expect(
      task9Drawer.getByRole('button', { name: 'Identificar despesa', exact: true })
    ).toBeVisible();

    await page.evaluate(({ schoolId, competence }) => {
      activeProntuarioCompetencia = competence;
      switchView('prontuario', schoolId);
    }, { schoolId: context.schoolId, competence: context.competence });
    await expect(page.locator('.prontuario-school-header')).toBeVisible();

    const restoredInvoiceRow = page.locator(
      `.invoice-document-row[data-invoice-id="${flowIds.invoiceId}"]`
    );
    await expect(restoredInvoiceRow).toContainText('Aguardando identificação');
    await restoredInvoiceRow.getByRole('button', {
      name: 'Identificar despesa',
      exact: true
    }).click();

    const submissionModal = page.locator('#modal-registrar-envio');
    await expect(submissionModal).toHaveClass(/show/);
    await expect(submissionModal.getByRole('heading', {
      name: 'Identificar despesa',
      exact: true
    })).toBeVisible();
    await expect(submissionModal.locator('.modal-subtitle')).toContainText(
      'sem criar um novo lançamento'
    );
    await settleVisualState(page);
    await expect(submissionModal).toHaveClass(/show/);
    await expect(submissionModal.getByRole('heading', {
      name: 'Identificar despesa',
      exact: true
    })).toBeVisible();
    const identifySubmit = submissionModal.getByRole('button', {
      name: 'Identificar e enviar para reanálise',
      exact: true
    });
    await expect(identifySubmit).toBeVisible();
    const submitBox = await identifySubmit.boundingBox();
    const viewport = page.viewportSize();
    expect(submitBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(submitBox.y).toBeGreaterThanOrEqual(0);
    expect(submitBox.y + submitBox.height).toBeLessThanOrEqual(viewport.height);
    await attachScreenshot(page, testInfo, '03-identificar-despesa-novo-envio');

    await submissionModal.getByLabel('Tipo da despesa', { exact: true })
      .selectOption('consumo');
    await submissionModal.getByLabel('Número ou referência do documento', { exact: true })
      .fill('NF-UX-001');
    await submissionModal.getByLabel('Descrição', { exact: true })
      .fill('Material de consumo identificado');
    await submissionModal.getByLabel('Valor (R$)', { exact: true }).fill('123.45');
    await submissionModal.getByLabel(
      'Data em que o arquivo foi disponibilizado no Drive',
      { exact: true }
    ).fill('2026-09-23');
    await submissionModal.getByLabel('Observação', { exact: true })
      .fill('Documento recebido e conferido para reanálise.');
    await submissionModal.getByRole('button', {
      name: 'Identificar e enviar para reanálise',
      exact: true
    }).click();
    await expect(submissionModal).not.toHaveClass(/show/);
    await expect(page.locator('#pendency-notice')).toHaveText(
      'Despesa identificada e documento enviado para reanálise.'
    );

    const waitingStatus = page.locator('.invoice-document-status').filter({
      hasText: 'Aguardando reanálise'
    });
    const reanalyzeAction = page.getByRole('button', {
      name: 'Reanalisar',
      exact: true
    }).first();
    await expect(waitingStatus).toHaveCount(1);
    await expect(waitingStatus).toBeVisible();
    await expect(reanalyzeAction).toBeVisible();
    await settleVisualState(page);
    await expect(submissionModal).not.toHaveClass(/show/);
    await expect(waitingStatus).toBeVisible();
    await expect(reanalyzeAction).toBeVisible();
    await attachScreenshot(page, testInfo, '04-aguardando-reanalise-com-acao');
    await reanalyzeAction.click();

    const reanalysisModal = page.locator('#modal-reanalisar-pendencia');
    await expect(reanalysisModal).toHaveClass(/show/);
    await reanalysisModal.getByLabel('Resultado da reanálise', { exact: true })
      .selectOption('correto');
    await reanalysisModal.getByLabel('Observação da análise', { exact: true })
      .fill('Documento correto após identificação da despesa.');
    await reanalysisModal.getByRole('button', {
      name: 'Confirmar reanálise',
      exact: true
    }).click();
    await expect(reanalysisModal).not.toHaveClass(/show/);
    await expect(page.locator('#pendency-notice')).toHaveText(
      'Reanálise registrada com sucesso.'
    );

    const finalState = await page.evaluate(({ schoolId, compKey }) => {
      const invoice = notasRegistradas.find(item => (
        item.escolaId === schoolId
        && item.compKey === compKey
        && item.numero === 'NF-UX-001'
      ));
      const activePendency = invoice
        ? pendencias.find(item => (
            String(item.registeredInvoiceId || item.registered_invoice_id || '')
              === String(invoice.id)
            && ['Aberta', 'Aguardando reanálise'].includes(item.status)
          ))
        : null;
      return {
        invoiceType: invoice?.tipo || null,
        invoiceAnalysis: invoice?.analiseDocumentoFiscal || null,
        activePendency: activePendency?.status || null
      };
    }, context);

    expect(finalState).toEqual({
      invoiceType: 'consumo',
      // A competência usada pela jornada é maio/2026 e o arquivo é disponibilizado
      // em 23/09/2026. O resultado canônico, portanto, é correto após o prazo.
      invoiceAnalysis: 'Correto (Atrasado)',
      activePendency: null
    });
    const resolvedInvoice = page.locator('.invoice-document-row').filter({
      hasText: 'NF: NF-UX-001'
    });
    await expect(resolvedInvoice).toContainText('Correto (Atrasado)');
    await expect(resolvedInvoice.getByRole('button', {
      name: 'Reanalisar',
      exact: true
    })).toHaveCount(0);
    await settleVisualState(page);
    await expect(page.locator('.prontuario-flowbar')).toBeVisible();
    await expect(resolvedInvoice).toBeVisible();
    await expect(resolvedInvoice).toContainText('Correto (Atrasado)');
    await attachScreenshot(page, testInfo, '05-reanalise-concluida');
  });

  test('separa preparar comunicação de registrar contato efetivamente realizado', async ({ page, context }, testInfo) => {
    const fixture = await prepareSchool(page, { withOpenUnidentified: true });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const contactCountBefore = await page.evaluate(() => contatos.length);

    const generate = page.getByRole('button', { name: 'Gerar comunicação', exact: true });
    await expect(generate).toBeVisible();
    await generate.click();

    const communicationModal = page.locator('#modal-cobranca');
    await expect(communicationModal).toHaveClass(/show/);
    await expect(communicationModal.getByText('Pendências selecionadas', { exact: true }))
      .toBeVisible();
    await expect(communicationModal.getByRole('button', {
      name: 'Copiar texto',
      exact: true
    })).toHaveCount(1);
    await settleVisualState(page);
    await expect(communicationModal).toHaveClass(/show/);
    await expect(communicationModal.getByText('Pré-visualização da mensagem', { exact: true }))
      .toBeVisible();
    await attachScreenshot(page, testInfo, '06-preparar-comunicacao');

    let copiedMessage = '';
    page.once('dialog', async dialog => {
      copiedMessage = dialog.message();
      await dialog.accept();
    });
    await communicationModal.getByRole('button', { name: 'Copiar texto', exact: true }).click();
    await expect(communicationModal).not.toHaveClass(/show/);
    expect(copiedMessage).toContain('use “Registrar contato”');

    expect(await page.evaluate(() => contatos.length)).toBe(contactCountBefore);

    await page.getByRole('button', { name: 'Registrar contato', exact: true }).click();
    const contactModal = page.locator('#modal-contato');
    await expect(contactModal).toHaveClass(/show/);
    await contactModal.getByLabel('Tipo de Contato', { exact: true }).selectOption('WhatsApp');
    await contactModal.getByLabel('Vincular a uma Pendência (Opcional)', { exact: true })
      .selectOption(String(fixture.seededPendencyId));
    await contactModal.getByLabel('Descrição do Atendimento', { exact: true })
      .fill('Mensagem encaminhada ao diretor pelo WhatsApp.');
    await contactModal.getByRole('button', { name: 'Registrar', exact: true }).click();
    await expect(contactModal).not.toHaveClass(/show/);
    const successNotice = page.locator('#pendency-notice');
    await expect(successNotice).toBeVisible();
    await expect(successNotice).toHaveText('Contato registrado com sucesso.');
    await expect(successNotice).toHaveAttribute('data-radar-save-feedback', 'success');

    const recorded = await page.evaluate(pendencyId => {
      const last = contatos.at(-1);
      return {
        count: contatos.length,
        type: last?.tipo || last?.channel || null,
        pendencyId: last?.pendenciaId || last?.pendencyId || null,
        description: last?.descricao || last?.description || ''
      };
    }, fixture.seededPendencyId);

    expect(recorded.count).toBe(contactCountBefore + 1);
    expect(recorded.type).toBe('WhatsApp');
    expect(String(recorded.pendencyId)).toBe(String(fixture.seededPendencyId));
    expect(recorded.description).toContain('Mensagem encaminhada ao diretor');

    await page.getByRole('tab', { name: 'Histórico de Contatos', exact: true }).click();
    await expect(page.locator('#tab-contatos')).toContainText(
      'Mensagem encaminhada ao diretor pelo WhatsApp.'
    );
    await settleVisualState(page);
    await expect(page.getByRole('tab', {
      name: 'Histórico de Contatos',
      exact: true
    })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tab-contatos')).toBeVisible();
    await expect(page.locator('#tab-contatos')).toContainText(
      'Mensagem encaminhada ao diretor pelo WhatsApp.'
    );
    await page.mouse.move(12, 12);
    await page.waitForTimeout(160);
    await attachScreenshot(page, testInfo, '07-historico-contato-registrado');
  });
});

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
    await expect(expenseModal.locator('#nota-modal-intro'))
      .toContainText('classificará automaticamente');
    await expect(expenseModal.locator('[data-expense-context]'))
      .toContainText('05/2026 ·');
    await expect(expenseModal.locator('[data-unidentified-expense-classification]'))
      .toBeVisible();
    await expect(expenseModal.locator('[data-unidentified-expense-classification]'))
      .toContainText('Despesa a identificar');
    await expect(expenseModal.locator('#nota-tipo')).toHaveValue('a_identificar');
    await expect(expenseModal.locator('#nota-tipo')).toBeDisabled();
    await expect(expenseModal.locator('#nota-tipo')).not.toBeVisible();
    await expect(expenseModal.getByLabel(
      'Referência provisória (opcional)',
      { exact: true }
    )).not.toHaveAttribute('required', '');

    await expenseModal.getByLabel('Descrição provisória da saída', { exact: true })
      .fill('Débito visto no extrato; documento ainda não recebido');
    await expenseModal.getByLabel('Valor do Gasto (R$)', { exact: true }).fill('123.45');
    await expenseModal.locator('#nota-unidentified-observation')
      .fill('Débito localizado no extrato; aguardando documentação da unidade.');
    await expenseModal.getByRole('button', { name: 'Registrar Despesa', exact: true }).click();
    await expect(expenseModal).not.toHaveClass(/show/);
    await expect(page.locator('#pendency-notice')).toHaveText(
      'Despesa a identificar e Pendência registradas com sucesso.'
    );

    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Próximo passo', { exact: true })).toBeVisible();
    await expect(drawer).toContainText('Quando a documentação chegar');
    await expect(page.locator('.invoice-document-row .invoice-document-title-line > strong'))
      .toContainText('Débito visto no extrato; documento ainda não recebido');
    await attachScreenshot(page, testInfo, '02-pendencia-proximo-passo');
    const newSubmission = drawer.getByRole('button', {
      name: 'Registrar envio / identificação da despesa',
      exact: true
    });
    await expect(newSubmission).toBeVisible();
    await newSubmission.click();

    const submissionModal = page.locator('#modal-registrar-envio');
    await expect(submissionModal).toHaveClass(/show/);
    await expect(submissionModal.getByRole('heading', {
      name: 'Registrar envio e identificar despesa',
      exact: true
    })).toBeVisible();
    await expect(submissionModal.locator('.modal-subtitle')).toContainText(
      'mesmo lançamento e a mesma Pendência'
    );
    await settleVisualState(page);
    await expect(submissionModal).toHaveClass(/show/);
    await expect(submissionModal.getByRole('heading', {
      name: 'Registrar envio e identificar despesa',
      exact: true
    })).toBeVisible();
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
      name: 'Registrar e enviar para reanálise',
      exact: true
    }).click();
    await expect(submissionModal).not.toHaveClass(/show/);
    await expect(page.locator('#pendency-notice')).toHaveText(
      'Despesa identificada e documento enviado para reanálise.'
    );

    const waiting = page.locator('.invoice-reanalysis-status-button').filter({
      hasText: 'Aguardando reanálise'
    });
    await expect(waiting).toHaveCount(1);
    await expect(waiting).toBeVisible();
    await settleVisualState(page);
    await expect(submissionModal).not.toHaveClass(/show/);
    await expect(waiting).toBeVisible();
    await attachScreenshot(page, testInfo, '04-aguardando-reanalise-clicavel');
    await waiting.click();

    const reanalysisModal = page.locator('#modal-reanalisar-pendencia');
    await expect(reanalysisModal).toHaveClass(/show/);
    await expect(reanalysisModal.locator('.reanalysis-document-identity'))
      .toContainText('Material de consumo identificado');
    await expect(reanalysisModal.locator('#reanalisar-tentativa-atual'))
      .toContainText('Maio/2026');
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
      name: 'Aguardando reanálise',
      exact: true
    })).toHaveCount(0);
    await settleVisualState(page);
    await expect(page.locator('.prontuario-flowbar')).toBeVisible();
    await expect(resolvedInvoice).toBeVisible();
    await expect(resolvedInvoice).toContainText('Correto (Atrasado)');
    await attachScreenshot(page, testInfo, '05-reanalise-concluida');
  });

  test('permite retificar os dados provisórios pelo drawer sem identificar a despesa', async ({ page }) => {
    const context = await prepareSchool(page);

    await page.getByRole('button', {
      name: 'Registrar despesa a identificar',
      exact: true
    }).click();

    const expenseModal = page.locator('#modal-dados-nota');
    await expenseModal.getByLabel('Descrição provisória da saída', { exact: true })
      .fill('Débito provisório a conferir');
    await expenseModal.getByLabel('Valor do Gasto (R$)', { exact: true }).fill('210.50');
    await expenseModal.locator('#nota-unidentified-observation')
      .fill('Primeira observação provisória.');
    await expenseModal.getByRole('button', {
      name: 'Registrar Despesa',
      exact: true
    }).click();

    const drawer = page.locator('#pendency-preview-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Dados provisórios', { exact: true })).toBeVisible();
    await expect(drawer).toContainText('Débito provisório a conferir');
    await expect(drawer).toContainText('R$ 210,50');
    await expect(drawer.getByRole('button', {
      name: 'Editar dados da despesa',
      exact: true
    })).toBeVisible();
    await expect(drawer.getByRole('button', {
      name: 'Editar detalhes',
      exact: true
    })).toBeVisible();

    const provisionalIds = await page.evaluate(({ schoolId, compKey }) => {
      const invoice = notasRegistradas.find(item => (
        item.escolaId === schoolId
        && item.compKey === compKey
        && item.tipo === 'a_identificar'
        && item.desc === 'Débito provisório a conferir'
      ));
      const pendency = invoice
        ? pendencias.find(item => (
            String(item.registeredInvoiceId || item.registered_invoice_id || '')
              === String(invoice.id)
          ))
        : null;
      return {
        invoiceId: invoice?.id || null,
        pendencyId: pendency?.id || null
      };
    }, context);
    expect(provisionalIds.invoiceId).toBeTruthy();
    expect(provisionalIds.pendencyId).toBeTruthy();

    await drawer.getByRole('button', {
      name: 'Editar dados da despesa',
      exact: true
    }).click();

    await expect(expenseModal).toHaveClass(/show/);
    await expect(expenseModal.getByRole('heading', {
      name: 'Editar despesa a identificar',
      exact: true
    })).toBeVisible();
    await expect(expenseModal.locator('#nota-modal-intro'))
      .toContainText('A Pendência e seu histórico permanecem vinculados');
    await expect(expenseModal.locator('[data-expense-context]'))
      .toContainText('05/2026 ·');
    await expect(expenseModal.locator('#nota-tipo')).toHaveValue('a_identificar');
    await expect(expenseModal.locator('#nota-tipo')).toBeDisabled();
    await expect(expenseModal.locator('#nota-tipo')).not.toBeVisible();
    await expenseModal.getByLabel('Descrição provisória da saída', { exact: true })
      .fill('Débito provisório retificado');
    await expenseModal.getByLabel('Referência provisória (opcional)', { exact: true })
      .fill('REF-EXTRATO-01');
    await expenseModal.getByLabel('Valor do Gasto (R$)', { exact: true }).fill('215.75');
    await expenseModal.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
    await expect(expenseModal).not.toHaveClass(/show/);

    const invoiceRow = page.locator(
      `.invoice-document-row[data-invoice-id="${provisionalIds.invoiceId}"]`
    );
    await expect(invoiceRow).toBeVisible();
    await expect(invoiceRow.locator('.invoice-document-title-line > strong'))
      .toHaveText('Débito provisório retificado');
    await expect(invoiceRow.locator('.invoice-provisional-label'))
      .toContainText('documentação pendente');
    await invoiceRow.getByRole('button', {
      name: 'Visualizar pendência',
      exact: true
    }).click();

    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Débito provisório retificado');
    await expect(drawer).toContainText('R$ 215,75');
    await expect(drawer).toContainText('REF-EXTRATO-01');

    await drawer.getByRole('button', {
      name: 'Editar detalhes',
      exact: true
    }).click();
    await drawer.locator('#pendency-preview-observation')
      .fill('Observação da Pendência retificada pelo usuário.');
    await drawer.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(drawer).toContainText('Observação da Pendência retificada pelo usuário.');

    const state = await page.evaluate(({ invoiceId }) => {
      const invoice = notasRegistradas.find(item => String(item.id) === String(invoiceId));
      const pendency = invoice
        ? pendencias.find(item => (
            String(item.registeredInvoiceId || item.registered_invoice_id || '')
              === String(invoice.id)
          ))
        : null;
      return {
        invoiceId: invoice?.id || null,
        type: invoice?.tipo || null,
        amount: invoice?.valor ?? null,
        reference: invoice?.numero || null,
        pendencyId: pendency?.id || null,
        pendencyStatus: pendency?.status || null,
        pendencyObservation: pendency?.observacao || null
      };
    }, provisionalIds);

    expect(state.invoiceId).toBeTruthy();
    expect(state.pendencyId).toBeTruthy();
    expect(state).toMatchObject({
      type: 'a_identificar',
      amount: 215.75,
      reference: 'REF-EXTRATO-01',
      pendencyStatus: 'Aberta',
      pendencyObservation: 'Observação da Pendência retificada pelo usuário.'
    });
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

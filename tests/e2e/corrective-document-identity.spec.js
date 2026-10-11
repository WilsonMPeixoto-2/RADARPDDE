'use strict';

const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test.afterEach(async ({ page }, testInfo) => {
  if (process.env.RADAR_E2E_CAPTURE !== '1') return;
  await page.bringToFront();
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await Promise.all(document.getAnimations()
      .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
      .map(animation => animation.finished.catch(() => {})));
    await new Promise(requestAnimationFrame);
  });
  await testInfo.attach('document-identity-visible', {
    body: await page.screenshot({ path: testInfo.outputPath('identity-dialog.png') }),
    contentType: 'image/png'
  });
});

// Local fixtures isolate presentation. The audit also exercises these dialogs
// through legitimate Auth/RLS/RPC sessions in a disposable Supabase instance.
async function prepareDocuments(page, { awaiting = false, snapshotOnly = false,
  documentKey = 'notaFiscal', legacy = false, invoiceType = null,
  numbers = ['AUD-ID-A', 'AUD-ID-B'], description = 'Materiais de mesma descrição' } = {}) {
  await page.goto('/');
  await selectFixtureCompetence(page);
  await page.evaluate(() => window.RadarProductExtensionsReady);
  return page.evaluate(options => {
    switchProfile('controlador');
    const programId = options.invoiceType === 'boleto_internet' ? 'CONECTADA' : 'BASIC';
    const school = escolas.find(s => s.programasIds?.includes(programId)
      && isCompetenceInScope(s.competenciaInicial, activeCompetenciaKey));
    if (!school) throw new Error('Fixture escolar ausente.');
    const competence = activeCompetenciaKey;
    const doc = options.documentKey;
    const entries = options.numbers.map((number, index) => {
      const invoice = { id: `identity-invoice-${index}`, escolaId: school.id,
        competencia: competence, programaId: programId, compKey: `${competence}_${programId}`,
        numero: number, tipo: options.invoiceType || (doc === 'consAssessoria' ? 'servico' : 'consumo'),
        desc: options.description, descricao: options.description,
        valor: 100, analiseDocumentoFiscal: 'Incorreto' };
      const id = `identity-pendency-${index}`;
      let pendency = RadarPendencias.createDocumentPendency({
        id, escolaId: school.id, competenciaOrigem: competence, programaId: programId,
        documentoKey: doc, item: `${doc} — ${number}`,
        ...(options.legacy ? {} : { registeredInvoiceId: invoice.id }),
        errosAtuais: ['Documento ausente'], observacao: 'Documento para conferência.',
        dataAbertura: '2026-05-01'
      }, { eventId: `${id}-opened`, at: '2026-05-01T12:00:00.000Z',
        usuario: 'Controlador de teste', perfil: 'Controlador' });
      if (!options.legacy) pendency.documentSnapshot = { ...invoice };
      if (options.awaiting) {
        pendency = RadarPendencias.registerCorrectiveSubmission(pendency, {
          id: `${id}-attempt`, dataDisponibilizacao: '2026-05-02',
          observacao: 'Arquivo corrigido recebido.'
        }, { eventId: `${id}-submitted`, at: '2026-05-02T12:00:00.000Z',
          usuario: 'Controlador de teste', perfil: 'Controlador' });
      }
      return { invoice, pendency };
    });
    pendencias = entries.map(e => e.pendency);
    notasRegistradas = options.snapshotOnly || options.legacy ? [] : entries.map(e => e.invoice);
    rebuildOperationalIndexes();
    switchView('pendencias');
    return entries.map(e => ({ id: e.pendency.id, number: e.invoice.numero }));
  }, { awaiting, snapshotOnly, documentKey, legacy, invoiceType, numbers, description });
}

function pendencyRow(page, id) {
  return page.locator(`[data-pendency-id="${id}"]`).filter({ visible: true }).first();
}

// A button can satisfy Playwright's visible/viewport checks while an ancestor
// clips its lower edge. Check the actual painted/hit-test area of each control.
function completeFooterButtons(dialog) {
  return dialog.locator('.modal-footer button').evaluateAll(buttons => (
    buttons.map(button => {
      const rect = button.getBoundingClientRect();
      const points = [rect.top + 1, rect.bottom - 1].map(y => [rect.x + rect.width / 2, y]);
      return { name: button.textContent.trim(), fullyVisible: points.every(([x, y]) => {
        const target = document.elementFromPoint(x, y);
        return Boolean(target && button.contains(target));
      }) };
    })
  ));
}

async function scrollModalBodyToEnd(page, dialog) {
  const body = dialog.locator('.modal-body');
  await body.hover();
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => body.evaluate(element => (
    element.scrollHeight - element.clientHeight - element.scrollTop <= 1
  ))).toBe(true);
}

test('novo envio identifica a NF entre duas despesas com descrição e valor iguais', async ({ page }) => {
  const [first, second] = await prepareDocuments(page);
  await pendencyRow(page, first.id).getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Registrar novo envio para conferência' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#envio-contexto')).toContainText(first.number);
  await expect(dialog.locator('#envio-contexto')).not.toContainText(second.number);
  await expect(dialog.locator('#envio-contexto')).toContainText('Notas Fiscais');
});

for (const documentKey of ['notaFiscal', 'consAssessoria']) {
  test(`reanálise ${documentKey} preserva número, descrição e dimensão individual`, async ({ page }) => {
    const [first, second] = await prepareDocuments(page, { awaiting: true, documentKey });
    await page.getByRole('tab', { name: /^Aguardando/ }).click();
    await pendencyRow(page, second.id).getByRole('button', { name: 'Reanalisar', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Reanalisar pendência documental' });
    await expect(dialog).toBeVisible();
    const identity = dialog.locator('.reanalysis-document-identity');
    await expect(identity).toContainText(second.number);
    await expect(identity).not.toContainText(first.number);
    await expect(identity).toContainText('Materiais de mesma descrição');
    await expect(identity).toContainText('R$');
    await expect(identity).toContainText(documentKey === 'consAssessoria'
      ? 'Prestação de serviço' : 'Material de consumo');
    await expect(dialog).toContainText(documentKey === 'consAssessoria' ? 'Consulta Assessoria' : 'Notas Fiscais');
  });
}

test('snapshot identifica documento quando a NF não está no contexto carregado', async ({ page }) => {
  const [first] = await prepareDocuments(page, { snapshotOnly: true });
  await pendencyRow(page, first.id).getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
  await expect(page.locator('#envio-contexto')).toContainText(first.number);
});

test('novo envio da Assessoria identifica a própria NF sem trocar a dimensão', async ({ page }) => {
  const [, second] = await prepareDocuments(page, { documentKey: 'consAssessoria' });
  await pendencyRow(page, second.id).getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
  await expect(page.locator('#envio-contexto')).toContainText(`Consulta Assessoria — NF: ${second.number}`);
});

test('documento genérico mantém a dimensão sem receber identidade fiscal', async ({ page }) => {
  const [first] = await prepareDocuments(page, { documentKey: 'extCC', legacy: true });
  await pendencyRow(page, first.id).getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
  const context = page.locator('#envio-contexto');
  await expect(context).toContainText('Extrato Conta Corrente');
  await expect(context).not.toContainText('NF:');
  await expect(context).not.toContainText('Notas Fiscais');
});

test('snapshot de boleto na reanálise preserva referência, tipo e valor', async ({ page }) => {
  const [first] = await prepareDocuments(page, {
    awaiting: true, snapshotOnly: true, invoiceType: 'boleto_internet'
  });
  await page.getByRole('tab', { name: /^Aguardando/ }).click();
  await pendencyRow(page, first.id).getByRole('button', { name: 'Reanalisar', exact: true }).click();
  const identity = page.locator('.reanalysis-document-identity');
  await expect(identity).toContainText(`Boleto Internet: ${first.number}`);
  await expect(identity).toContainText('Boleto de Internet');
  await expect(identity).toContainText('R$');
  await expect(identity).toContainText('Materiais de mesma descrição');
});

for (const awaiting of [false, true]) {
  test(`identidade documental permanece texto seguro no ${awaiting ? 'reanálise' : 'novo envio'}`, async ({ page }) => {
    const number = '<img src=x onerror=alert(1)>&"NF';
    const [first] = await prepareDocuments(page, {
      awaiting, numbers: [number, 'AUD-ID-B'], description: 'Material <script>"&</script>'
    });
    await page.getByRole('tab', { name: awaiting ? /^Aguardando/ : /^Abertas/ }).click();
    await pendencyRow(page, first.id).getByRole('button', {
      name: awaiting ? 'Reanalisar' : 'Registrar novo envio', exact: true
    }).click();
    const identity = page.locator(awaiting ? '.reanalysis-document-identity' : '#envio-contexto');
    await expect(identity).toContainText(number);
    await expect(identity.locator('img, script')).toHaveCount(0);
  });
}

test('registro fiscal agregado continua explicitamente legado, sem atribuir uma NF', async ({ page }) => {
  const [first] = await prepareDocuments(page, { legacy: true });
  await pendencyRow(page, first.id).getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
  await expect(page.locator('#envio-contexto')).toContainText('Pendência legada de Notas Fiscais');
  await expect(page.locator('#envio-contexto')).not.toContainText('NF: AUD-ID-A');
});

test('formulário de boleto pede número ou referência de documento', async ({ page }) => {
  await page.goto('/');
  await selectFixtureCompetence(page);
  await page.evaluate(() => window.RadarProductExtensionsReady);
  await page.evaluate(() => {
    switchProfile('controlador');
    const school = escolas.find(s => s.programasIds?.includes('CONECTADA')
      && isCompetenceInScope(s.competenciaInicial, activeCompetenciaKey));
    switchView('prontuario', school.id);
  });
  await page.locator('tr[data-program-id="CONECTADA"][data-document-key="notaFiscal"]')
    .getByRole('button', { name: 'Adicionar Nota', exact: true }).click();
  const dialog = page.locator('#modal-dados-nota');
  await dialog.getByLabel('Tipo de Gasto', { exact: true }).selectOption('boleto_internet');
  await expect(dialog.getByRole('textbox', { name: 'Número ou referência do documento', exact: true })).toBeVisible();
});

test('reanálise mantém botões inteiros visíveis em desktop de 1280×720', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const [, second] = await prepareDocuments(page, { awaiting: true });
  await page.getByRole('tab', { name: /^Aguardando/ }).click();
  await pendencyRow(page, second.id).getByRole('button', { name: 'Reanalisar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Reanalisar pendência documental' });
  await expect(dialog).toBeVisible();

  const completeButtons = () => completeFooterButtons(dialog);
  const expected = [
    { name: 'Cancelar', fullyVisible: true },
    { name: 'Confirmar reanálise', fullyVisible: true }
  ];
  await expect.poll(completeButtons).toEqual(expected);
  await dialog.locator('.modal-body').hover();
  await page.mouse.wheel(0, 2000);
  await expect(dialog.getByLabel('Resultado da reanálise', { exact: true })).toBeVisible();
  await expect.poll(completeButtons).toEqual(expected);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
  test(`novo envio mantém botões inteiros em desktop de ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const [first] = await prepareDocuments(page);
    await pendencyRow(page, first.id).getByRole('button', { name: 'Registrar novo envio', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Registrar novo envio para conferência' });
    await expect(dialog).toBeVisible();
    const expected = [
      { name: 'Cancelar', fullyVisible: true },
      { name: 'Registrar e enviar para reanálise', fullyVisible: true }
    ];
    await expect.poll(() => completeFooterButtons(dialog)).toEqual(expected);
    await scrollModalBodyToEnd(page, dialog);
    await expect(dialog.locator('#envio-link')).toBeVisible();
    await expect.poll(() => completeFooterButtons(dialog)).toEqual(expected);
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.locator('#modal-registrar-envio')).not.toHaveClass(/show/);
    await expect(page.locator('#modal-registrar-envio')).toHaveAttribute('aria-hidden', 'true');
  });

  test(`comunicação mantém botões inteiros em desktop de ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await prepareDocuments(page);
    await page.evaluate(() => switchView('prontuario', pendencias[0].escolaId));
    await page.getByRole('button', { name: 'Gerar comunicação', exact: true }).click();
    const dialog = page.locator('#modal-cobranca');
    await expect(dialog).toBeVisible();
    const expected = [
      { name: 'Fechar', fullyVisible: true },
      { name: 'Copiar texto', fullyVisible: true }
    ];
    await expect.poll(() => completeFooterButtons(dialog)).toEqual(expected);
    await scrollModalBodyToEnd(page, dialog);
    await expect(dialog.getByText('Pré-visualização da mensagem', { exact: true })).toBeVisible();
    await expect.poll(() => completeFooterButtons(dialog)).toEqual(expected);
    await dialog.getByRole('button', { name: 'Fechar', exact: true }).click();
    await expect(dialog).not.toHaveClass(/show/);
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
  });
}

test('identificação mantém botões inteiros em desktop de 1280×720', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const [first] = await prepareDocuments(page, { invoiceType: 'a_identificar' });
  await pendencyRow(page, first.id).getByRole('button', {
    name: 'Registrar envio / identificação da despesa', exact: true
  }).click();
  const dialog = page.getByRole('dialog', { name: 'Registrar envio e identificar despesa' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#envio-identificacao')).toBeVisible();
  const expected = [
    { name: 'Cancelar', fullyVisible: true },
    { name: 'Registrar e enviar para reanálise', fullyVisible: true }
  ];
  await expect.poll(() => completeFooterButtons(dialog)).toEqual(expected);
  await scrollModalBodyToEnd(page, dialog);
  await expect(dialog.locator('#envio-link')).toBeVisible();
  await expect.poll(() => completeFooterButtons(dialog)).toEqual(expected);
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('#modal-registrar-envio')).not.toHaveClass(/show/);
  await expect(page.locator('#modal-registrar-envio')).toHaveAttribute('aria-hidden', 'true');
});

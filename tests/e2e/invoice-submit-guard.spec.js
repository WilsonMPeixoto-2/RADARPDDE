'use strict';

const { test, expect } = require('@playwright/test');

async function prepareInvoiceForm(page, { editing = false } = {}) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.RadarApplicationServices?.invoices), null, {
    timeout: 15_000
  });

  return page.evaluate(({ editingMode }) => {
    switchProfile('controlador');

    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.length > 0
      && isCompetenceInScope(candidate.competenciaInicial, activeCompetenciaKey)
    ));
    if (!escola) throw new Error('Escola determinística não encontrada para o teste de invoice.');

    const programaId = escola.programasIds[0];
    const compKey = `${activeCompetenciaKey}_${programaId}`;
    verificacoes[escola.id] = verificacoes[escola.id] || {};
    const verification = buildVerificationSnapshot(verificacoes[escola.id][compKey]);
    verification.resultadoBonif = '';
    if (verification.bonificacao.notaFiscal === 'Não se aplica') {
      verification.bonificacao.notaFiscal = 'Sim';
    }
    verificacoes[escola.id][compKey] = verification;

    if (!openModalDadosNota(escola.id, compKey)) {
      throw new Error('Não foi possível abrir o modal de nota fiscal no teste.');
    }

    document.getElementById('nota-desc').value = 'Material de teste';
    document.getElementById('nota-tipo').value = 'consumo';
    document.getElementById('nota-numero').value = editingMode ? 'NF-EDIT-PR1' : 'NF-PR1';
    document.getElementById('nota-valor').value = '123.45';

    const submitButton = document.querySelector('#form-dados-nota button[type="submit"]');
    if (editingMode) {
      document.getElementById('nota-id').value = 'nota-pr1-existente';
      submitButton.textContent = 'Salvar Alterações';
    }

    const service = window.RadarApplicationServices.invoices;
    window.__pr1OriginalInvoiceSave = service.save;
    window.__pr1InvoiceSaveCalls = 0;
    window.__pr1InvoiceResolvers = [];
    service.save = () => {
      window.__pr1InvoiceSaveCalls += 1;
      return new Promise(resolve => {
        window.__pr1InvoiceResolvers.push(() => resolve({
          ok: true,
          value: {
            warnings: []
          }
        }));
      });
    };

    return {
      escolaId: escola.id,
      compKey,
      initialLabel: submitButton.textContent
    };
  }, { editingMode: editing });
}

async function dispatchRepeatedSubmits(page, count = 2) {
  await page.evaluate(repetitions => {
    const form = document.getElementById('form-dados-nota');
    for (let index = 0; index < repetitions; index += 1) {
      form.requestSubmit();
    }
  }, count);
}

async function readBusySnapshot(page) {
  return page.evaluate(() => {
    const form = document.getElementById('form-dados-nota');
    const submitButton = form.querySelector('button[type="submit"]');
    return {
      calls: window.__pr1InvoiceSaveCalls,
      ariaBusy: form.getAttribute('aria-busy'),
      disabled: submitButton.disabled,
      label: submitButton.textContent
    };
  });
}

async function releaseInvoiceSave(page, { reject = false } = {}) {
  await page.evaluate(({ shouldReject }) => {
    const service = window.RadarApplicationServices.invoices;
    const resolvers = window.__pr1InvoiceResolvers || [];
    if (shouldReject) {
      service.save = () => Promise.reject(new Error('Falha controlada PR1'));
      return;
    }
    resolvers.splice(0).forEach(resolve => resolve());
  }, { shouldReject: reject });
}

async function restoreInvoiceService(page) {
  await page.evaluate(() => {
    if (window.__pr1OriginalInvoiceSave) {
      window.RadarApplicationServices.invoices.save = window.__pr1OriginalInvoiceSave;
    }
  });
}

test.describe('PR1 — contenção de submit repetido de Nota Fiscal', () => {
  test.afterEach(async ({ page }) => {
    if (!page.isClosed()) await restoreInvoiceService(page).catch(() => {});
  });

  test('duplo submit no mesmo turno aceita apenas um gesto e entra em estado ocupado imediatamente', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await prepareInvoiceForm(page);
    await dispatchRepeatedSubmits(page, 2);

    const snapshot = await readBusySnapshot(page);
    expect(snapshot.calls).toBe(1);
    expect(snapshot.ariaBusy).toBe('true');
    expect(snapshot.disabled).toBe(true);
    expect(snapshot.label).toBe('Salvando…');

    await releaseInvoiceSave(page);
    await expect.poll(() => readBusySnapshot(page)).toMatchObject({
      ariaBusy: 'false',
      disabled: false,
      label: 'Salvar Gasto'
    });
  });

  test('edição preserva o rótulo Salvar Alterações depois da gravação', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await prepareInvoiceForm(page, { editing: true });
    await dispatchRepeatedSubmits(page, 2);

    const busy = await readBusySnapshot(page);
    expect(busy.calls).toBe(1);
    expect(busy.label).toBe('Salvando…');

    await releaseInvoiceSave(page);
    await expect.poll(() => readBusySnapshot(page)).toMatchObject({
      ariaBusy: 'false',
      disabled: false,
      label: 'Salvar Alterações'
    });
  });
});

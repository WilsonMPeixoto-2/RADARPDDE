'use strict';

const { test, expect } = require('@playwright/test');
const { prepareSchool } = require('../support/unidentified-expense-fixture');

async function golden(page, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await expect(page).toHaveScreenshot(name, {
    animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01
  });
}

// A jornada funcional completa permanece em unidentified-expense-user-journey.
// Cada estado visual tem contexto próprio e reutiliza os goldens já revisados.
test('estado visual — drawer e feedback após registrar despesa', async ({ page }) => {
  await prepareSchool(page);
  await page.getByRole('button', { name: 'Registrar despesa a identificar', exact: true }).click();
  const modal = page.locator('#modal-dados-nota');
  await modal.getByLabel('Descrição provisória da saída', { exact: true })
    .fill('Débito visto no extrato; documento ainda não recebido');
  await modal.getByLabel('Valor do Gasto (R$)', { exact: true }).fill('123.45');
  await modal.locator('#nota-unidentified-observation')
    .fill('Débito localizado no extrato; aguardando documentação da unidade.');
  await modal.getByRole('button', { name: 'Registrar Despesa', exact: true }).click();
  await expect(modal).not.toHaveClass(/show/);
  await expect(page.locator('#pendency-preview-drawer')).toBeVisible();
  await expect(page.locator('#pendency-notice'))
    .toHaveText('Despesa a identificar e Pendência registradas com sucesso.');
  await golden(page, 'drawer-despesa-a-identificar.png');
});

test('estado visual — reanálise do documento identificado', async ({ page }) => {
  const context = await prepareSchool(page);
  // Preparação pelo serviço real, sem simular HTML, estados ou regras de domínio.
  // A abertura do modal continua sendo feita pelo controle visível ao usuário.
  await page.evaluate(async ({ schoolId, compKey }) => {
    const services = window.RadarApplicationServices;
    const created = await services.invoices.saveUnidentifiedExpenseWithPendency({
      schoolId, compKey,
      description: 'Débito visto no extrato; documento ainda não recebido',
      expenseType: 'a_identificar', invoiceNumber: '', amount: 123.45,
      profile: 'controlador',
      pendencyObservation: 'Débito localizado no extrato; aguardando documentação da unidade.'
    });
    await services.pendencies.registerAttempt({
      pendencyId: created.value.pendency.id,
      availabilityDate: '2026-09-23',
      observation: 'Documento recebido e conferido para reanálise.',
      identification: {
        expenseType: 'consumo', invoiceNumber: 'NF-UX-001',
        description: 'Material de consumo identificado', amount: 123.45
      }
    });
    rebuildOperationalIndexes();
    persist();
    switchView('prontuario', schoolId);
  }, context);
  const waiting = page.locator('.invoice-reanalysis-status-button')
    .filter({ hasText: 'Aguardando reanálise' });
  await expect(waiting).toHaveCount(1);
  await waiting.click();
  const modal = page.locator('#modal-reanalisar-pendencia');
  await expect(modal).toHaveClass(/show/);
  await expect(modal.locator('.reanalysis-guidance')).toBeFocused();
  await expect(modal.locator('.reanalysis-document-identity'))
    .toContainText('Material de consumo identificado');
  await golden(page, 'modal-reanalise.png');
});

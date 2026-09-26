'use strict';

const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

test('o envio de despesa a identificar cabe na célula Ações da fila desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await selectFixtureCompetence(page, '2026-05');

  const pendencyId = await page.evaluate(async () => {
    switchProfile('controlador');
    const competence = window.RadarCompetenceContext.getState().activeKey;
    const school = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competence)
    ));
    if (!school) throw new Error('Escola de fixture não encontrada.');
    const compKey = `${competence}_BASIC`;
    verificacoes[school.id] ||= {};
    const verification = RadarFluxoOperacional.createEmptyVerification('BASIC');
    verification.bonificacao.notaFiscal = 'Não';
    verification.analise.notaFiscal = 'Não analisado';
    verificacoes[school.id][compKey] = verification;
    const result = await window.RadarApplicationServices.invoices.saveUnidentifiedExpenseWithPendency({
      schoolId: school.id,
      compKey,
      description: 'Débito sem natureza definida para verificar a fila',
      expenseType: 'a_identificar',
      invoiceNumber: '',
      amount: 145.67,
      profile: 'controlador',
      pendencyObservation: 'Aguardando documento para identificar a despesa.'
    });
    rebuildOperationalIndexes();
    persist();
    switchView('pendencias');
    return result.value.pendency.id;
  });

  const row = page.locator(`.pendency-operations-table tr[data-pendency-id="${pendencyId}"]`);
  const action = row.getByRole('button', { name: 'Registrar envio / identificação da despesa' });
  await expect(action).toBeVisible();
  await action.scrollIntoViewIfNeeded();

  const geometry = await action.evaluate(button => {
    const cell = button.closest('td').getBoundingClientRect();
    const bounds = button.getBoundingClientRect();
    const text = document.createRange();
    text.selectNodeContents(button);
    const ink = text.getBoundingClientRect();
    return {
      cellLeft: cell.left,
      cellRight: cell.right,
      buttonLeft: bounds.left,
      buttonRight: bounds.right,
      buttonTop: bounds.top,
      buttonBottom: bounds.bottom,
      textLeft: ink.left,
      textRight: ink.right,
      textTop: ink.top,
      textBottom: ink.bottom
    };
  });
  expect(geometry.buttonLeft).toBeGreaterThanOrEqual(geometry.cellLeft - 1);
  expect(geometry.buttonRight).toBeLessThanOrEqual(geometry.cellRight + 1);
  expect(geometry.textLeft).toBeGreaterThanOrEqual(geometry.buttonLeft - 1);
  expect(geometry.textRight).toBeLessThanOrEqual(geometry.buttonRight + 1);
  expect(geometry.textTop).toBeGreaterThanOrEqual(geometry.buttonTop - 1);
  expect(geometry.textBottom).toBeLessThanOrEqual(geometry.buttonBottom + 1);

  await action.click();
  await expect(page.locator('#modal-registrar-envio')).toHaveClass(/show/);
});

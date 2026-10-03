'use strict';

const { test, expect } = require('@playwright/test');
const { selectFixtureCompetence } = require('../support/e2e-competence');

const invoiceAction = (page, id = 'refresh-focus-invoice-a') => page.locator(
  `.invoice-document-row[data-invoice-id="${id}"] button[onclick^="abrirEditarNota"]`
);

test.beforeEach(async ({ page }) => {
  test.skip(process.env.RADAR_E2E_SUPABASE_LOCAL === '1', 'Isola continuidade de foco; o gate concorrente cobre o backend real.');
  await page.goto('/');
  await page.waitForFunction(() => window.RadarDataContext?.ready === true);
  await page.evaluate(() => window.RadarProductExtensionsReady);
  await selectFixtureCompetence(page, '2026-05');
  await page.evaluate(() => {
    switchProfile('controlador');
    const school = escolas.find(item => item.programasIds?.length >= 3
      && isCompetenceInScope(item.competenciaInicial, '2026-05'));
    if (!school) throw new Error('Escola local para jornada de foco ausente.');
    const programId = school.programasIds[school.programasIds.length - 1];
    const compKey = `2026-05_${programId}`;
    verificacoes[school.id] = verificacoes[school.id] || {};
    verificacoes[school.id][compKey] = RadarFluxoOperacional.createEmptyVerification();
    for (const suffix of ['a', 'b']) {
      notasRegistradas.push({
        id: `refresh-focus-invoice-${suffix}`, escolaId: school.id, compKey,
        competencia: '2026-05', programaId: programId, tipo: 'consumo',
        numero: `FOCO-${suffix}`, desc: `Material pedagógico ${suffix}`, valor: 100,
        analiseDocumentoFiscal: 'Não analisado', rowVersion: 1
      });
    }
    activeProntuarioCompetencia = '2026-05';
    rebuildOperationalIndexes();
    switchView('prontuario', school.id);
    // Apenas a fronteira de leitura é controlada. Controller, renderer,
    // controles, navegação por teclado e scroll são os do produto.
    window.RadarAuthContext = { user: { id: 'focus-test-session' } };
    window.__focusFixture = { schoolId: school.id, programId, compKey };
  });
  await expect(page.locator('#tab-verificacoes')).toBeVisible();
});

async function keyboardFocus(page, target) {
  await target.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(target).toBeFocused();
}

async function beginRefresh(page, mutation = 'update') {
  await page.evaluate(async operation => {
    const response = new Promise(resolve => { window.__releaseFocusRead = resolve; });
    const service = { async loadOperationalContext(_key, options) {
      await response;
      if (!options.shouldApply()) return { stale: true };
      const { schoolId, compKey } = window.__focusFixture;
      const index = notasRegistradas.findIndex(item => item.id === 'refresh-focus-invoice-a');
      if (operation === 'remove') notasRegistradas.splice(index, 1);
      else if (operation === 'consolidate') verificacoes[schoolId][compKey].resultadoBonif = 'Apto';
      else {
        notasRegistradas[index].valor = 4321;
        // A identidade precisa sobreviver também à mudança de ordem da lista.
        notasRegistradas.push(notasRegistradas.splice(index, 1)[0]);
      }
      rebuildOperationalIndexes();
      return { stale: false };
    } };
    window.__focusRefreshController = window.RadarOperationalContextRefresh.createController(window, service);
    window.__focusRefreshRun = window.__focusRefreshController.refresh('realtime', { force: true });
    await Promise.resolve();
  }, mutation);
}

async function completeRefresh(page) {
  return page.evaluate(async () => {
    window.__releaseFocusRead();
    const result = await window.__focusRefreshRun;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { result, metrics: window.__focusRefreshController.getMetrics() };
  });
}

test('refresh relevante preserva tab com ID e mantém a atualização visível', async ({ page }) => {
  const tab = page.locator('#prontuario-tab-verificacoes');
  await keyboardFocus(page, tab);
  await beginRefresh(page);
  const { metrics } = await completeRefresh(page);
  expect(metrics.succeeded).toBe(1);
  await expect(tab).toBeFocused();
  await expect(page.locator('[data-invoice-id="refresh-focus-invoice-a"]')).toContainText('4.321,00');
});

test('refresh preserva ação sem ID pela NF e ação, incluindo ordem e rolagem', async ({ page }) => {
  const edit = invoiceAction(page);
  await expect(edit).not.toHaveAttribute('id');
  await keyboardFocus(page, edit);
  const area = page.locator('main.content-area');
  const before = await area.evaluate(element => element.scrollTop);
  expect(before).toBeGreaterThan(100);
  await beginRefresh(page);
  await completeRefresh(page);
  await expect(edit).toBeFocused();
  await expect(edit.locator('xpath=ancestor::*[@data-invoice-id]')).toContainText('4.321,00');
  expect(await page.locator('[data-invoice-id^="refresh-focus-invoice-"]').evaluateAll(rows => (
    rows.map(row => row.getAttribute('data-invoice-id'))
  ))).toEqual(['refresh-focus-invoice-b', 'refresh-focus-invoice-a']);
  expect(Math.abs(await area.evaluate(element => element.scrollTop) - before)).toBeLessThanOrEqual(4);
  await page.keyboard.press('Enter');
  await expect(page.locator('#nota-numero')).toHaveValue('FOCO-a');
});

test('movimento de foco durante leitura prevalece sobre o controle antes da RPC', async ({ page }) => {
  const previous = invoiceAction(page);
  const current = invoiceAction(page, 'refresh-focus-invoice-b');
  await keyboardFocus(page, previous);
  await beginRefresh(page);
  await keyboardFocus(page, current);
  await completeRefresh(page);
  await expect(current).toBeFocused();
  await expect(previous).not.toBeFocused();
});

test('remoção da NF não transfere foco para a ação equivalente de outra NF', async ({ page }) => {
  await keyboardFocus(page, invoiceAction(page));
  await beginRefresh(page, 'remove');
  const { metrics } = await completeRefresh(page);
  expect(metrics.succeeded).toBe(1);
  await expect(invoiceAction(page)).toHaveCount(0);
  await expect(invoiceAction(page, 'refresh-focus-invoice-b')).not.toBeFocused();
});

test('controle desabilitado pela resposta não recebe restauração de foco', async ({ page }) => {
  const programId = await page.evaluate(() => window.__focusFixture.programId);
  const button = page.locator(`tr[data-program-id="${programId}"][data-document-key="extCC"]`)
    .getByRole('button', { name: 'Sim', exact: true });
  await keyboardFocus(page, button);
  await beginRefresh(page, 'consolidate');
  const { metrics } = await completeRefresh(page);
  expect(metrics.succeeded).toBe(1);
  await expect(button).toBeDisabled();
  await expect(button).not.toBeFocused();
});

test('foco em campo durante leitura preserva edição e adia aplicação', async ({ page }) => {
  await keyboardFocus(page, invoiceAction(page));
  await beginRefresh(page);
  const input = page.locator('.invoice-document-row[data-invoice-id="refresh-focus-invoice-a"] select').first();
  await input.focus();
  const { result, metrics } = await completeRefresh(page);
  expect(result.stale).toBe(true);
  expect(metrics.rerenders).toBe(0);
  await expect(input).toBeFocused();
});

'use strict';

const { test, expect } = require('@playwright/test');

test.describe('Gestão de Equipe — confirmação acessível de reatribuição', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Validação do componente institucional no desktop.');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForFunction(() => Boolean(window.RadarApplicationServices && window.RadarSharedInteractions));
    await page.evaluate(() => {
      switchProfile('assistente');
      switchView('equipe');
      window.__teamWrites = [];
      radarSchoolService.assignController = async payload => {
        window.__teamWrites.push({ kind: 'single', ...payload });
        return { value: { changed: true } };
      };
      radarSchoolService.bulkAssignController = async payload => {
        window.__teamWrites.push({ kind: 'bulk', ...payload });
        return { value: { changed: true } };
      };
    });
  });

  test('reatribuição individual: cancela sem gravar e confirma somente após prévia legível', async ({ page }, testInfo) => {
    const select = page.locator('select.select-alocacao').first();
    const schoolName = await select.getAttribute('aria-label');
    const other = await select.evaluate(el => [...el.options].find(option => option.value && option.value !== el.value)?.value);
    expect(other).toBeTruthy();
    await select.selectOption(other);

    const dialog = page.getByRole('alertdialog', { name: 'Confirmar reatribuição de escola' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(schoolName.replace('Controlador responsável por ', ''));
    await expect(dialog).toContainText('Controlador atual:');
    await expect(dialog).toContainText('Novo controlador:');
    await expect(dialog).toHaveClass(/show/);
    await expect(dialog).toHaveCSS('opacity', '1');
    await expect(dialog.locator('.modal-content.radar-team-reassignment-dialog')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();

    await testInfo.attach('reatribuicao-individual-claro', { body: await dialog.screenshot(), contentType: 'image/png' });
    await page.evaluate(() => document.body.classList.add('dark-theme'));
    await testInfo.attach('reatribuicao-individual-escuro', { body: await dialog.screenshot(), contentType: 'image/png' });
    await page.evaluate(() => document.body.classList.remove('dark-theme'));

    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveClass(/show/);
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(dialog).toHaveAttribute('inert', '');
    expect(await page.evaluate(() => window.__teamWrites)).toEqual([]);

    const again = page.locator('select.select-alocacao').first();
    await again.selectOption(other);
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirmar reatribuição', exact: true }).click();
    await expect(dialog).not.toHaveClass(/show/);
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(dialog).toHaveAttribute('inert', '');
    const calls = await page.evaluate(() => window.__teamWrites);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ kind: 'single', controllerId: other });
  });

  test('reatribuição em lote: lista completa rolável, foco contido, cancelamento e confirmação', async ({ page }, testInfo) => {
    for (let index = 0; index < 3; index++) await page.locator('.escola-bulk-checkbox').nth(index).check();
    const schoolNames = await page.locator('.escola-bulk-checkbox').evaluateAll(nodes =>
      nodes.slice(0, 3).map(el => el.getAttribute('aria-label').replace('Selecionar ', '')));
    const controller = await page.locator('#bulk-controlador-select').evaluate(el =>
      [...el.options].find(option => option.value)?.value);
    expect(controller).toBeTruthy();
    await page.locator('#bulk-controlador-select').selectOption(controller);
    await page.getByRole('button', { name: 'Aplicar em Lote' }).click();

    const dialog = page.getByRole('alertdialog', { name: 'Confirmar atribuição em lote' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('3 escolas selecionadas');
    const list = dialog.locator('.radar-team-reassignment-list');
    await expect(list.locator('li')).toHaveCount(3);
    for (const school of schoolNames) await expect(list).toContainText(school);
    await expect(list).toHaveCSS('overflow-y', 'auto');
    const cancel = dialog.getByRole('button', { name: 'Cancelar' });
    const confirm = dialog.getByRole('button', { name: 'Confirmar atribuição em lote' });
    await expect(cancel).toBeFocused();
    await confirm.focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(confirm).toBeFocused();
    await testInfo.attach('reatribuicao-lote', { body: await dialog.screenshot(), contentType: 'image/png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(dialog.locator('.modal-content.radar-team-reassignment-dialog')).toBeInViewport();
    await testInfo.attach('reatribuicao-lote-mobile', { body: await dialog.screenshot(), contentType: 'image/png' });

    await cancel.click();
    await expect(dialog).not.toHaveClass(/show/);
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(dialog).toHaveAttribute('inert', '');
    expect(await page.evaluate(() => window.__teamWrites)).toEqual([]);
    await page.getByRole('button', { name: 'Aplicar em Lote' }).click();
    await dialog.getByRole('button', { name: 'Confirmar atribuição em lote' }).click();
    await expect(dialog).not.toHaveClass(/show/);
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(dialog).toHaveAttribute('inert', '');
    const calls = await page.evaluate(() => window.__teamWrites);
    expect(calls).toHaveLength(1);
    expect(calls[0].kind).toBe('bulk');
    expect(calls[0].schoolIds).toHaveLength(3);
    expect(calls[0].controllerId).toBe(controller);
  });
});

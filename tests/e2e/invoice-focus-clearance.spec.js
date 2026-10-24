'use strict';

const { test, expect } = require('@playwright/test');

// F06: reproduz o scrollport CSS (720 × 406) observado quando o Chrome
// estava efetivamente a 200% em uma janela física de 1440 × 812.
// A viewport reduzida testa reflow/obstrução, não afirma simular o zoom do browser.
async function openControllerInvoice(page) {
  await page.goto('/');
  // O bootstrap de dados e a extensão de foco têm ciclos de carga distintos.
  // Abrir antes de a extensão ser instalada impede o foco inicial no formulário.
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && typeof window.RadarModalAccessibility?.getActiveDialog === 'function'
  ));
  await page.evaluate(() => {
    switchProfile('controlador');
    const school = escolas.find(item => (
      Array.isArray(item.programasIds)
      && item.programasIds.length > 0
      && isCompetenceInScope(item.competenciaInicial, activeCompetenciaKey)
    ));
    if (!school) throw new Error('F06: escola de teste compatível não encontrada.');
    activeProntuarioCompetencia = activeCompetenciaKey;
    switchView('prontuario', school.id);
  });
  const add = page.getByRole('button', { name: 'Adicionar Nota', exact: true }).first();
  await expect(add).toBeVisible();
  await add.click();
  await expect(page.locator('#modal-dados-nota')).toHaveClass(/show/);
  await expect(page.locator('#nota-desc')).toBeFocused();
  return add;
}

async function focusedFieldGeometry(page) {
  return page.evaluate(() => {
    const input = document.activeElement;
    const modal = document.querySelector('#modal-dados-nota');
    const body = modal.querySelector('.modal-body');
    const footer = modal.querySelector('.modal-footer');
    const label = document.querySelector(`label[for="${input.id}"]`);
    const rect = element => {
      const r = element.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const field = rect(input);
    const footerBox = rect(footer);
    const scrollport = rect(body);
    const labelBox = label ? rect(label) : null;
    const overlapsFooter = (
      field.bottom > footerBox.top + 1
      && field.top < footerBox.bottom - 1
      && field.right > footerBox.left + 1
      && field.left < footerBox.right - 1
    );
    const center = document.elementFromPoint(
      (field.left + field.right) / 2,
      (field.top + field.bottom) / 2
    );
    return {
      id: input.id,
      field,
      label: labelBox,
      footer: footerBox,
      scrollport,
      overlapsFooter,
      targetAtCenter: center?.id || center?.className || center?.tagName || '',
      focusIsOnField: input.matches('input, select, textarea'),
      scrollPaddingBottom: getComputedStyle(body).scrollPaddingBottom,
      scrollMarginBottom: getComputedStyle(input).scrollMarginBottom
    };
  });
}

function assertUnobscured(geometry, fieldId) {
  expect(geometry.id).toBe(fieldId);
  expect(geometry.focusIsOnField).toBe(true);
  expect(geometry.overlapsFooter, `${fieldId} fica coberto pelo rodapé: ${JSON.stringify(geometry)}`).toBe(false);
  expect(geometry.field.top).toBeGreaterThanOrEqual(geometry.scrollport.top - 2);
  expect(geometry.field.bottom).toBeLessThanOrEqual(geometry.footer.top - 4);
  expect(geometry.label?.top).toBeGreaterThanOrEqual(geometry.scrollport.top - 2);
  expect(geometry.label?.bottom).toBeLessThanOrEqual(geometry.footer.top - 2);
}

test.describe('F06 — formulário NF: foco, validação e reflow desktop', () => {
  test('Tab mantém Tipo e Valor inteiramente acima do rodapé a 720 × 406 CSS', async ({ page }, info) => {
    await page.setViewportSize({ width: 720, height: 406 });
    const addButton = await openControllerInvoice(page);
    const form = page.locator('#form-dados-nota');
    const modal = page.locator('#modal-dados-nota');

    // Submissão nativa inválida não pode gerar NF nem fechar o formulário.
    expect(await form.evaluate(element => element.checkValidity())).toBe(false);
    await page.getByRole('button', { name: 'Salvar Gasto', exact: true }).click();
    await expect(page.locator('#nota-desc')).toBeFocused();
    await expect(modal).toHaveClass(/show/);

    const positions = [];
    for (const fieldId of ['nota-tipo', 'nota-numero', 'nota-valor']) {
      await page.keyboard.press('Tab');
      await expect(page.locator(`#${fieldId}`)).toBeFocused();
      const geometry = await focusedFieldGeometry(page);
      positions.push(geometry);
      // Não consultar somente Playwright.toBeVisible(), pois o rodapé
      // sticky pode estar pintado por cima de um campo que mantém dimensões.
      assertUnobscured(geometry, fieldId);
    }
    await info.attach('f06-reflow-200-equivalent-geometry.json', {
      body: Buffer.from(JSON.stringify(positions, null, 2)),
      contentType: 'application/json'
    });
    await info.attach('f06-reflow-200-equivalent.png', {
      body: await page.screenshot({ animations: 'disabled' }),
      contentType: 'image/png'
    });

    // Escape mantém contrato existente: overlay inerte e foco no disparador.
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/show/);
    await expect.poll(() => modal.evaluate(element => ({
      inert: element.inert,
      opacity: getComputedStyle(element).opacity,
      pointerEvents: getComputedStyle(element).pointerEvents
    }))).toMatchObject({ inert: true, opacity: '0', pointerEvents: 'none' });
    await expect(addButton).toBeFocused();
  });

  test('em 1440 × 900 CSS, formulário e ações preservam foco e layout', async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openControllerInvoice(page);
    const modal = page.locator('#modal-dados-nota');
    await expect(modal.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Salvar Gasto' })).toBeVisible();

    const positions = [];
    for (const fieldId of ['nota-tipo', 'nota-numero', 'nota-valor']) {
      await page.keyboard.press('Tab');
      await expect(page.locator(`#${fieldId}`)).toBeFocused();
      const geometry = await focusedFieldGeometry(page);
      positions.push(geometry);
      assertUnobscured(geometry, fieldId);
    }
    await info.attach('f06-desktop-100-geometry.json', {
      body: Buffer.from(JSON.stringify(positions, null, 2)),
      contentType: 'application/json'
    });
    await info.attach('f06-desktop-100.png', {
      body: await page.screenshot({ animations: 'disabled' }),
      contentType: 'image/png'
    });
  });
});

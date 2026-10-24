const { test, expect } = require('@playwright/test');

test.describe('acessibilidade dos modais legados', () => {
  test('gerencia foco, Escape e árvore de acessibilidade sem alterar o formulário', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.evaluate(() => {
      const trigger = document.createElement('button');
      trigger.id = 'e2e-open-legacy-modal';
      trigger.type = 'button';
      trigger.textContent = 'Abrir contato de teste';
      trigger.addEventListener('click', () => openModal('modal-contato'));
      document.body.appendChild(trigger);
    });

    const trigger = page.locator('#e2e-open-legacy-modal');
    const modal = page.locator('#modal-contato');

    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(modal).toHaveAttribute('inert', '');

    await trigger.click();

    await expect(modal).toHaveClass(/show/);
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(modal).not.toHaveAttribute('inert', '');
    await expect(modal.locator('input:not([type="hidden"]), select, textarea, button').first())
      .toBeFocused();

    const focusable = modal.locator(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable.first();
    const last = focusable.last();

    await last.focus();
    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();

    await first.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(modal).not.toHaveClass(/show/);
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(modal).toHaveAttribute('inert', '');
    await expect(trigger).toBeFocused();
  });
});

// O foco inicial pode ser um controle válido diferente sem invalidar o teste.
// A entrada no formulário continua sendo por Tab, sem forçar foco em um input.
async function tabToInvoiceDescription(page) {
  const description = page.locator('#nota-desc');
  for (let step = 0; step < 7; step++) {
    if (await description.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(description).toBeFocused();
}

async function expectFocusedFieldExposed(page, selector) {
  await expect(page.locator(selector)).toBeFocused();
  // Visibility alone accepts a focused field underneath the sticky footer.
  await expect.poll(() => page.locator(selector).evaluate(element => {
    return [element, ...element.labels].every(target => {
      const r = target.getBoundingClientRect();
      // Rounded corners are not part of the element's hit region.
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const points = [[cx, cy], [cx, r.top + 2], [cx, r.bottom - 2],
        [r.left + 2, cy], [r.right - 2, cy]];
      return points.every(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return hit === target || target.contains(hit);
      });
    });
  }), { message: `${selector} and its label must be exposed when keyboard-focused` }).toBe(true);
}

test.describe('NF: validação e foco no formulário real', () => {
  for (const viewport of [{ width: 1440, height: 813 }, { width: 720, height: 406 }]) {
    test(`controles permanecem acessíveis por teclado em ${viewport.width}×${viewport.height} CSS`, async ({ page }) => {
      // The smaller area matches the CSS viewport measured with native browser zoom
      // at 200%. This CI regression tests reflow; the opt-in F06 probe tests real zoom.
      await page.setViewportSize({ width: 1440, height: 813 });
      await page.goto('/');
      await page.waitForFunction(() => window.RadarDataContext?.ready === true);
      await page.evaluate(async () => {
        await window.RadarProductExtensionsReady;
        switchProfile('controlador');
      });
      await page.locator('#nav-escolas').click();
      await page.getByRole('link', { name: 'Ver Unidade', exact: true }).first().click();
      const trigger = page.locator('#prontuario-verif-rows tr[data-document-key="notaFiscal"]')
        .getByRole('button', { name: 'Adicionar Nota', exact: true }).first();
      await expect(trigger).toBeVisible();
      await page.setViewportSize(viewport);
      await trigger.focus();
      await page.keyboard.press('Enter');

      const modal = page.locator('#modal-dados-nota');
      await expect(modal).toHaveCSS('opacity', '1');
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      // The contract requires usable focus inside the dialog, not a preference
      // for Close versus Description. Preserve the product's existing choice.
      await expect.poll(() => modal.evaluate(element => element.contains(document.activeElement))).toBe(true);
      await tabToInvoiceDescription(page);
      await expectFocusedFieldExposed(page, '#nota-desc');
      for (const selector of ['#nota-tipo', '#nota-numero', '#nota-valor']) {
        await page.keyboard.press('Tab');
        await expectFocusedFieldExposed(page, selector);
      }

      await page.keyboard.press('Tab');
      await expect(modal.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(modal.getByRole('button', { name: 'Salvar Gasto', exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#nota-desc')).toBeFocused();
      expect(await page.locator('#nota-desc').evaluate(element => element.validity.valueMissing)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(modal).toHaveAttribute('aria-hidden', 'true');
      await expect(modal).toHaveAttribute('inert', '');
      await expect(modal).toHaveCSS('opacity', '0');
      await expect(trigger).toBeFocused();
    });
  }
});

// Regressão complementar preservada do #490; não escolhe nova preferência de foco inicial.
test('Observação escolhida antes do frame preserva foco e texto', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.RadarDataContext?.ready === true
    && typeof window.RadarModalAccessibility?.getActiveDialog === 'function');
  const state = await page.evaluate(async () => {
    if (window.RadarProductExtensionsReady) await window.RadarProductExtensionsReady;
    switchProfile('controlador');
    const school = escolas.find(item => (
      Array.isArray(item.programasIds)
      && item.programasIds.length > 0
      && isCompetenceInScope(item.competenciaInicial, activeCompetenciaKey)
    ));
    if (!school) throw new Error('F06: escola compatível não encontrada.');
    activeProntuarioCompetencia = activeCompetenciaKey;
    switchView('prontuario', school.id);
    const compKey = activeCompetenciaKey + '_' + school.programasIds[0];
    if (!window.RadarUnidentifiedExpenseUx?.open(school.id, compKey)) {
      throw new Error('F06: modal provisório não abriu.');
    }
    const observation = document.getElementById('nota-unidentified-observation');
    if (!observation || observation.closest('[hidden]')) {
      throw new Error('F06: Observação provisória não está disponível.');
    }
    // A troca de foco ocorre NO MESMO task da abertura, antes do rAF
    // programado pelo gerenciador modal-accessibility.js.
    observation.focus({ preventScroll: true });
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve({
        activeId: document.activeElement?.id || null,
        modalOpen: document.getElementById('modal-dados-nota')?.classList.contains('show'),
        observationVisible: observation.getClientRects().length > 0
      });
    })));
  });
  expect(state).toMatchObject({
    activeId: 'nota-unidentified-observation',
    modalOpen: true,
    observationVisible: true
  });
  const observation = page.locator('#nota-unidentified-observation');
  await expect(observation).toBeFocused();
  await observation.fill('Débito observado no extrato; documento não apresentado.');
  await expect(observation).toHaveValue('Débito observado no extrato; documento não apresentado.');
  await expect(page.locator('#nota-desc')).toHaveValue('');
  await expect(observation).toBeFocused();
});

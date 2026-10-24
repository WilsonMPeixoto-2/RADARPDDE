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
      await expect(modal.getByRole('button', { name: 'Fechar', exact: true })).toBeFocused();

      for (const selector of ['#nota-desc', '#nota-tipo', '#nota-numero', '#nota-valor']) {
        await page.keyboard.press('Tab');
        await expect(page.locator(selector)).toBeFocused();
        // Visibility alone accepts a focused field underneath the sticky footer.
        await expect.poll(() => page.locator(selector).evaluate(element => {
          const r = element.getBoundingClientRect();
          // Test the center and edge midpoints; rounded corners are deliberately
          // outside the element's painted/hit region and are not occlusion.
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const points = [[cx, cy], [cx, r.top + 2], [cx, r.bottom - 2],
            [r.left + 2, cy], [r.right - 2, cy]];
          return points.every(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return hit === element || element.contains(hit);
          });
        }), { message: `${selector} must be fully exposed when keyboard-focused` }).toBe(true);
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

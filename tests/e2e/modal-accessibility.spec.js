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

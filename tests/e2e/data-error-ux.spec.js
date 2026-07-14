const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('erro funcional preserva modal, formulário e foco com anúncio acessível', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.RadarApplicationServices?.data));
  await page.evaluate(() => {
    const schoolId = escolas[0].id;
    openEscolaEditModal(schoolId);
  });
  const form = page.locator('#form-escola-edit');
  const email = page.locator('#edit-email');
  await expect(page.locator('#modal-escola-edit')).toHaveClass(/show/);
  await email.focus();

  await page.evaluate(() => {
    const error = new window.RadarRepositoryContract.RepositoryError(
      'SESSION_EXPIRED',
      'Sessão expirada durante o salvamento.',
      { operation: 'school:save' }
    );
    window.RadarErrorMapper.showDataOperationError(error, {
      form: '#form-escola-edit',
      focusTarget: '#edit-email'
    });
  });

  await expect(page.locator('#modal-escola-edit')).toHaveClass(/show/);
  await expect(form).toHaveAttribute('data-data-error', 'SESSION_EXPIRED');
  await expect(page.locator('#radar-data-operation-status')).toContainText(/sessão expirou/i);
  await expect(email).toBeFocused();

  const results = await new AxeBuilder({ page })
    .include('#modal-escola-edit')
    .include('#radar-data-operation-status')
    .analyze();
  expect(results.violations).toEqual([]);
});

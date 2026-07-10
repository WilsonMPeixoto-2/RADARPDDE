const { test, expect } = require('@playwright/test');

async function openApplication(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/RADAR PDDE/i);
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#main-container')).toBeVisible();
  await expect(page.locator('#mobile-menu-button')).toBeVisible();

  return pageErrors;
}

test.describe('RADAR PDDE em dispositivos móveis', () => {
  test('carrega a aplicação sem erro fatal e sem overflow da página', async ({ page }) => {
    const pageErrors = await openApplication(page);

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    }));

    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(pageErrors).toEqual([]);
  });

  test('abre o menu móvel, navega e fecha automaticamente', async ({ page }) => {
    await openApplication(page);

    const menuButton = page.locator('#mobile-menu-button');
    const sidebar = page.locator('aside.sidebar');
    const overlay = page.locator('.mobile-sidebar-overlay');

    await expect(sidebar).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await menuButton.click();

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/mobile-open/);
    await expect(overlay).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('body')).toHaveClass(/mobile-nav-open/);

    await page.locator('#nav-escolas').click();

    await expect(page.locator('#nav-escolas')).toHaveClass(/active/);
    await expect(sidebar).toBeHidden();
    await expect(overlay).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('body')).not.toHaveClass(/mobile-nav-open/);
  });

  test('fecha o menu móvel com a tecla Escape', async ({ page }) => {
    await openApplication(page);

    const menuButton = page.locator('#mobile-menu-button');
    const sidebar = page.locator('aside.sidebar');

    await menuButton.click();
    await expect(sidebar).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(sidebar).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toBeFocused();
  });

  test('mantém tabelas largas dentro de rolagem local', async ({ page }) => {
    await openApplication(page);

    await page.locator('#mobile-menu-button').click();
    await page.locator('#nav-escolas').click();

    const tableWrapper = page.locator('.table-responsive').first();
    await expect(tableWrapper).toBeVisible();

    const overflow = await tableWrapper.evaluate(element => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX
    }));

    expect(['auto', 'scroll']).toContain(overflow.overflowX);
    expect(overflow.scrollWidth).toBeGreaterThanOrEqual(overflow.clientWidth);

    const pageOverflow = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));
    expect(pageOverflow.documentWidth).toBeLessThanOrEqual(pageOverflow.viewport + 1);
  });
});

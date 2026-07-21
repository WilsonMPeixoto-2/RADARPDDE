const { test, expect } = require('@playwright/test');

test('imagem original aprovada é carregada na autenticação e na navegação', async ({ page }) => {
  await page.goto('/');

  await expect.poll(async () => page.locator('.radar-original-logo').count()).toBeGreaterThanOrEqual(2);

  const logos = await page.locator('.radar-original-logo').evaluateAll(elements => elements.map(image => ({
    src: image.getAttribute('src') || '',
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    alt: image.getAttribute('alt') || ''
  })));

  expect(logos.length).toBeGreaterThanOrEqual(2);
  logos.forEach(logo => {
    expect(logo.src).toMatch(/^data:image\/webp;base64,/);
    expect(logo.naturalWidth).toBeGreaterThan(0);
    expect(logo.naturalHeight).toBeGreaterThan(0);
    expect(logo.alt).toMatch(/RADAR PDDE/i);
  });
});

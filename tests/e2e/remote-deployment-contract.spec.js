const { test, expect } = require('@playwright/test');

const EXPECTED_PRODUCTION = Object.freeze({
  vercelEnvironment: 'production',
  runtimeEnvironment: 'production',
  dataMode: 'supabase-production',
  supabaseRepositoryEnabled: true,
  productionActivationApproved: true
});

test('deployment publicado exige login e usa Supabase Production sem expor segredos', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const response = await page.goto('/', { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/RADAR PDDE/i);
  await expect(page.locator('#radar-auth-form')).toBeVisible();
  await expect(page.locator('#radar-auth-email')).toBeVisible();
  await expect(page.locator('#radar-auth-password')).toBeVisible();
  await expect(page.locator('#radar-auth-form [type="submit"]')).toBeEnabled();
  await expect(page.locator('html')).toHaveClass(/radar-auth-required/);
  await expect(page.locator('#radar-auth-status')).toContainText(/Entre para acessar o RADAR PDDE/i);
  expect(await page.locator('#app-layout').evaluate(element => element.inert)).toBe(true);
  await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error|Unhandled Runtime Error/i);

  const manifestResponse = await page.request.get('/radar-build-manifest.json');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifestText = await manifestResponse.text();
  const manifest = JSON.parse(manifestText);

  for (const [key, value] of Object.entries(EXPECTED_PRODUCTION)) {
    expect(manifest[key], `${key} divergente no deployment`).toEqual(value);
  }
  expect(manifest.commitSha).toMatch(/^[0-9a-f]{40}$/);
  expect(manifestText).not.toMatch(/sb_publishable_|sb_secret_|service_role|supabase\.co|password/i);

  const runtime = await page.evaluate(() => window.RADAR_PDDE_RUNTIME_INPUT);
  expect(runtime.environment).toBe('production');
  expect(runtime.dataMode).toBe('supabase-production');
  expect(runtime.features?.supabaseRepositoryEnabled).toBe(true);
  expect(runtime.productionActivationApproved).toBe(true);
  expect(runtime.supabase?.url).toMatch(/^https:\/\/scnryinorqeucbfkioxo\.supabase\.co$/);
  expect(runtime.supabase?.publishableKey).toMatch(/^sb_publishable_/);
  expect(JSON.stringify(runtime)).not.toMatch(/sb_secret_|service_role|database.*password/i);

  const screenshotPath = testInfo.outputPath('deployment-login.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await testInfo.attach('deployment-login', {
    path: screenshotPath,
    contentType: 'image/png'
  });

  expect(pageErrors).toEqual([]);
});

test('usuário anônimo não lê escolas e o login permanece responsivo', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/', { waitUntil: 'networkidle' });
  const runtime = await page.evaluate(() => window.RADAR_PDDE_RUNTIME_INPUT);
  const anonymousResponse = await page.request.get(
    `${runtime.supabase.url}/rest/v1/schools?select=id&limit=1`,
    {
      headers: {
        apikey: runtime.supabase.publishableKey
      }
    }
  );

  expect(anonymousResponse.ok()).toBeTruthy();
  expect(await anonymousResponse.json()).toEqual([]);
  await expect(page.locator('#radar-auth-form')).toBeVisible();
  await expect(page.locator('#radar-auth-email')).toBeFocused();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    appInert: document.getElementById('app-layout')?.inert === true
  }));

  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.appInert).toBe(true);
  expect(pageErrors).toEqual([]);
});

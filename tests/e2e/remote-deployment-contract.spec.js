const { test, expect } = require('@playwright/test');

const EXPECTED_PRODUCTION = Object.freeze({
  vercelEnvironment: 'production',
  runtimeEnvironment: 'local',
  dataMode: 'local',
  supabaseRepositoryEnabled: false,
  productionActivationApproved: false
});

test('deployment publicado mantém identidade, manifesto seguro e console saudável', async ({ page }, testInfo) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const response = await page.goto('/', { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/RADAR PDDE/i);
  await expect(page.locator('#app-layout')).toBeVisible();
  await expect(page.locator('#main-container')).toBeVisible();
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

  const screenshotPath = testInfo.outputPath('deployment-landing.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await testInfo.attach('deployment-landing', {
    path: screenshotPath,
    contentType: 'image/png'
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('deployment permite alternar os quatro perfis locais sem erro de navegação', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'deployment-desktop-chromium',
    'Matriz completa de perfis executada apenas no desktop.'
  );

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => (
    typeof switchProfile === 'function'
    && typeof switchView === 'function'
    && Array.isArray(escolas)
    && escolas.length > 0
  ));

  const evidence = await page.evaluate(() => {
    const profiles = ['controlador', 'assistente', 'inventario', 'sme'];
    const views = [
      'dashboard',
      'escolas',
      'competencias',
      'pendencias',
      'inventario',
      'auditoria',
      'equipe',
      'sme-config'
    ];
    const visited = [];
    const errors = [];

    for (const profile of profiles) {
      try {
        switchProfile(profile);
        for (const view of views) {
          try {
            switchView(view);
            const main = document.querySelector('#main-container');
            visited.push({
              profile,
              view,
              textLength: String(main?.innerText || '').trim().length,
              visible: Boolean(main && main.getBoundingClientRect().height > 0)
            });
          } catch (error) {
            errors.push({ profile, view, message: error.message });
          }
        }
      } catch (error) {
        errors.push({ profile, view: '<profile>', message: error.message });
      }
    }

    return { visited, errors };
  });

  expect(evidence.errors).toEqual([]);
  expect(evidence.visited).toHaveLength(32);
  evidence.visited.forEach(item => {
    expect(item.visible, `${item.profile}:${item.view} não ficou visível`).toBe(true);
    expect(item.textLength, `${item.profile}:${item.view} ficou sem conteúdo`).toBeGreaterThan(20);
  });
  expect(pageErrors).toEqual([]);
});

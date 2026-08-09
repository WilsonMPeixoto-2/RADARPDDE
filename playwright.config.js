const { defineConfig, devices } = require('@playwright/test');

// Contrato histórico substituído: a Assistente também reanalisa pendências.
// O comportamento vigente é protegido por pendency-reanalysis-auth.spec.js.
// Ver docs/reference/TEST_GOVERNANCE.md.
const SUPERSEDED_CONTRACT_TESTS =
  /aba Pendências só expõe reanálise documental aguardando ao Controlador/;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testIgnore: /remote-deployment-contract\.spec\.js/,
  grepInvert: SUPERSEDED_CONTRACT_TESTS,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'node tests/support/spa-server.mjs',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  projects: [
    {
      name: 'mobile-chromium',
      testMatch: /(?:mobile-smoke|mobile-header-controls|data-error-ux|canonical-routes)\.spec\.js/,
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'mobile-webkit',
      testMatch: /(?:mobile-smoke|mobile-header-controls|data-error-ux|canonical-routes)\.spec\.js/,
      use: { ...devices['iPhone 15'] }
    },
    {
      name: 'desktop-chromium',
      testIgnore: /(?:mobile-smoke|mobile-header-controls|remote-deployment-contract)\.spec\.js/,
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});

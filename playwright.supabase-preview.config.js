const { defineConfig, devices } = require('@playwright/test');

// Alteração operacional sem efeito funcional: aciona o gate remoto final.
const deploymentUrl = process.env.RADAR_DEPLOYMENT_URL;
if (!deploymentUrl) throw new Error('RADAR_DEPLOYMENT_URL ausente.');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: /supabase-preview-remote\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report-supabase-preview' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-supabase-preview' }]],
  use: {
    baseURL: deploymentUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 15000
  },
  projects: [
    {
      name: 'supabase-preview-desktop-chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});

const { defineConfig, devices } = require('@playwright/test');

const deploymentUrl = process.env.RADAR_DEPLOYMENT_URL || 'https://radarpdde-fix.vercel.app';

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report-deployment' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-deployment' }]],
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
      name: 'deployment-desktop-chromium',
      testMatch: /(?:remote-deployment-contract|frontend-contract)\.spec\.js/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'deployment-mobile-chromium',
      testMatch: /(?:remote-deployment-contract|mobile-smoke)\.spec\.js/,
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'deployment-mobile-webkit',
      testMatch: /(?:remote-deployment-contract|mobile-smoke)\.spec\.js/,
      use: { ...devices['iPhone 15'] }
    }
  ]
});

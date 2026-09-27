const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: /(?:global-visual-polish|unidentified-expense-user-journey)\.spec\.js/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4175',
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    trace: {
      mode: 'retain-on-failure-and-retries',
      screenshots: true,
      snapshots: { dom: true, aria: true, screen: true },
      sources: true
    },
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
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});

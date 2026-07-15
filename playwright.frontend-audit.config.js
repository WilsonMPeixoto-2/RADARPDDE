const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/audit',
  testMatch: /frontend-precedence\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results/frontend-precedence',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [{ name: 'desktop-chromium' }]
});

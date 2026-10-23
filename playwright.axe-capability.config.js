'use strict';
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'capability-axe-wcag22-diagnostic.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180000,
  reporter: [['line']],
  outputDir: 'test-results/capability-axe-wcag22',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4175',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});

'use strict';

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: /production-evaluation-measurement\.spec\.js/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 180000,
  expect: { timeout: 45000 },
  reporter: [['line']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'https://radarpdde-fix.vercel.app',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    ignoreHTTPSErrors: false,
    navigationTimeout: 45000,
    actionTimeout: 30000
  }
});

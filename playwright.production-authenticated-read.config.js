'use strict';

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: /production-authenticated-read\.spec\.js/,
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  timeout: 120000,
  expect: {
    timeout: 30000
  },
  reporter: [['line']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.RADAR_PRODUCTION_URL || 'https://radarpdde-fix.vercel.app',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    ignoreHTTPSErrors: false,
    navigationTimeout: 45000,
    actionTimeout: 30000
  }
});

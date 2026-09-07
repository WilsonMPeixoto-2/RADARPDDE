const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: /desktop-bootstrap-observability\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120000,
  expect: { timeout: 30000 },
  reporter: [['line']],
  outputDir: 'test-results/desktop-bootstrap-observability/playwright',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4175',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    navigationTimeout: 30000,
    actionTimeout: 15000
  },
  webServer: {
    command: 'node tests/support/spa-server.mjs',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      HOST: '127.0.0.1',
      PORT: '4175'
    }
  },
  projects: [
    {
      name: 'supabase-preview-desktop-chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});

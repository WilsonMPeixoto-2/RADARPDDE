const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/audit',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results/audit-baseline',
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'off', screenshot: 'off', video: 'off' },
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } }
  ]
});

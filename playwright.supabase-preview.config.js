const { defineConfig, devices } = require('@playwright/test');

const baseURL = String(process.env.RADAR_DEPLOYMENT_URL || 'http://127.0.0.1:4175').trim().replace(/\/+$/, '');
const profileViewportSpec = /supabase-preview-profile-viewport\.spec\.js/;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: /supabase-preview-(?:remote|profile-viewport)\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 20000 },
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report-supabase-preview' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-supabase-preview' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 15000
  },
  webServer: {
    command: 'node tests/support/spa-server.mjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      HOST: '127.0.0.1',
      PORT: '4175'
    }
  },
  projects: [
    {
      name: 'supabase-preview-desktop-chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'supabase-preview-mobile-chromium',
      testMatch: profileViewportSpec,
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'supabase-preview-mobile-webkit',
      testMatch: profileViewportSpec,
      use: { ...devices['iPhone 15'] }
    }
  ]
});

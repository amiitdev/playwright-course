import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3456/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Playwright starts server.js before tests and stops it after.
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3456/',
    reuseExistingServer: true,
    timeout: 15000,
  },
});

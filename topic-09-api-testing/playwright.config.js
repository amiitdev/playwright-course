import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  workers: 1, // one shared in-memory DB — never run tests at the same time
  retries: 0,
  reporter: 'list',
  use: {
    // request fixture + page both use this baseURL
    baseURL: 'http://localhost:3456',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3456/api/products',
    reuseExistingServer: true,
    timeout: 15000,
  },
});

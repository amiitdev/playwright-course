// ES6 module config — points tests at our tiny LOCAL Shopping App
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    // file:// URL of the site/ folder — trailing slash matters!
    // page.goto('index.html') → file:///.../site/index.html
    baseURL: `file://${path.join(__dirname, 'site')}/`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

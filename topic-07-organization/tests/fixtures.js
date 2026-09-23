// tests/fixtures.js — CUSTOM FIXTURES (shared for all tests)
// ES6 import / export
// ============================================================
//
// Fixtures = values Playwright gives your test automatically.
// Built-in:  page, context, browser, browserName
// Custom:    you define with test.extend
//
// Pattern:
//   import { test as base, expect } from '@playwright/test';
//   export const test = base.extend({ myThing: async (args, use) => { await use(value); } });
//   export { expect };
//
// In tests:  import { test, expect } from './fixtures.js';

import { test as base, expect } from '@playwright/test';

// Extend Playwright's default test
export const test = base.extend({
  // ---- simple value fixture (no dependencies) ----
  testUser: async ({}, use) => {
    // runs before the test
    await use({
      email: 'amit@gmail.com',
      password: '123456',
    });
    // runs after the test (cleanup optional)
  },

  // ---- fixture that USES another fixture (page) ----
  // logged-in page: logs in first, then hands page to the test
  authPage: async ({ page, testUser }, use) => {
    await page.goto('login.html');
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/dashboard\.html/);

    // now the test gets an already-logged-in page
    await use(page);
  },

  // ---- automatic fixture: runs for EVERY test using this extended test ----
  // (auto fixtures run even if test does not ask for them)
  testInfoStamp: async ({}, use, testInfo) => {
    // testInfo has title, file, etc.
    await use(testInfo.title);
  },
});

export { expect };

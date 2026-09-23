// tests/02-fixtures.spec.js
// ============================================================
// LESSON: Fixtures — built-in + custom (tests/fixtures.js)
// ES6 import / export
// ============================================================
//
// Built-in fixtures you already used:
//   { page }       → one browser tab
//   { context }    → browser profile (cookies, storage)
//   { browser }    → whole browser (shared careful!)
//
// Custom fixtures live in ./fixtures.js and are imported by tests.
// They keep setup DRY — no copy-paste login in every test.

import { test, expect } from './fixtures.js';
//                          ^^^^^^^^^^^^^^^ custom, not '@playwright/test'

// ------------------------------------------------------------
// BUILT-IN
// ------------------------------------------------------------
test('built-in page fixture', async ({ page }) => {
  await page.goto('login.html');
  await expect(page).toHaveTitle('Login — Shopping App');
});

test('built-in context — storage state', async ({ page, context }) => {
  await page.goto('index.html');
  await page.evaluate(() => localStorage.setItem('demo', '1'));

  // same context can open another tab and see storage
  const tab2 = await context.newPage();
  await tab2.goto('dashboard.html');
  const val = await tab2.evaluate(() => localStorage.getItem('demo'));
  expect(val).toBe('1');
  await tab2.close();
});

// ------------------------------------------------------------
// CUSTOM: value fixture (testUser)
// ------------------------------------------------------------
test('custom fixture: testUser object', async ({ testUser }) => {
  expect(testUser.email).toBe('amit@gmail.com');
  expect(testUser.password).toBe('123456');
});

// ------------------------------------------------------------
// CUSTOM: authPage — page that is ALREADY logged in
// ------------------------------------------------------------
test('custom fixture: authPage starts on dashboard', async ({ authPage }) => {
  // no login steps here — fixture did them
  await expect(authPage).toHaveURL(/dashboard\.html/);
  await expect(authPage.locator('#user-email')).toHaveText('amit@gmail.com');
  await expect(authPage.locator('#welcome-msg')).toBeVisible();
});

test('authPage ready for real work (orders in cart)', async ({ authPage }) => {
  await expect(authPage.locator('#cart li')).toHaveCount(2);
  await expect(authPage.locator('#cart')).toContainText('Apple ×1');
});

// ------------------------------------------------------------
// Why fixtures beat copy-paste
// ------------------------------------------------------------
// WITHOUT fixture (bad — repeated in 20 tests):
//   await page.goto('login.html');
//   await page.fill('#email', ...);
//   ...
//
// WITH fixture (good):
//   test('...', async ({ authPage }) => { ... });
// ------------------------------------------------------------

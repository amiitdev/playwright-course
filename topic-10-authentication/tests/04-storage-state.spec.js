// tests/04-storage-state.spec.js
// ============================================================
// LESSON: Storage state — save login, reuse in new browser
// ES6 import / export
// ============================================================
//
// storageState = cookies + localStorage (and more) of a context.
//
//   await context.storageState({ path: 'auth.json' })  → SAVE
//   browser.newContext({ storageState: 'auth.json' })  → LOAD
//
// Why: login ONCE in a setup, then every test starts already logged in
// without typing email/password every time.

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '..', 'auth.json');

const EMAIL = 'amit@gmail.com';
const PASSWORD = '123456';

// auth.json must exist before the "load" test → run this file one-by-one
test.describe.configure({ mode: 'serial' });

test('save storage state after login', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/login.html');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(/dashboard\.html/);

  // SAVE cookies + localStorage → auth.json
  await context.storageState({ path: AUTH_FILE });

  // file should exist with cookies array
  const fs = await import('node:fs');
  expect(fs.existsSync(AUTH_FILE)).toBe(true);

  const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  expect(Array.isArray(state.cookies)).toBe(true);
  expect(state.cookies.some((c) => c.name === 'session')).toBe(true);
  expect(state.origins.length).toBeGreaterThanOrEqual(0);

  await context.close();
});

test('new context loads storage state — already logged in', async ({ browser }) => {
  // ensure auth.json exists (run order: previous test may have created it)
  const fs = await import('node:fs');
  if (!fs.existsSync(AUTH_FILE)) {
    test.skip(true, 'auth.json not ready — run full suite once');
    return;
  }

  const context = await browser.newContext({ storageState: AUTH_FILE });
  const page = await context.newPage();

  await page.goto('/dashboard.html');
  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText(EMAIL);

  // profile works too — same restored session
  await page.goto('/profile.html');
  await expect(page.getByTestId('profile-email')).toHaveText(EMAIL);

  await context.close();
});

test('storage state without file — object form', async ({ browser }) => {
  // 1) login in a temp context and capture state as object
  const tmp = await browser.newContext();
  const tmpPage = await tmp.newPage();
  await tmpPage.goto('/login.html');
  await tmpPage.locator('#email').fill(EMAIL);
  await tmpPage.locator('#password').fill(PASSWORD);
  await tmpPage.locator('#login-btn').click();
  await expect(tmpPage).toHaveURL(/dashboard\.html/);

  const state = await tmp.storageState(); // ← object, no path needed
  await tmp.close();

  // 2) brand new context from that object
  const context = await browser.newContext({ storageState: state });
  const page = await context.newPage();
  await page.goto('/dashboard.html');

  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText(EMAIL);

  await context.close();
});

test('fresh context WITHOUT storage — logged out', async ({ browser }) => {
  const context = await browser.newContext(); // no storageState
  const page = await context.newPage();

  await page.goto('/dashboard.html');
  await expect(page.getByTestId('status')).toHaveText('not logged in');

  await context.close();
});

// config-level reuse (documented — optional pattern)
// ------------------------------------------------------------
// playwright.config.js:
//   use: {
//     storageState: 'auth.json',  // every test starts logged in
//   }
//
// Or per project / per test file.
// Prefer: save in a setup project, load in UI projects (advanced).
// ------------------------------------------------------------

// STORAGE STATE cheat sheet
// ------------------------------------------------------------
//   save file     await context.storageState({ path: 'auth.json' })
//   save object   const state = await context.storageState()
//   load file     browser.newContext({ storageState: 'auth.json' })
//   load object   browser.newContext({ storageState: state })
//   includes      cookies + localStorage origins
//   speed         login once → many tests reuse
// ------------------------------------------------------------

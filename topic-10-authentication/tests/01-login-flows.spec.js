// tests/01-login-flows.spec.js
// ============================================================
// LESSON: Login flows — UI login vs API login
// ES6 import / export
// ============================================================
//
// Flow A — UI (like a real user):
//   fill email/password → click Sign in → server Set-Cookie → dashboard
//
// Flow B — API only (fast, for setup):
//   POST /api/login with { request } → later use cookie in browser
//
// Credentials for this demo:
//   amit@gmail.com / 123456

import { test, expect } from '@playwright/test';

const EMAIL = 'amit@gmail.com';
const PASSWORD = '123456';

test('@smoke UI login success → dashboard', async ({ page }) => {
  await page.goto('/login.html');

  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#login-btn').click();

  // redirected + session works
  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText(EMAIL);
});

test('UI login wrong password → error stays on login', async ({ page }) => {
  await page.goto('/login.html');

  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill('wrong-pass');
  await page.locator('#login-btn').click();

  await expect(page).toHaveURL(/login\.html/);
  await expect(page.getByTestId('login-error')).toBeVisible();
});

test('API login via request fixture — get session cookie', async ({ request }) => {
  const res = await request.post('/api/login', {
    data: { email: EMAIL, password: PASSWORD },
  });

  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.user.email).toBe(EMAIL);

  // cookie was stored on this request context automatically
  const me = await request.get('/api/me');
  expect(me.status()).toBe(200);
  expect((await me.json()).email).toBe(EMAIL);
});

test('API login then browser uses same session (context API)', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1) API login on the SAME context's request client
  const loginRes = await context.request.post('/api/login', {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(loginRes.status()).toBe(200);

  // 2) browser page now sends that cookie automatically
  await page.goto('/dashboard.html');
  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText(EMAIL);

  await context.close();
});

test('login page shows demo credentials (static)', async ({ page }) => {
  await page.goto('/login.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Login');
  await expect(page.locator('body')).toContainText('amit@gmail.com');
  await expect(page.locator('#login-btn')).toBeEnabled();
});

// Login flow cheat sheet
// ------------------------------------------------------------
//   UI user path     page.fill + click → Set-Cookie
//   API setup path   request.post('/api/login') → cookie on context
//   same context     context.request + page share cookies
// ------------------------------------------------------------

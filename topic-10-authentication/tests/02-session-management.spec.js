// tests/02-session-management.spec.js
// ============================================================
// LESSON: Session management — logged in, protected, logout
// ES6 import / export
// ============================================================
//
// Session = server remembers "who you are" between requests.
// Usually via a session cookie set after login.
//
//   logged in  → /api/me 200, dashboard shows email
//   logged out → /api/me 401, secret blocked
//   logout     → cookie cleared, server forgets token

import { test, expect } from '@playwright/test';

const EMAIL = 'amit@gmail.com';
const PASSWORD = '123456';

async function uiLogin(page) {
  await page.goto('/login.html');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(/dashboard\.html/);
}

test('@smoke session works on dashboard', async ({ page }) => {
  await uiLogin(page);

  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText(EMAIL);

  // localStorage copy of profile (non-HttpOnly demo data)
  await expect(page.getByTestId('storage-user')).toContainText('amit@gmail.com');
});

test('session also works on another page (profile)', async ({ page }) => {
  await uiLogin(page);

  await page.goto('/profile.html');
  await expect(page.getByTestId('profile-email')).toHaveText(EMAIL);
  await expect(page.getByTestId('need-login')).toBeHidden();
});

test('no session → profile asks to log in', async ({ page }) => {
  await page.goto('/profile.html');
  await expect(page.getByTestId('need-login')).toBeVisible();
  await expect(page.getByTestId('profile-email')).toHaveText('—');
});

test('protected API without session → 401', async ({ request }) => {
  const me = await request.get('/api/me');
  expect(me.status()).toBe(401);

  const secret = await request.get('/api/secret');
  expect(secret.status()).toBe(401);
});

test('protected API with session → 200 + secret', async ({ request }) => {
  const login = await request.post('/api/login', {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(login.status()).toBe(200);

  const secret = await request.get('/api/secret');
  expect(secret.status()).toBe(200);
  const body = await secret.json();
  expect(body.secret).toContain('banana');
  expect(body.loggedIn).toBe(true);
});

test('logout clears session — UI flow', async ({ page }) => {
  await uiLogin(page);
  await expect(page.getByTestId('status')).toHaveText('logged in');

  await page.locator('#logout-btn').click();
  await expect(page).toHaveURL(/login\.html/);

  // back to dashboard → not logged in
  await page.goto('/dashboard.html');
  await expect(page.getByTestId('status')).toHaveText('not logged in');
  await expect(page.getByTestId('user')).toHaveText('—');
});

test('logout via API clears cookie on request context', async ({ request }) => {
  await request.post('/api/login', {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect((await request.get('/api/me')).status()).toBe(200);

  const out = await request.post('/api/logout');
  expect(out.status()).toBe(200);

  // cookie gone
  expect((await request.get('/api/me')).status()).toBe(401);
});

test('session survives page reload', async ({ page }) => {
  await uiLogin(page);
  await page.reload();

  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText(EMAIL);
});

// Session mental model
// ------------------------------------------------------------
//   login  → server issues token → browser stores cookie
//   next request → browser sends Cookie: session=…
//   server looks up token → "you are amit"
//   logout → clear cookie + server drops token
// ------------------------------------------------------------

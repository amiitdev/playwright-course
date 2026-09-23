// tests/03-cookies.spec.js
// ============================================================
// LESSON: Cookies — get, set, clear (Playwright context API)
// ES6 import / export
// ============================================================
//
//   context.cookies()              → list all cookies
//   context.clearCookies()         → remove all
//   context.addCookies([...])      → inject cookies
//   context.cookies(url)           → cookies for one URL
//
// HttpOnly cookies: JavaScript cannot read them —
//   use context.cookies() (Playwright can see them).

import { test, expect } from '@playwright/test';

const EMAIL = 'amit@gmail.com';
const PASSWORD = '123456';

test('after UI login, session cookie exists', async ({ page, context }) => {
  await page.goto('/login.html');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(/dashboard\.html/);

  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === 'session');

  expect(session).toBeTruthy();
  expect(session.value).toMatch(/^sess_/);
  expect(session.httpOnly).toBe(true);
  expect(session.sameSite).toBeTruthy();
});

test('cookie is HttpOnly — page JS cannot read it', async ({ page }) => {
  await page.goto('/login.html');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(/dashboard\.html/);

  // document.cookie skips HttpOnly cookies
  const fromJs = await page.evaluate(() => document.cookie);
  expect(fromJs).not.toContain('session=');

  // Playwright context API CAN see it
  const cookies = await contextCookies(page);
  expect(cookies.some((c) => c.name === 'session')).toBe(true);
});

async function contextCookies(page) {
  return page.context().cookies();
}

test('clearCookies → logged out', async ({ page, context }) => {
  await page.goto('/login.html');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(/dashboard\.html/);

  await context.clearCookies();

  await page.goto('/dashboard.html');
  await expect(page.getByTestId('status')).toHaveText('not logged in');
});

test('addCookies — inject session without UI login', async ({ page, context }) => {
  // 1) get a real session token via API
  const loginRes = await context.request.post('/api/login', {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(loginRes.status()).toBe(200);

  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === 'session');
  expect(session).toBeTruthy();

  // 2) optional: clear browser cookies, then put session back
  await context.clearCookies();
  await context.addCookies([
    {
      name: 'session',
      value: session.value,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // 3) page is logged in again
  await page.goto('/dashboard.html');
  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText(EMAIL);
});

test('cookies for a specific URL only', async ({ page, context }) => {
  await page.goto('/login.html');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(/dashboard\.html/);

  const forUrl = await context.cookies('http://localhost:3456/dashboard.html');
  expect(forUrl.some((c) => c.name === 'session')).toBe(true);
});

test('expired-style: Max-Age=0 logout response clears browser cookie', async ({ page, context }) => {
  await page.goto('/login.html');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(/dashboard\.html/);

  // click logout — server sends Set-Cookie session=; Max-Age=0
  await page.locator('#logout-btn').click();
  await expect(page).toHaveURL(/login\.html/);

  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === 'session');
  // cookie should be gone (or empty)
  expect(!session || session.value === '').toBe(true);
});

// Cookie API cheat sheet
// ------------------------------------------------------------
//   read all     await context.cookies()
//   read one URL await context.cookies('http://localhost:3456/…')
//   delete all   await context.clearCookies()
//   inject       await context.addCookies([{ name, value, url/domain, … }])
//   HttpOnly     JS: no · Playwright: yes
// ------------------------------------------------------------

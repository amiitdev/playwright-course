// tests/03-assertions.spec.js
// ============================================================
// LESSON: every matcher, one by one, on the Shopping App
// ES6: import / export
// ============================================================
//
//   locator   = WHERE is the element?    page.locator('h1')
//   assertion = WHAT must be true?       expect(...).toBeVisible()
//
//   WEB-FIRST (await + auto-retry ~5s) → page elements
//   GENERIC   (no await, once)         → plain JS values

import { test, expect } from '@playwright/test';

// ------------------------------------------------------------
// A) WEB-FIRST assertions (for page elements) — ALWAYS await
// ------------------------------------------------------------
test.describe('web-first (auto-retry)', () => {

  test('toBeVisible — can I see the heading?', async ({ page }) => {
    await page.goto('index.html');
    // <h1>Welcome Amit</h1> is on screen → PASS
    await expect(page.locator('h1')).toBeVisible();

    // The hidden <h1 class="hidden-secret"> exists in HTML but
    // style="display:none" → NOT visible → this would FAIL:
    // await expect(page.locator('.hidden-secret')).toBeVisible();
  });

  test('toHaveText — exact full text', async ({ page }) => {
    await page.goto('index.html');
    // exact match "Welcome Amit" → PASS
    await expect(page.locator('h1')).toHaveText('Welcome Amit');
    // "Welcome" alone would FAIL (not the full text)
  });

  test('toContainText — piece of text inside', async ({ page }) => {
    await page.goto('index.html');
    // full: "Your order has been placed successfully."
    // we only need the word "order" → PASS
    await expect(page.locator('p.success')).toContainText('order');
    // RegExp + i (ignore case) also works:
    await expect(page.locator('p.success')).toContainText(/SUCCESS/i);
  });

  test('toHaveCount — how many elements?', async ({ page }) => {
    await page.goto('index.html');
    // <li>Apple</li> + <li>Banana</li> = 2 → PASS
    // toHaveCount(3) would FAIL
    await expect(page.locator('li')).toHaveCount(2);
  });

  test('toHaveURL — where is the browser?', async ({ page }) => {
    await page.goto('login.html');
    // human: "Does the address bar say login.html?"
    await expect(page).toHaveURL(/login\.html/);
  });

  test('toHaveTitle — what is on the tab?', async ({ page }) => {
    await page.goto('index.html');
    await expect(page).toHaveTitle('Shopping App');
  });

  test('real flow: login → dashboard (URL + text + visible)', async ({ page }) => {
    await page.goto('login.html');

    await page.fill('#email', 'amit@gmail.com');
    await page.fill('#password', '123456');
    await page.click('button[type="submit"]');

    // 1) Did we land on dashboard?          → toHaveURL
    await expect(page).toHaveURL(/dashboard\.html/);

    // 2) Is heading EXACTLY "Welcome Amit"? → toHaveText
    await expect(page.locator('h1')).toHaveText('Welcome Amit');

    // 3) Is Logout button showing?          → toBeVisible
    await expect(page.locator('.logout-btn')).toBeVisible();
  });
});

// ------------------------------------------------------------
// B) GENERIC assertions (plain JavaScript values) — no await
// ------------------------------------------------------------
test.describe('generic (no retry)', () => {

  test('toBe — strict === comparison', async ({ page }) => {
    await page.goto('index.html');

    const title = await page.title();       // "Shopping App"
    expect(title).toBe('Shopping App');     // string === string → PASS
    // expect(title).toBe('Shopping');      // would FAIL: not exact

    const count = 2;
    expect(count).toBe(2);                  // number === number → PASS
    // expect(count).toBe('2');             // would FAIL: 2 !== "2"
  });

  test('toContain — string and array', async () => {
    const title = 'Shopping App';
    expect(title).toContain('Shopping');    // string has this piece → PASS
    // expect(title).toContain('Amazon');   // would FAIL

    const fruits = ['Apple', 'Banana', 'Mango'];
    expect(fruits).toContain('Banana');     // in the array → PASS
    // expect(fruits).toContain('Orange');  // would FAIL
  });

  test('toBeTruthy — is the value not empty?', async () => {
    const loggedIn = true;
    expect(loggedIn).toBeTruthy();          // true → PASS

    const username = 'Amit';
    expect(username).toBeTruthy();          // non-empty string → PASS

    // const empty = '';
    // expect(empty).toBeTruthy();          // "" is FALSY → would FAIL
  });
});

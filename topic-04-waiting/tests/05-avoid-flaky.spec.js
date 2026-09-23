// tests/05-avoid-flaky.spec.js
// ============================================================
// LESSON: Avoiding flaky tests (stable patterns)
// ES6 import / export
// ============================================================
//
// FLAKY = same test sometimes passes, sometimes fails (no code bug).
// Main causes:
//   1) Fixed sleeps: page.waitForTimeout(3000)  ← too short OR too long
//   2) Not waiting for the right thing (click before element ready)
//   3) Race: assert before network/UI finished
//   4) Shared state between tests
//
// RULES (this file demonstrates the GOOD patterns only):
//   ✅ Prefer expect(...) auto-retry assertions
//   ✅ Wait for the RESULT you need (visible / text / response)
//   ✅ Start waitForResponse BEFORE the click
//   ✅ Each test opens its own page (Playwright fixture does this)
//   ✅ Use webServer / baseURL — no guessing ports by hand
//   ❌ Do NOT write waitForTimeout as your main strategy

import { test, expect } from '@playwright/test';

// ------------------------------------------------------------
// GOOD 1: wait for the OUTCOME, not a clock
// ------------------------------------------------------------
test('good: wait for outcome not seconds', async ({ page }) => {
  await page.goto('/');

  await page.locator('#load-btn').click();

  // BAD would be: await page.waitForTimeout(1500);
  // GOOD: assert what you actually need
  await expect(page.locator('#products')).toBeVisible();
  await expect(page.locator('#products li')).toHaveCount(2);
});

// ------------------------------------------------------------
// GOOD 2: chain actions only after each condition is true
// ------------------------------------------------------------
test('good: step-by-step conditions', async ({ page }) => {
  await page.goto('/');

  await page.locator('#start-btn').click();

  // wait until working…
  await expect(page.locator('#spinner')).toBeVisible();
  // wait until finished…
  await expect(page.locator('#done-msg')).toBeVisible({ timeout: 5000 });
  // spinner must be gone before we say "done"
  await expect(page.locator('#spinner')).toBeHidden();
});

// ------------------------------------------------------------
// GOOD 3: network — arm wait BEFORE click
// ------------------------------------------------------------
test('good: waitForResponse before click', async ({ page }) => {
  await page.goto('/network.html');

  const responsePromise = page.waitForResponse('**/api/products');
  await page.locator('#fetch-products').click();
  const res = await responsePromise;

  expect(res.status()).toBe(200);
  await expect(page.locator('#result')).toBeVisible();
});

// ------------------------------------------------------------
// GOOD 4: mock slow API when you do not need real latency
// ------------------------------------------------------------
test('good: route mock removes slow delay (still stable)', async ({ page }) => {
  await page.goto('/network.html');

  await page.route('**/api/user', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'Mock Amit', loggedIn: true }),
    })
  );

  const p = page.waitForResponse('**/api/user');
  await page.locator('#fetch-user').click();
  await p;

  await expect(page.locator('#user-box')).toHaveText('Hello, Mock Amit!');
});

// ------------------------------------------------------------
// GOOD 5: short per-assertion timeout when you WANT fast fail
// ------------------------------------------------------------
test('good: fail fast with short timeout when element should already be there', async ({ page }) => {
  await page.goto('/');

  // heading is immediate — if it takes >2s something is broken
  await expect(page.getByRole('heading', { name: 'Waiting Demos' })).toBeVisible({
    timeout: 2000,
  });
});

// ------------------------------------------------------------
// GOOD 6: independent tests (fresh page each time — default)
// ------------------------------------------------------------
test('good: test A does not depend on test B', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#products')).toBeHidden(); // clean state
});

test('good: test B also starts clean', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#products')).toBeHidden(); // not leftover from A
});

// ============================================================
// ANTI-PATTERN (commented — do not copy into real projects)
// ============================================================
//
// test('BAD: fixed sleep', async ({ page }) => {
//   await page.goto('/');
//   await page.locator('#load-btn').click();
//   await page.waitForTimeout(1500);   // ⏰ clock-wait
//   await expect(page.locator('#products')).toBeVisible();
// });
//
// Why bad?
//   • machine slow → 1500ms not enough → FLAKY FAIL
//   • machine fast → you wasted time always waiting
//   • you guessed the number; app changes → test breaks
//
// Only rare use: tiny delay to let a CSS animation finish
// when there is truly NO observable condition to wait for.
// ============================================================

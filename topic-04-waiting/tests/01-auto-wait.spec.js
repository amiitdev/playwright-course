// tests/01-auto-wait.spec.js
// ============================================================
// LESSON: Auto-waiting — Playwright waits for YOU
// ES6 import / export
// ============================================================
//
// You do NOT need sleep/timeouts for normal UI.
// Before click/fill/assert, Playwright automatically waits until:
//   - element is attached to DOM
//   - element is visible
//   - element is enabled (not disabled)
//
// Our page: products list appears 1.5s after clicking "Load products".

import { test, expect } from '@playwright/test';

test('click then content appears — NO manual wait needed', async ({ page }) => {
  await page.goto('/');

  // list is hidden at start
  await expect(page.locator('#products')).toBeHidden();

  // click → JS starts a 1.5s timer
  await page.getByRole('button', { name: 'Load products' }).click();

  // This assertion AUTO-RETRIES for up to 5 seconds (default).
  // It will keep checking until the list becomes visible (at ~1.5s).
  // We never wrote sleep(1500).
  await expect(page.locator('#products')).toBeVisible();
  await expect(page.locator('#products')).toContainText('Apple — $1');
});

test('auto-wait before click — button appears late is OK', async ({ page }) => {
  await page.goto('/');

  // If a button were created after 500ms, this would still work:
  // click() waits until the button is visible + enabled.
  // (Our button is immediate — this test documents the idea.)
  await expect(page.getByRole('button', { name: 'Load products' })).toBeEnabled();
  await page.getByRole('button', { name: 'Load products' }).click();
  await expect(page.locator('#products')).toBeVisible();
});

test('auto-wait on fill — input must exist first', async ({ page }) => {
  await page.goto('/');

  // goto() already waits for "load" (HTML parsed).
  // Assertions re-check until pass or timeout.
  await expect(page.getByRole('heading', { name: 'Waiting Demos' })).toBeVisible();
  await expect(page).toHaveTitle('Shopping App — Waiting');
});

// KEY IDEA
// ------------------------------------------------------------
//   WITHOUT Playwright auto-wait (old Selenium style):
//     click(); sleep(2000); assert();   ← fixed sleep = FLAKY
//
//   WITH Playwright:
//     click(); expect(...).toBeVisible();  ← retries until ready
// ------------------------------------------------------------

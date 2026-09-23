// tests/03-visibility.spec.js
// ============================================================
// LESSON: Visibility checks — can the user SEE it?
// ES6 import / export
// ============================================================
//
// VISIBLE means ALL of these:
//   1. element is in the DOM (attached)
//   2. has non-empty bounding box (width > 0, height > 0)
//   3. not hidden by CSS (display:none / visibility:hidden count as NOT visible)
//
//   toBeVisible()      → yes, user can see it
//   toBeHidden()       → display:none OR removed OR visibility:hidden
//   not.toBeVisible()  → same idea as hidden for "must not show"
//
// Auto-retry ~5s.

import { test, expect } from '@playwright/test';

test('toBeVisible — normal element on screen', async ({ page }) => {
  await page.goto('index.html');

  await expect(page.locator('#visible-box')).toBeVisible();
  await expect(page.locator('#visible-box')).toHaveText('I am visible');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('nav')).toBeVisible();
});

test('toBeHidden — display:none element', async ({ page }) => {
  await page.goto('index.html');

  // class="hidden-box" → display: none
  await expect(page.locator('#hidden-box')).toBeHidden();
  await expect(page.locator('#hidden-box')).not.toBeVisible();
});

test('visibility:hidden is also NOT visible', async ({ page }) => {
  await page.goto('index.html');

  // style="visibility: hidden" — in DOM but user cannot see it
  await expect(page.locator('#empty-box')).not.toBeVisible();
  await expect(page.locator('#empty-box')).toBeHidden();
});

test('action makes element visible (auto-retry)', async ({ page }) => {
  await page.goto('index.html');

  await expect(page.locator('#flash-msg')).toBeHidden();

  await page.locator('#show-btn').click();

  // JS removes hidden class → assertion waits until shown
  await expect(page.locator('#flash-msg')).toBeVisible();
  await expect(page.locator('#flash-msg')).toHaveText('Message is now visible!');
  await expect(page.locator('#status')).toHaveText('status: shown');
});

test('hidden then re-hidden after flow', async ({ page }) => {
  await page.goto('checkout.html');

  await expect(page.locator('#done')).toBeHidden();   // before pay

  await page.locator('#pay-btn').click();

  await expect(page.locator('#done')).toBeVisible();  // after pay
});

test('locator with :visible filter (advanced)', async ({ page }) => {
  await page.goto('index.html');

  // Playwright CSS engine supports :visible
  await expect(page.locator('div:visible').first()).toBeVisible();

  // count only visible list items (all 3 are visible here)
  await expect(page.locator('#cart-list li:visible')).toHaveCount(3);
});

test('multiple elements — first visible', async ({ page }) => {
  await page.goto('index.html');

  const navLinks = page.locator('nav a');
  await expect(navLinks).toHaveCount(5);
  await expect(navLinks.first()).toBeVisible();
  await expect(navLinks.nth(1)).toBeVisible(); // Products
});

test('NOT visible must stay true when we do nothing', async ({ page }) => {
  await page.goto('checkout.html');
  // never clicked pay
  await expect(page.locator('#done')).not.toBeVisible();
});

// mental model
// ------------------------------------------------------------
//   attached  = exists in HTML/DOM
//   visible   = attached + shown + has size
//   hidden    = display:none OR visibility:hidden OR removed
//
//   user can click only VISIBLE + ENABLED elements
// ------------------------------------------------------------

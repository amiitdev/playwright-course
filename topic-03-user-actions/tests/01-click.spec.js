// tests/01-click.spec.js
// ============================================================
// LESSON: click() — the most common user action
// ES6 import / export
// ============================================================
//
// click() = move mouse to element + press left button + release
// Playwright auto-waits until the element is visible & enabled.

import { test, expect } from '@playwright/test';

test('click button — page reacts', async ({ page }) => {
  await page.goto('index.html');

  // BEFORE click: message is hidden
  const msg = page.locator('#buy-msg');
  await expect(msg).toBeHidden();   // opposite of toBeVisible

  // ACTION: click "Buy now"
  await page.getByRole('button', { name: 'Buy now' }).click();

  // AFTER click: message appears + status changes
  await expect(msg).toBeVisible();
  await expect(msg).toHaveText('Thanks! Your order was placed.');
  await expect(page.locator('#status-text')).toHaveText('ordered');
});

test('click by CSS id', async ({ page }) => {
  await page.goto('index.html');
  await page.locator('#buy-btn').click();
  await expect(page.locator('#buy-msg')).toBeVisible();
});

test('click link — navigate', async ({ page }) => {
  await page.goto('index.html');

  // click the nav link "Checkout Form"
  // exact: true — page also has "Go to Checkout Form →" (would match without exact)
  await page.getByRole('link', { name: 'Checkout Form', exact: true }).click();

  // URL should now include form.html
  await expect(page).toHaveURL(/form\.html/);
  await expect(page.getByRole('heading', { name: 'Checkout Form' })).toBeVisible();
});

test('dblclick — double click', async ({ page }) => {
  await page.goto('index.html');

  await expect(page.locator('#double-count')).toHaveText('Double clicks: 0');

  await page.locator('#double-btn').dblclick();

  await expect(page.locator('#double-count')).toHaveText('Double clicks: 1');
});

test('click with force (rare — covered for awareness)', async ({ page }) => {
  await page.goto('index.html');
  // force: true skips actionability checks. Use ONLY if normal click fails
  // for a known UI quirk. Prefer fixing the locator instead.
  await page.locator('#buy-btn').click({ force: true });
  await expect(page.locator('#buy-msg')).toBeVisible();
});

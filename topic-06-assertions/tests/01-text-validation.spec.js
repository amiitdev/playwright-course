// tests/01-text-validation.spec.js
// ============================================================
// LESSON: Text validation — check what the user can READ
// ES6 import / export
// ============================================================
//
//   toHaveText('...')        → EXACT full visible text
//   toHaveText(/regex/)      → full text matches RegExp
//   toContainText('...')     → piece exists inside
//   toContainText(/.../i)    → piece, case-insensitive
//   toHaveCount(n)           → how many elements matched
//
// All of these AUTO-RETRY (~5s default).

import { test, expect } from '@playwright/test';

test('toHaveText — exact full string', async ({ page }) => {
  await page.goto('index.html');

  // EXACT match including "!" — no extra words allowed
  await expect(page.locator('#success-msg')).toHaveText('Order confirmed!');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome Amit');
});

test('toContainText — substring only', async ({ page }) => {
  await page.goto('index.html');

  // full: "Order ID: ORD-10024"
  // we only need the code part
  await expect(page.locator('#order-id')).toContainText('ORD-10024');
  await expect(page.locator('#order-id')).toContainText('Order ID');
});

test('RegExp — pattern matching for text', async ({ page }) => {
  await page.goto('index.html');

  // price looks like $42.00
  await expect(page.locator('#price')).toHaveText(/^\$\d+\.\d{2}$/);

  // order id format ORD-#####
  await expect(page.locator('#order-id')).toContainText(/ORD-\d+/);
});

test('case-insensitive contains', async ({ page }) => {
  await page.goto('index.html');

  // page says "successfully" — /SUCCESS/i still matches
  await expect(page.locator('[data-testid="tagline"]')).toContainText(/successfully/i);
});

test('list items — count + each item text', async ({ page }) => {
  await page.goto('index.html');

  const items = page.locator('#cart-list li');

  await expect(items).toHaveCount(3);

  await expect(items.nth(0)).toHaveText('Apple ×2');
  await expect(items.nth(1)).toHaveText('Banana ×1');
  await expect(items.nth(2)).toHaveText('Mango ×3');

  // parent contains all of them
  await expect(page.locator('#cart-list')).toContainText('Mango');
});

test('heading + paragraph combo', async ({ page }) => {
  await page.goto('index.html');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome Amit');
  await expect(page.getByRole('heading', { level: 2, name: 'Text validation' })).toBeVisible();
  // .muted matches 2 paragraphs → use .first() or a tighter locator
  await expect(page.locator('p.muted').first()).toContainText('apples and bananas');
});

test('text changes after action (auto-retry)', async ({ page }) => {
  await page.goto('checkout.html');

  await expect(page.locator('#step')).toHaveText('Step 1 of 2 — enter details');
  await expect(page.locator('#done')).not.toBeVisible();

  await page.locator('#pay-btn').click();

  // assertion retries until JS updates the text
  await expect(page.locator('#step')).toHaveText('Step 2 of 2 — complete');
  await expect(page.locator('#done')).toHaveText('Payment successful! Thank you.');
});

test('NOT equal — ensure text is NOT wrong', async ({ page }) => {
  await page.goto('index.html');

  // not.toHaveText = fail if it EVER becomes this exact string
  await expect(page.locator('#status')).not.toHaveText('error');
  await expect(page.locator('#success-msg')).not.toContainText('failed');
});

// TIP table
// ------------------------------------------------------------
//   full message exact     → toHaveText
//   code / amount inside   → toContainText
//   pattern like $42.00    → toHaveText(/regex/)
//   number of matches      → toHaveCount
// ------------------------------------------------------------

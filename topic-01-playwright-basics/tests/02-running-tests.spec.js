// tests/02-running-tests.spec.js
// ============================================================
// LESSON: How running tests works (multiple tests, independent)
// ES6 JavaScript — import / export
// ============================================================

import { test, expect } from '@playwright/test';

// Playwright runs every test() you define — no "main" function needed.
// Each test gets its OWN page → tests never share state.

test('first check: title contains Example', async ({ page }) => {
  await page.goto('/');
  // page.title() → string inside <title>...</title>
  const title = await page.title();
  // toBe(...) → strict equality (===). No retry.
  expect(title).toBe('Example Domain');
});

test('second check: page URL is correct', async ({ page }) => {
  await page.goto('/');
  // page.url() / toHaveURL → final address after navigation. Auto-retry.
  await expect(page).toHaveURL('https://example.com/');
});

test('third check: body has readable paragraph', async ({ page }) => {
  await page.goto('/');
  // locator('p') = CSS selector → ALL <p> tags
  // .first()      = take only the first match
  const paragraph = page.locator('p').first();
  // toHaveText(/.../) with a RegExp = PARTIAL match (not full equality).
  await expect(paragraph).toHaveText(/documentation examples/);
});

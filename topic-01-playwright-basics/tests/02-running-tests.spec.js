// tests/02-running-tests.spec.js
// ============================================================
// LESSON: several small tests in one run — Shopping App
// ES6: import / export
// ============================================================

import { test, expect } from '@playwright/test';

// Each test gets its OWN page → they never share state.

test('tab title is Shopping App', async ({ page }) => {
  await page.goto('index.html');
  // human: "What name is on the browser tab?"
  await expect(page).toHaveTitle('Shopping App');
});

test('we are on the home page URL', async ({ page }) => {
  await page.goto('index.html');
  // human: "Is the address bar pointing at index.html?"
  await expect(page).toHaveURL(/index\.html/);
});

test('fruits list has exactly 2 items', async ({ page }) => {
  await page.goto('index.html');
  // human: "How many <li> are in the list?" → Apple, Banana = 2
  await expect(page.locator('li')).toHaveCount(2);
});

test('order message contains the word order', async ({ page }) => {
  await page.goto('index.html');
  // human: "Does this paragraph mention my order somewhere inside?"
  await expect(page.locator('p.success')).toContainText('order');
});

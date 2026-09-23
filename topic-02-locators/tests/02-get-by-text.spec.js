// tests/02-get-by-text.spec.js
// ============================================================
// LESSON: getByText() — find element BY the text you see
// ES6 import / export
// ============================================================
//
// Use when: you know the words on the screen, but not the tag.
// getByText('Apple') finds the element whose text is Apple
// (usually the innermost element that contains it).

import { test, expect } from '@playwright/test';

test('getByText exact — simple words on the page', async ({ page }) => {
  await page.goto('index.html');

  // "Choose something you like." is inside <p class="muted">
  const tagline = page.getByText('Choose something you like.');
  await expect(tagline).toBeVisible();
  await expect(tagline).toHaveText('Choose something you like.');
});

test('getByText — product name inside h3', async ({ page }) => {
  await page.goto('index.html');

  // <h3>Apple</h3> — we find it by the word Apple
  const apple = page.getByText('Apple');
  await expect(apple).toBeVisible();
  await expect(apple).toHaveText('Apple');
});

test('getByText RegExp — partial + ignore case', async ({ page }) => {
  await page.goto('index.html');

  // /something/i  = contains "something", case-insensitive
  const line = page.getByText(/something/i);
  await expect(line).toBeVisible();
});

test('getByText on list item', async ({ page }) => {
  await page.goto('index.html');

  // <li>Mango</li>
  await expect(page.getByText('Mango')).toBeVisible();
  await expect(page.getByText('Papaya')).toBeVisible();
});

test('getByText is risky when text is partial — use exact option', async ({ page }) => {
  await page.goto('index.html');

  // By default getByText does substring matching for some cases.
  // exact: true  → text must match completely (like toHaveText style find)
  const apple = page.getByText('Apple', { exact: true });
  await expect(apple).toHaveText('Apple');
});

// TIP:
//   getByText('Add')     might match many things (partial)
//   getByText('Add', { exact: true })  only exact "Add"

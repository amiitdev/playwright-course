// tests/02-back-forward.spec.js
// ============================================================
// LESSON: Browser Back / Forward buttons
// ES6 import / export
// ============================================================
//
//   page.goBack()      → press browser Back  (history step -1)
//   page.goForward()   → press browser Forward (history step +1)
//
// History is a stack of pages you visited:
//
//   visit Home → About → Contact
//   history: [Home, About, Contact]   pointer at Contact
//   goBack()  → About
//   goBack()  → Home
//   goForward() → About

import { test, expect } from '@playwright/test';

test('goBack — return to previous page', async ({ page }) => {
  await page.goto('index.html');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/about\.html/);

  // browser Back button
  await page.goBack();

  await expect(page).toHaveURL(/index\.html/);
  await expect(page.locator('[data-page="home"]')).toBeVisible();
});

test('goForward — go again to next page', async ({ page }) => {
  await page.goto('index.html');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/about\.html/);

  await page.goBack();
  await expect(page).toHaveURL(/index\.html/);

  // browser Forward button
  await page.goForward();
  await expect(page).toHaveURL(/about\.html/);
  await expect(page.locator('[data-page="about"]')).toBeVisible();
});

test('back and forth through 3 pages', async ({ page }) => {
  // Home → About → Contact
  await page.goto('index.html');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/about\.html/);

  await page.locator('#go-contact').click();
  await expect(page).toHaveURL(/contact\.html/);

  // Contact → Back → About
  await page.goBack();
  await expect(page).toHaveURL(/about\.html/);
  await expect(page.locator('[data-page="about"]')).toBeVisible();

  // About → Back → Home
  await page.goBack();
  await expect(page).toHaveURL(/index\.html/);
  await expect(page.locator('[data-page="home"]')).toBeVisible();

  // Home → Forward → About
  await page.goForward();
  await expect(page).toHaveURL(/about\.html/);
});

test('goBack after clicking link on same tab', async ({ page }) => {
  await page.goto('about.html');
  await page.locator('#go-contact').click();
  await expect(page).toHaveURL(/contact\.html/);

  await page.goBack();
  await expect(page).toHaveURL(/about\.html/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
});

// TIP:
//   goBack()/goForward() also auto-wait for navigation to finish.
//   Prefer expect(page).toHaveURL(...) after them — it double-checks.

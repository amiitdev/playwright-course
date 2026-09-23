// tests/03-multiple-tabs.spec.js
// ============================================================
// LESSON: Multiple tabs (pages) in one browser context
// ES6 import / export
// ============================================================
//
// Mental model:
//
//   Browser context  = like a normal Chrome profile (cookies, storage)
//       |
//       +-- page 1  (tab)  ← default `page` fixture
//       +-- page 2  (tab)  ← context.newPage()
//       +-- page 3  (tab)
//
// Each "page" object = one tab.
// They share the SAME context (same cookies/storage) unless you open a new context.
//
//   context.newPage()  → open new tab
//   page.bringToFront()→ focus that tab (optional in tests)
//   page.close()       → close that tab

import { test, expect } from '@playwright/test';

test('context.newPage — open a second tab', async ({ page, context }) => {
  await page.goto('index.html');
  await expect(page.locator('[data-page="home"]')).toBeVisible();

  // open tab #2
  const tab2 = await context.newPage();
  await tab2.goto('products.html');

  await expect(tab2).toHaveURL(/products\.html/);
  await expect(tab2.locator('[data-page="products"]')).toBeVisible();

  // tab 1 is still on home (untouched)
  await expect(page).toHaveURL(/index\.html/);
  await expect(page.locator('[data-page="home"]')).toBeVisible();

  // work in tab2, then close it
  await tab2.close();
});

test('two tabs side by side — different pages', async ({ context }) => {
  const tab1 = await context.newPage();
  const tab2 = await context.newPage();

  await tab1.goto('about.html');
  await tab2.goto('contact.html');

  await expect(tab1).toHaveTitle('About — Shopping App');
  await expect(tab2).toHaveTitle('Contact — Shopping App');

  // both can be asserted independently
  await expect(tab1.locator('[data-page="about"]')).toBeVisible();
  await expect(tab2.locator('[data-page="contact"]')).toBeVisible();

  await tab1.close();
  await tab2.close();
});

test('link with target=_blank opens a new tab (popup)', async ({ page }) => {
  await page.goto('index.html');

  // "Help (new tab)" has target="_blank" → browser opens NEW TAB
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Help (new tab)' }).click();
  const newTab = await popupPromise;

  await newTab.waitForLoadState();
  await expect(newTab).toHaveURL(/help\.html/);
  await expect(newTab.locator('[data-page="help"]')).toBeVisible();

  // original page still home
  await expect(page).toHaveURL(/index\.html/);

  await newTab.close();
});

test('navigate in tab2 without breaking tab1', async ({ context }) => {
  const tab1 = await context.newPage();
  const tab2 = await context.newPage();

  await tab1.goto('index.html');
  await tab2.goto('products.html');

  // move tab2 around: products → about → back
  await tab2.getByRole('link', { name: 'About', exact: true }).click();
  await expect(tab2).toHaveURL(/about\.html/);
  await tab2.goBack();
  await expect(tab2).toHaveURL(/products\.html/);

  // tab1 never moved
  await expect(tab1).toHaveURL(/index\.html/);

  await tab1.close();
  await tab2.close();
});

test('tabs share the same browser context (storage)', async ({ context }) => {
  const tab1 = await context.newPage();
  const tab2 = await context.newPage();

  // set something in tab1's localStorage
  await tab1.goto('index.html');
  await tab1.evaluate(() => localStorage.setItem('cart', 'apple'));

  // same origin → tab2 can read it (same context = same storage)
  await tab2.goto('about.html');
  const cart = await tab2.evaluate(() => localStorage.getItem('cart'));

  expect(cart).toBe('apple');

  await tab1.close();
  await tab2.close();
});

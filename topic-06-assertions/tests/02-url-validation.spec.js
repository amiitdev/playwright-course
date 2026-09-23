// tests/02-url-validation.spec.js
// ============================================================
// LESSON: URL validation — where is the browser?
// ES6 import / export
// ============================================================
//
//   toHaveURL('...')      → exact full URL string
//   toHaveURL(/regex/)    → URL matches RegExp (PREFERRED for file:// paths)
//   page.url()            → get current URL as plain string
//
// File URLs contain your computer path, so we almost always use RegExp
// (e.g. /products\.html/) instead of the whole path.

import { test, expect } from '@playwright/test';

test('toHaveURL with RegExp — current page path', async ({ page }) => {
  await page.goto('index.html');
  await expect(page).toHaveURL(/index\.html/);
});

test('toHaveURL after clicking link', async ({ page }) => {
  await page.goto('index.html');

  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await expect(page).toHaveURL(/products\.html/);
});

test('URL with query string ?sort=price', async ({ page }) => {
  await page.goto('products.html?sort=price');

  // full address contains query param
  await expect(page).toHaveURL(/products\.html\?sort=price/);

  // page JS shows it
  await expect(page.locator('#sort-info')).toHaveText('Sort: price');
});

test('query string via link click', async ({ page }) => {
  await page.goto('index.html');
  await page.getByRole('link', { name: 'Products (sorted)' }).click();

  await expect(page).toHaveURL(/sort=price/);
  await expect(page.locator('#sort-info')).toHaveText('Sort: price');
});

test('hash / fragment URL #footer', async ({ page }) => {
  await page.goto('index.html#footer');
  await expect(page).toHaveURL(/#footer$/);

  // navigate to hash by link
  await page.goto('products.html');
  await page.goto('index.html');
  await page.getByRole('link', { name: 'Home #footer' }).click();
  await expect(page).toHaveURL(/#footer/);
});

test('page.url() plain value + generic expect', async ({ page }) => {
  await page.goto('checkout.html');

  const url = page.url();
  expect(url).toContain('checkout.html');
  expect(typeof url).toBe('string');
});

test('exact full URL string (works for http, rare for file://)', async ({ page }) => {
  await page.goto('index.html');

  // For local file tests, RegExp is easier.
  // For real http apps you CAN do:
  //   await expect(page).toHaveURL('https://myapp.com/dashboard');
  // Here we assert the ending portion with RegExp (portable):
  await expect(page).toHaveURL(/\/site\/index\.html$/);
});

test('redirect-style journey with URL checks', async ({ page }) => {
  await page.goto('index.html');
  await expect(page).toHaveURL(/index\.html/);

  await page.getByRole('link', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/checkout\.html/);
  await expect(page).toHaveTitle('Checkout — Shopping App');

  await page.goBack();
  await expect(page).toHaveURL(/index\.html/);
});

test('NOT on wrong page', async ({ page }) => {
  await page.goto('products.html');

  // safety: we must NOT be on checkout
  await expect(page).not.toHaveURL(/checkout\.html/);
  await expect(page).toHaveURL(/products\.html/);
});

// WHEN which?
// ------------------------------------------------------------
//   RegExp /path/     → almost always (paths, query, hash)
//   exact full string → http(s) apps with stable absolute URLs
//   page.url()        → need the value for logging / custom logic
// ------------------------------------------------------------

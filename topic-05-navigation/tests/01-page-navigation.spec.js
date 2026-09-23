// tests/01-page-navigation.spec.js
// ============================================================
// LESSON: Page navigation — goto, reload, url, title, waitForURL
// ES6 import / export
// ============================================================
//
//   page.goto('about.html')     → open a URL (relative to baseURL)
//   page.reload()               → refresh current page
//   page.url()                  → current address (string)
//   page.title()                → <title> text (string)
//   page.waitForURL(...)        → wait until address changes
//   page.waitForLoadState(...)  → wait until page finishes loading
//
// Load states (simple):
//   'domcontentloaded'  → HTML parsed (fast)
//   'load'              → all resources loaded (goto default)
//   'networkidle'       → almost no network for 500ms (use rarely — flaky)

import { test, expect } from '@playwright/test';

test('goto home page', async ({ page }) => {
  await page.goto('index.html');

  await expect(page).toHaveURL(/index\.html/);
  await expect(page).toHaveTitle('Home — Shopping App');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home');
});

test('goto another page by clicking link', async ({ page }) => {
  await page.goto('index.html');

  // click nav link "About" — same tab navigation
  await page.getByRole('link', { name: 'About', exact: true }).click();

  // toHaveURL auto-waits until navigation finishes
  await expect(page).toHaveURL(/about\.html/);
  await expect(page).toHaveTitle('About — Shopping App');
  await expect(page.locator('[data-page="about"]')).toBeVisible();
});

test('reload — page still works', async ({ page }) => {
  await page.goto('products.html');
  await expect(page.locator('[data-page="products"]')).toBeVisible();

  await page.reload();

  // after refresh we are still on products
  await expect(page).toHaveURL(/products\.html/);
  await expect(page.locator('[data-page="products"]')).toBeVisible();
  await expect(page.locator('.product')).toHaveCount(3);
});

test('page.url() and page.title() — plain values', async ({ page }) => {
  await page.goto('contact.html');

  const url = page.url();
  const title = await page.title();

  // generic assertions (no retry) — values already fetched
  expect(url).toContain('contact.html');
  expect(title).toBe('Contact — Shopping App');
});

test('waitForURL — wait until address changes', async ({ page }) => {
  await page.goto('index.html');

  // arm the wait, then click (same pattern as waitForResponse)
  const urlPromise = page.waitForURL(/about\.html/);
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await urlPromise;

  await expect(page).toHaveTitle('About — Shopping App');
});

test('waitForLoadState — page finished loading', async ({ page }) => {
  await page.goto('products.html');

  // goto already waits for 'load' by default — this makes it explicit
  await page.waitForLoadState('load');
  await expect(page.locator('.product')).toHaveCount(3);

  // 'domcontentloaded' = HTML ready (faster, sometimes enough)
  await page.goto('about.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-page="about"]')).toBeVisible();
});

test('multi-step journey: home → about → contact', async ({ page }) => {
  await page.goto('index.html');
  await expect(page.locator('[data-page="home"]')).toBeVisible();

  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/about\.html/);

  await page.locator('#go-contact').click();
  await expect(page).toHaveURL(/contact\.html/);
  await expect(page).toHaveTitle('Contact — Shopping App');
});

// tests/04-popups.spec.js
// ============================================================
// LESSON: Popups — window.open / target=_blank → waitForEvent('popup')
// ES6 import / export
// ============================================================
//
// A "popup" here = a NEW window/tab opened by the page.
// Playwright gives you the new Page object via:
//
//   const popupPromise = page.waitForEvent('popup');
//   await page.click(...);            // action that opens it
//   const popup = await popupPromise;  // the new tab
//
// GOLDEN ORDER: arm the event BEFORE the click (same as waitForResponse).

import { test, expect } from '@playwright/test';

test('button window.open — capture popup', async ({ page }) => {
  await page.goto('index.html');

  // 1) arm
  const popupPromise = page.waitForEvent('popup');

  // 2) click → JS calls window.open('help.html', ...)
  await page.getByRole('button', { name: 'Open order summary' }).click();

  // 3) get the new page object
  const popup = await popupPromise;

  // 4) wait for popup content
  await popup.waitForLoadState();
  await expect(popup).toHaveURL(/help\.html/);
  await expect(popup).toHaveTitle('Help / Order summary — Shopping App');
  await expect(popup.getByRole('heading', { level: 1 })).toHaveText('Order summary');
  await expect(popup.locator('[data-page="help"]')).toBeVisible();

  // original tab still on home
  await expect(page).toHaveURL(/index\.html/);

  await popup.close();
});

test('popup via Promise.all — arm + click together', async ({ page }) => {
  await page.goto('index.html');

  // Promise.all starts both at the same time — safe order guaranteed
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Open order summary' }).click(),
  ]);

  await popup.waitForLoadState();
  await expect(popup).toHaveURL(/help\.html/);
  await expect(popup.locator('.box')).toContainText('$5');

  await popup.close();
});

test('target=_blank link is also a popup event', async ({ page }) => {
  await page.goto('index.html');

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Help (new tab)' }).click();
  const popup = await popupPromise;

  await popup.waitForLoadState();
  await expect(popup).toHaveURL(/help\.html/);
  await expect(popup.getByRole('heading', { level: 1 })).toHaveText('Order summary');

  await popup.close();
});

test('interact inside the popup', async ({ page }) => {
  await page.goto('index.html');

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.locator('#open-popup').click(),
  ]);

  await popup.waitForLoadState();

  // popup has its own locators — like any other page
  await expect(popup.locator('[data-page="help"]')).toBeVisible();
  await expect(popup.locator('#close-me')).toBeVisible();

  // optional: click a button inside popup (our page calls window.close)
  // Some browsers block window.close if not script-opened — we only assert UI here.
  await expect(popup.locator('.box')).toContainText('Banana ×2');

  await popup.close();
});

test('no popup leaks — parent page stays usable', async ({ page }) => {
  await page.goto('index.html');

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Open order summary' }).click(),
  ]);
  await popup.waitForLoadState();
  await popup.close();

  // parent still works after popup closed
  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await expect(page).toHaveURL(/products\.html/);
  await expect(page.locator('.product')).toHaveCount(3);
});

// GOLDEN ORDER (same idea as network waits)
// ------------------------------------------------------------
//   const p = page.waitForEvent('popup');  // 1. arm
//   await page.click(openButton);          // 2. trigger
//   const popup = await p;                 // 3. get new tab
//   await popup.waitForLoadState();        // 4. wait content
//   await expect(popup)...                 // 5. assert
// ------------------------------------------------------------

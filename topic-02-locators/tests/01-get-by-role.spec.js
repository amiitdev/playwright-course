// tests/01-get-by-role.spec.js
// ============================================================
// LESSON: getByRole() — BEST locator style (semantic, stable)
// ES6 import / export
// ============================================================
//
// WHY role?  Browsers give every element a "role" for accessibility:
//   <h1>        → role = heading
//   <button>    → role = button
//   <a>         → role = link
//   <p>         → role = paragraph (or text)
//
// Role locators read like English and survive CSS class renames.

import { test, expect } from '@playwright/test';

test('getByRole heading — find h1', async ({ page }) => {
  await page.goto('index.html');

  // "heading with level 1" = the <h1> on the page
  const h1 = page.getByRole('heading', { level: 1 });

  await expect(h1).toBeVisible();
  await expect(h1).toHaveText('Welcome Amit');
});

test('getByRole heading — find h2 by exact name', async ({ page }) => {
  await page.goto('index.html');

  // level 2 = <h2>. name = the text inside the heading.
  const productsHeading = page.getByRole('heading', {
    level: 2,
    name: 'Products',          // exact text of the heading
  });

  await expect(productsHeading).toBeVisible();
  await expect(productsHeading).toHaveText('Products');
});

test('getByRole link — navigation menu', async ({ page }) => {
  await page.goto('index.html');

  // <a>Home</a> has role "link"
  const homeLink = page.getByRole('link', { name: 'Home' });
  await expect(homeLink).toBeVisible();

  const checkoutLink = page.getByRole('link', { name: 'Checkout' });
  await expect(checkoutLink).toBeVisible();
});

test('getByRole button — unique button text', async ({ page }) => {
  await page.goto('index.html');

  // Two buttons say "Add to cart" → would be MULTIPLE matches.
  // "Place order" is unique → safe without .first()
  const placeOrder = page.getByRole('button', { name: 'Place order' });
  await expect(placeOrder).toBeVisible();
});

test('getByRole button — many matches need .first()', async ({ page }) => {
  await page.goto('index.html');

  // 2 buttons: "Add to cart" (Apple) + "Add to cart" (Banana)
  const addButtons = page.getByRole('button', { name: 'Add to cart' });

  await expect(addButtons).toHaveCount(2);   // both exist
  await expect(addButtons.first()).toBeVisible(); // check the first one only
});

test('click by role — real interaction', async ({ page }) => {
  await page.goto('form.html');

  // Find submit button by role, then click it
  await page.getByRole('button', { name: 'Place order' }).click();

  // Page should show a thank-you message
  await expect(page.locator('#msg')).toHaveText('Order placed! Thank you.');
});

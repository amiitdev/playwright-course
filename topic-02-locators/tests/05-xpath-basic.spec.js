// tests/05-xpath-basic.spec.js
// ============================================================
// LESSON: XPath — BASIC only (enough to read/write simple paths)
// ES6 import / export
// ============================================================
//
// XPath always starts with //  (means: search anywhere on the page)
//
//   //tag                     every <tag>
//   //*                       every element
//   //tag[@attr='value']      tag where attribute equals value
//   //tag[text()='Hello']     tag whose text is exactly Hello
//   //parent/child            child under parent
//   (//tag)[1]                the first match (1-based, not 0!)
//
// Prefer getByRole / getByText / CSS in real projects.
// Learn XPath so you can READ old tests and interviews questions.

import { test, expect } from '@playwright/test';

test('XPath by tag — //h2', async ({ page }) => {
  await page.goto('index.html');

  // all h2 elements: "Products" and "Your list"
  const headings = page.locator('//h2');
  await expect(headings).toHaveCount(2);
  await expect(headings.first()).toHaveText('Products');
});

test('XPath by attribute — //*[@id="product-apple"]', async ({ page }) => {
  await page.goto('index.html');

  const apple = page.locator('//*[@id="product-apple"]');
  await expect(apple).toBeVisible();
  await expect(apple).toContainText('Apple');
});

test('XPath by text — //button[text()="Place order"]', async ({ page }) => {
  await page.goto('index.html');

  // button whose text is EXACTLY "Place order"
  const placeOrder = page.locator('//button[text()="Place order"]');
  await expect(placeOrder).toBeVisible();
  await expect(placeOrder).toHaveText('Place order');
});

test('XPath contains — //li[contains(text(),"Mango")]', async ({ page }) => {
  await page.goto('index.html');

  // contains(...) = text includes this piece (not exact)
  const mango = page.locator('//li[contains(text(),"Mango")]');
  await expect(mango).toBeVisible();
  await expect(mango).toHaveText('Mango');
});

test('XPath child path — //ul[@id="cart-items"]/li', async ({ page }) => {
  await page.goto('index.html');

  // li that are direct children of the ul#cart-items
  const items = page.locator('//ul[@id="cart-items"]/li');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toHaveText('Mango');
  await expect(items.nth(1)).toHaveText('Papaya');
});

test('XPath index — (//button)[1] first button', async ({ page }) => {
  await page.goto('index.html');

  // buttons on page order:
  //   1) Add to cart (Apple)
  //   2) Add to cart (Banana)
  //   3) Place order
  // NOTE: XPath index starts at 1 (not 0 like CSS nth-child / .nth())
  const firstButton = page.locator('(//button)[1]');
  await expect(firstButton).toHaveText('Add to cart');
});

test('XPath on form — fill input by id', async ({ page }) => {
  await page.goto('form.html');

  const email = page.locator('//*[@id="email"]');
  await email.fill('xpath@test.com');
  await expect(email).toHaveValue('xpath@test.com');
});

// tests/04-css-selectors.spec.js
// ============================================================
// LESSON: CSS selectors — the classic way (id, class, tag, combo)
// ES6 import / export
// ============================================================
//
// CSS cheat sheet used below:
//   #id          → element with this id          #product-apple
//   .class       → element with this class       .product-card
//   tag          → by tag name                   button
//   tag.class    → tag that has class            button.primary
//   a b          → b inside a                    .product-card .price
//   [attr=val]   → attribute equals value        [type="submit"]

import { test, expect } from '@playwright/test';

test('CSS by id — #id', async ({ page }) => {
  await page.goto('index.html');

  // <div class="product-card" id="product-apple">
  const appleCard = page.locator('#product-apple');

  await expect(appleCard).toBeVisible();
  await expect(appleCard).toContainText('Apple');
  await expect(appleCard).toContainText('$1');
});

test('CSS by class — .class', async ({ page }) => {
  await page.goto('index.html');

  // two divs have class product-card
  const cards = page.locator('.product-card');
  await expect(cards).toHaveCount(2);

  await expect(cards.first()).toBeVisible();
});

test('CSS tag + class — button.primary', async ({ page }) => {
  await page.goto('index.html');

  // only "Place order" has class primary
  const placeOrder = page.locator('button.primary');
  await expect(placeOrder).toBeVisible();
  await expect(placeOrder).toHaveText('Place order');
});

test('CSS descendant — parent child', async ({ page }) => {
  await page.goto('index.html');

  // .price only inside #product-apple → "$1"
  const applePrice = page.locator('#product-apple .price');
  await expect(applePrice).toHaveText('$1');

  const bananaPrice = page.locator('#product-banana .price');
  await expect(bananaPrice).toHaveText('$2');
});

test('CSS attribute selector — [type="submit"]', async ({ page }) => {
  await page.goto('form.html');

  // <button type="submit">Place order</button>
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeVisible();
  await expect(submitBtn).toHaveText('Place order');
});

test('CSS nth — li:nth-child()', async ({ page }) => {
  await page.goto('index.html');

  // first <li> in the list = Mango
  await expect(page.locator('#cart-items li:nth-child(1)')).toHaveText('Mango');
  // second <li> = Papaya
  await expect(page.locator('#cart-items li:nth-child(2)')).toHaveText('Papaya');
});

test('CSS + action — fill and click', async ({ page }) => {
  await page.goto('form.html');

  await page.locator('#email').fill('css@test.com');
  await page.locator('button[type="submit"]').click();

  await expect(page.locator('#msg')).toHaveText('Order placed! Thank you.');
});

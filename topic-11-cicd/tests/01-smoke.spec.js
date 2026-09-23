// tests/01-smoke.spec.js
// ============================================================
// LESSON: CI smoke tests — fast must-pass checks
// ES6 import / export
// ============================================================

import { test, expect } from '@playwright/test';

test('@smoke home loads with products', async ({ page }) => {
  await page.goto('index.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('CI Shop');
  await expect(page.locator('.product')).toHaveCount(2);
});

test('@smoke login page opens', async ({ page }) => {
  await page.goto('login.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Login');
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#login')).toBeEnabled();
});

test('@smoke add to cart works', async ({ page }) => {
  await page.goto('index.html');
  await page.locator('.add').first().click();
  await expect(page.locator('#cart-count')).toHaveText('Cart: 1');
});

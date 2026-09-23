// tests/02-full.spec.js
// ============================================================
// LESSON: broader suite for nightly / full CI job
// ES6 import / export
// ============================================================

import { test, expect } from '@playwright/test';

test('login with valid credentials', async ({ page }) => {
  await page.goto('login.html');
  await page.locator('#email').fill('ci@test.com');
  await page.locator('#password').fill('secret12');
  await page.locator('#login').click();

  await expect(page).toHaveURL(/index\.html/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('CI Shop');
});

test('login wrong password shows error', async ({ page }) => {
  await page.goto('login.html');
  await page.locator('#email').fill('ci@test.com');
  await page.locator('#password').fill('bad');
  await page.locator('#login').click();

  await expect(page).toHaveURL(/login\.html/);
  await expect(page.getByTestId('error')).toBeVisible();
});

test('about page shows version', async ({ page }) => {
  await page.goto('about.html');
  await expect(page.getByTestId('version')).toHaveText('v1.0.0');
  await expect(page).toHaveTitle('About — CI Shop');
});

test('nav links work', async ({ page }) => {
  await page.goto('index.html');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/about\.html/);

  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL(/index\.html/);
});

test('cart starts at zero', async ({ page }) => {
  await page.goto('index.html');
  await expect(page.locator('#cart-count')).toHaveText('Cart: 0');
});

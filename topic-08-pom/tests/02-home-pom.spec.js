// tests/02-home-pom.spec.js
// ============================================================
// LESSON: POM for home page — search + cart without selectors in tests
// ES6 import / export

import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage.js';

test('@smoke home shows 3 products', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await expect(home.heading).toHaveText('Shopping App');
  expect(await home.productCount()).toBe(3);
  await expect(home.cartCount).toHaveText('Cart: 0');
});

test('add one product to cart', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.addProduct('APPLE');
  await expect(home.cartCount).toHaveText('Cart: 1');
});

test('add same product twice', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.addProductTimes('BANANA', 2);
  await expect(home.cartCount).toHaveText('Cart: 2');
});

test('add different products', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.addProduct('APPLE');
  await home.addProduct('MANGO');
  await expect(home.cartCount).toHaveText('Cart: 2');
});

test('search finds apple', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.search('app');

  await expect(home.searchResult).toBeVisible();
  await expect(home.searchResult).toHaveText('Found: apple');
});

test('search no results', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.search('zzz');

  await expect(home.searchResult).toBeVisible();
  await expect(home.searchResult).toHaveText('No results for zzz');
});

test('product card by SKU helper', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await expect(home.productCard('MANGO')).toContainText('Mango');
  await expect(home.productCard('MANGO')).toContainText('$3');
  await expect(home.addToCartButton('MANGO')).toBeVisible();
});

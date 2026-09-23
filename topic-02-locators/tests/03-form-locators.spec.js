// tests/03-form-locators.spec.js
// ============================================================
// LESSON: getByLabel() + getByPlaceholder() — form fields
// ES6 import / export
// ============================================================
//
// Form page (site/form.html):
//
//   <label for="email">Email address</label>
//   <input id="email" placeholder="you@example.com" />
//
//   getByLabel('Email address')     ← uses the visible label text
//   getByPlaceholder('you@example.com') ← uses the gray hint inside input

import { test, expect } from '@playwright/test';

test('getByLabel — find input from its label', async ({ page }) => {
  await page.goto('form.html');

  // Human: "Click on the box that says Email address"
  const email = page.getByLabel('Email address');

  await email.fill('amit@gmail.com');
  // toHaveValue = what is typed inside the input right now
  await expect(email).toHaveValue('amit@gmail.com');
});

test('getByLabel — password + quantity', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Password').fill('123456');
  await page.getByLabel('Quantity').fill('3');

  await expect(page.getByLabel('Password')).toHaveValue('123456');
  await expect(page.getByLabel('Quantity')).toHaveValue('3');
});

test('getByPlaceholder — find input from gray hint text', async ({ page }) => {
  await page.goto('form.html');

  // placeholder="SUMMER10"  → find by that hint
  const promo = page.getByPlaceholder('SUMMER10');
  await promo.fill('WINTER20');

  await expect(promo).toHaveValue('WINTER20');
});

test('getByPlaceholder — login style fields', async ({ page }) => {
  await page.goto('form.html');

  // placeholder="you@example.com"
  const emailByHint = page.getByPlaceholder('you@example.com');
  await emailByHint.fill('hello@test.com');
  await expect(emailByHint).toHaveValue('hello@test.com');

  // placeholder="Enter password"
  const passByHint = page.getByPlaceholder('Enter password');
  await passByHint.fill('secret');
  await expect(passByHint).toHaveValue('secret');
});

test('full form flow — label + placeholder + button', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Email address').fill('amit@gmail.com');
  await page.getByLabel('Password').fill('123456');
  await page.getByPlaceholder('SUMMER10').fill('SAVE10');
  await page.getByLabel('Quantity').fill('2');

  await page.getByRole('button', { name: 'Place order' }).click();

  // success message on same page (form has preventDefault)
  await expect(page.locator('#msg')).toHaveText('Order placed! Thank you.');
});

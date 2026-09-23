// tests/02-fill-type.spec.js
// ============================================================
// LESSON: fill() vs type() — putting text into inputs
// ES6 import / export
// ============================================================
//
//   fill('Amit')   → sets the value INSTANTLY (fast, reliable) ✅ default choice
//   type('Amit')   → presses A, m, i, t one by one like a human
//                    (fires keydown/keypress/keyup for each letter)
//
// Use fill() in almost every test.
// Use type() only when the page reacts to EACH keystroke (search-as-you-type).

import { test, expect } from '@playwright/test';

test('fill — set value instantly', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Full name').fill('Amit Kumar');

  // toHaveValue = what is inside the input right now
  await expect(page.getByLabel('Full name')).toHaveValue('Amit Kumar');
});

test('fill — clear then write (fill always replaces)', async ({ page }) => {
  await page.goto('form.html');

  const email = page.getByLabel('Email');
  await email.fill('first@test.com');
  await expect(email).toHaveValue('first@test.com');

  // second fill REPLACES the old text (no need to clear first)
  await email.fill('second@test.com');
  await expect(email).toHaveValue('second@test.com');
});

test('fill with empty string — clears the input', async ({ page }) => {
  await page.goto('form.html');

  const name = page.getByLabel('Full name');
  await name.fill('Something');
  await name.fill('');                 // empty = clear
  await expect(name).toHaveValue('');
});

test('type — keys one by one like a human', async ({ page }) => {
  await page.goto('form.html');

  // type() sends each character separately
  await page.getByLabel('Full name').type('Amit');

  await expect(page.getByLabel('Full name')).toHaveValue('Amit');
});

test('type with delay — slow human typing', async ({ page }) => {
  await page.goto('form.html');

  // delay: 50 = wait 50ms between keys (for demos / flaky key handlers)
  await page.locator('#fullname').type('Hi', { delay: 50 });

  await expect(page.locator('#fullname')).toHaveValue('Hi');
});

test('fill two fields + submit', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Full name').fill('Amit Kumar');
  await page.getByLabel('Email').fill('amit@gmail.com');
  await page.locator('#fruit').selectOption('mango');

  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.locator('#result')).toHaveText(
    'Order OK for Amit Kumar (mango)'
  );
});

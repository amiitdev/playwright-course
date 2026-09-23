// tests/03-select-dropdown.spec.js
// ============================================================
// LESSON: selectOption() — choose an option from <select>
// ES6 import / export
// ============================================================
//
// HTML:
//   <select id="fruit">
//     <option value="">-- select --</option>
//     <option value="apple">Apple</option>
//     ...
//   </select>
//
// 3 ways to pick:
//   selectOption('apple')                 → by value attribute
//   selectOption({ label: 'Apple' })      → by visible text
//   selectOption({ index: 2 })            → by position (0-based)

import { test, expect } from '@playwright/test';

test('select by value', async ({ page }) => {
  await page.goto('form.html');

  await page.locator('#fruit').selectOption('mango');

  // selected value is now "mango"
  await expect(page.locator('#fruit')).toHaveValue('mango');
});

test('select by visible label text', async ({ page }) => {
  await page.goto('form.html');

  // label = what the human sees: "Banana"
  await page.locator('#fruit').selectOption({ label: 'Banana' });

  await expect(page.locator('#fruit')).toHaveValue('banana');
});

test('select by index (0-based)', async ({ page }) => {
  await page.goto('form.html');

  // options in order:
  //   0: -- select --   value ""
  //   1: Apple          value apple
  //   2: Banana         value banana
  await page.locator('#fruit').selectOption({ index: 2 });

  await expect(page.locator('#fruit')).toHaveValue('banana');
});

test('default is empty until we select', async ({ page }) => {
  await page.goto('form.html');

  // first option value is ""
  await expect(page.locator('#fruit')).toHaveValue('');
});

test('full order flow with dropdown', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Full name').fill('Amit');
  await page.locator('#fruit').selectOption({ label: 'Papaya' });
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.locator('#result')).toHaveText('Order OK for Amit (papaya)');
});

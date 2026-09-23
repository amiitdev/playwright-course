// tests/04-checkbox-radio.spec.js
// ============================================================
// LESSON: checkbox + radio buttons
// ES6 import / export
// ============================================================
//
// CHECKBOX (multi-select — independent boxes):
//   check()     → make it checked
//   uncheck()   → make it unchecked
//   isChecked() → true / false
//
// RADIO (single choice — same name group):
//   check() on the one you want (same as select)
//   isChecked() → is THIS option the selected one?

import { test, expect } from '@playwright/test';

// ------------------------------------------------------------
// CHECKBOXES
// ------------------------------------------------------------
test('checkbox default state', async ({ page }) => {
  await page.goto('form.html');

  // HTML has: sugar checked, cream NOT, nuts NOT
  await expect(page.locator('#extra-cream')).not.toBeChecked();
  await expect(page.locator('#extra-nuts')).not.toBeChecked();
  await expect(page.locator('#extra-sugar')).toBeChecked();
});

test('check — tick a box', async ({ page }) => {
  await page.goto('form.html');

  const cream = page.locator('#extra-cream');
  await expect(cream).not.toBeChecked();   // starting state

  await cream.check();                     // click it ON

  await expect(cream).toBeChecked();       // now ON
  // alternative style (returns a boolean promise):
  // expect(await cream.isChecked()).toBe(true);
});

test('uncheck — untick a box', async ({ page }) => {
  await page.goto('form.html');

  const sugar = page.locator('#extra-sugar');
  await expect(sugar).toBeChecked();       // starts checked in HTML

  await sugar.uncheck();                   // turn OFF

  await expect(sugar).not.toBeChecked();
});

test('check multiple checkboxes', async ({ page }) => {
  await page.goto('form.html');

  await page.locator('#extra-cream').check();
  await page.locator('#extra-nuts').check();
  // sugar stays checked from HTML

  await expect(page.locator('#extra-cream')).toBeChecked();
  await expect(page.locator('#extra-nuts')).toBeChecked();
  await expect(page.locator('#extra-sugar')).toBeChecked();
});

// ------------------------------------------------------------
// RADIO BUTTONS
// ------------------------------------------------------------
test('radio default — standard is selected', async ({ page }) => {
  await page.goto('form.html');

  await expect(page.locator('#ship-standard')).toBeChecked();
  await expect(page.locator('#ship-express')).not.toBeChecked();
});

test('radio — switch to express', async ({ page }) => {
  await page.goto('form.html');

  // check() the express radio → standard auto-unchecks (browser behavior)
  await page.locator('#ship-express').check();

  await expect(page.locator('#ship-express')).toBeChecked();
  await expect(page.locator('#ship-standard')).not.toBeChecked();
});

test('radio — pick with getByLabel', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Express (1 day)').check();
  await expect(page.getByLabel('Express (1 day)')).toBeChecked();
});

test('complete form: text + select + checkbox + radio', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Full name').fill('Amit Kumar');
  await page.locator('#fruit').selectOption('banana');
  await page.locator('#extra-cream').check();
  await page.locator('#ship-express').check();

  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.locator('#result')).toHaveText(
    'Order OK for Amit Kumar (banana)'
  );
});

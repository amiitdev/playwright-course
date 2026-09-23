// tests/06-keyboard.spec.js
// ============================================================
// LESSON: keyboard actions — Enter, Tab, Escape, special keys
// ES6 import / export
// ============================================================
//
// Two styles:
//   1) locator.press('Enter')     → key goes TO that element (focused)
//   2) page.keyboard.press(...)   → key goes to whatever has focus
//
// Common keys:
//   'Enter'  'Tab'  'Escape'  'ArrowDown'  'Backspace'  'Space'
//
// keyboard.type('hello') = types into the FOCUSED element (like type())

import { test, expect } from '@playwright/test';

test('press Enter on input — runs search', async ({ page }) => {
  await page.goto('index.html');

  await page.locator('#search').fill('mango');
  // press Enter ON the search box (it has focus after fill)
  await page.locator('#search').press('Enter');

  await expect(page.locator('#search-result')).toHaveText('Found: mango');
  await expect(page.locator('#last-key')).toHaveText('Last key: Enter');
});

test('click button instead of Enter', async ({ page }) => {
  await page.goto('index.html');

  await page.locator('#search').fill('apple');
  await page.locator('#search-btn').click();

  await expect(page.locator('#search-result')).toHaveText('Found: apple');
});

test('press Escape — clears message', async ({ page }) => {
  await page.goto('index.html');

  // first show a result
  await page.locator('#search').fill('banana');
  await page.locator('#search').press('Enter');
  await expect(page.locator('#search-result')).toHaveText('Found: banana');

  // Escape clears it (our page JS)
  await page.locator('#search').press('Escape');
  await expect(page.locator('#search-result')).toHaveText('');
  await expect(page.locator('#last-key')).toHaveText('Last key: Escape');
});

test('press Tab — move to next field', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Full name').focus();
  await page.keyboard.press('Tab');
  // focus should move to Email input
  await expect(page.getByLabel('Email')).toBeFocused();
});

test('keyboard.type — type into focused element', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Full name').focus();
  // types letters into whatever is focused
  await page.keyboard.type('Amit');

  await expect(page.getByLabel('Full name')).toHaveValue('Amit');
});

test('press Enter to submit form', async ({ page }) => {
  await page.goto('form.html');

  await page.getByLabel('Full name').fill('Amit');
  await page.locator('#fruit').selectOption('apple');

  // focus a field, then Enter submits (browsers submit on Enter in forms)
  await page.getByLabel('Full name').press('Enter');

  await expect(page.locator('#result')).toHaveText('Order OK for Amit (apple)');
});

test('chained keys — type then Arrow/Clear with Backspace', async ({ page }) => {
  await page.goto('form.html');

  const name = page.getByLabel('Full name');
  await name.fill('ABC');
  await expect(name).toHaveValue('ABC');

  // press Backspace 3 times → ""
  await name.press('Backspace');
  await name.press('Backspace');
  await name.press('Backspace');
  await expect(name).toHaveValue('');
});

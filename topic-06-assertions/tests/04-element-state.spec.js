// tests/04-element-state.spec.js
// ============================================================
// LESSON: Element state checks — enabled, checked, focused, value…
// ES6 import / export
// ============================================================
//
//   toBeEnabled()    → button/input NOT disabled — can be clicked
//   toBeDisabled()   → disabled attribute present
//   toBeChecked()    → checkbox/radio is ON
//   toBeFocused()    → element currently has keyboard focus
//   toBeEditable()   → input is not readonly / not disabled
//   toHaveValue(v)   → current value inside input/select
//   toHaveAttribute(name, value) → HTML attribute check
//
// All web-first ones auto-retry.

import { test, expect } from '@playwright/test';

// ------------------------------------------------------------
// ENABLED / DISABLED
// ------------------------------------------------------------
test('toBeEnabled — Save button can be clicked', async ({ page }) => {
  await page.goto('index.html');

  await expect(page.locator('#save-btn')).toBeEnabled();
  await expect(page.locator('#delete-btn')).toBeDisabled();
});

test('state changes after action', async ({ page }) => {
  await page.goto('checkout.html');

  await expect(page.locator('#pay-btn')).toBeEnabled();

  await page.locator('#pay-btn').click();

  // JS sets disabled=true after pay
  await expect(page.locator('#pay-btn')).toBeDisabled();
});

test('click only works on enabled (implicit)', async ({ page }) => {
  await page.goto('index.html');

  // click() would WAIT forever if disabled — we assert first
  await expect(page.locator('#save-btn')).toBeEnabled();
  await page.locator('#save-btn').click();
});

// ------------------------------------------------------------
// CHECKBOX / RADIO
// ------------------------------------------------------------
test('toBeChecked / not.toBeChecked', async ({ page }) => {
  await page.goto('index.html');

  // HTML: agree = checked, newsletter = unchecked
  await expect(page.locator('#agree')).toBeChecked();
  await expect(page.locator('#newsletter')).not.toBeChecked();

  await page.locator('#newsletter').check();
  await expect(page.locator('#newsletter')).toBeChecked();

  await page.locator('#agree').uncheck();
  await expect(page.locator('#agree')).not.toBeChecked();
});

// ------------------------------------------------------------
// FOCUS
// ------------------------------------------------------------
test('toBeFocused — element has keyboard focus', async ({ page }) => {
  await page.goto('index.html');

  await page.locator('#email').focus();
  await expect(page.locator('#email')).toBeFocused();

  await page.locator('#name').focus();
  await expect(page.locator('#name')).toBeFocused();
  await expect(page.locator('#email')).not.toBeFocused();
});

test('Tab moves focus — then assert', async ({ page }) => {
  await page.goto('index.html');

  await page.locator('#email').focus();
  await expect(page.locator('#email')).toBeFocused();

  await page.keyboard.press('Tab');
  // next focusable in DOM order is #locked (readonly inputs are still focusable)
  await expect(page.locator('#locked')).toBeFocused();
});

// ------------------------------------------------------------
// VALUE / EDITABLE / ATTRIBUTES
// ------------------------------------------------------------
test('toHaveValue — input content', async ({ page }) => {
  await page.goto('index.html');

  await expect(page.locator('#qty')).toHaveValue('5');

  await page.locator('#qty').fill('12');
  await expect(page.locator('#qty')).toHaveValue('12');
});

test('toBeEditable vs readonly', async ({ page }) => {
  await page.goto('index.html');

  // normal input → editable
  await expect(page.locator('#email')).toBeEditable();

  // readonly="readonly" → visible but NOT editable
  await expect(page.locator('#locked')).toBeVisible();
  await expect(page.locator('#locked')).not.toBeEditable();
  await expect(page.locator('#locked')).toHaveValue('read only value');
});

test('toHaveAttribute — HTML attribute itself', async ({ page }) => {
  await page.goto('index.html');

  await expect(page.locator('#delete-btn')).toHaveAttribute('disabled', '');
  await expect(page.locator('#agree')).toHaveAttribute('type', 'checkbox');
  await expect(page.locator('#email')).toHaveAttribute('type', 'email');
  await expect(page.locator('[data-testid="tagline"]')).toHaveAttribute('data-testid', 'tagline');
});

test('placeholder + input type via attributes', async ({ page }) => {
  await page.goto('index.html');

  await expect(page.locator('#email')).toHaveAttribute('placeholder', 'you@example.com');
  await expect(page.locator('#qty')).toHaveAttribute('type', 'number');
});

// ------------------------------------------------------------
// FULL STATE COMBO after interaction
// ------------------------------------------------------------
test('full state story on checkout', async ({ page }) => {
  await page.goto('checkout.html');

  // before
  await expect(page.locator('#pay-btn')).toBeEnabled();
  await expect(page.locator('#done')).toBeHidden();
  await expect(page.locator('#step')).toHaveText('Step 1 of 2 — enter details');

  // act
  await page.locator('#pay-btn').click();

  // after
  await expect(page.locator('#pay-btn')).toBeDisabled();
  await expect(page.locator('#done')).toBeVisible();
  await expect(page.locator('#done')).toHaveText('Payment successful! Thank you.');
  await expect(page).toHaveURL(/checkout\.html/);
});

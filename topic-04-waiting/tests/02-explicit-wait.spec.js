// tests/02-explicit-wait.spec.js
// ============================================================
// LESSON: Explicit waits — locator.waitFor()
// ES6 import / export
// ============================================================
//
// Use waitFor() when you need to PAUSE until a known condition,
// often BEFORE doing the next action — and auto-wait on assert
// is not enough by itself (or you want a clear step name).
//
//   await locator.waitFor()                      // default: attached
//   await locator.waitFor({ state: 'visible' })  // shown on screen
//   await locator.waitFor({ state: 'hidden' })   // hidden OR gone
//   await locator.waitFor({ state: 'detached' }) // removed from DOM
//
// Optional: { timeout: 10000 }  (ms) — fail if not ready in time

import { test, expect } from '@playwright/test';

test('waitFor visible — spinner shows then we continue', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Start task' }).click();

  // Explicit step: wait until spinner is on screen
  await page.locator('#spinner').waitFor({ state: 'visible' });
  await expect(page.locator('#spinner')).toHaveText('Please wait… working');

  // Now wait until spinner goes away (task finished)
  await page.locator('#spinner').waitFor({ state: 'hidden' });
  await expect(page.locator('#done-msg')).toBeVisible();
  await expect(page.locator('#done-msg')).toHaveText('Task finished!');
});

test('waitFor hidden — toast disappears after 1s', async ({ page }) => {
  await page.goto('/');

  await page.locator('#notify-btn').click();

  // toast becomes visible first
  await page.locator('#toast').waitFor({ state: 'visible' });
  await expect(page.locator('#toast')).toHaveText('Saved successfully!');

  // then our page hides it after 1 second — waitFor handles that
  await page.locator('#toast').waitFor({ state: 'hidden' });
  await expect(page.locator('#toast')).toBeHidden();
});

test('waitFor with custom timeout', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Load products' }).click();

  // default timeout is 5s for waitFor — we allow 10s explicitly
  await page.locator('#products').waitFor({
    state: 'visible',
    timeout: 10000,
  });
  await expect(page.locator('#products li')).toHaveCount(2);
});

test('waitFor attached — exists in DOM (even if hidden)', async ({ page }) => {
  await page.goto('/');

  // 'attached' = node exists (default state for waitFor)
  // Products <ul> exists from the start but may be display:none
  await page.locator('#products').waitFor({ state: 'attached' });
});

// WHEN to use waitFor vs expect?
// ------------------------------------------------------------
//   expect(el).toBeVisible()   → almost always enough (retries + clear error)
//   el.waitFor({state:...})    → when you need an explicit "step" or
//                                hidden/detached states before next action
// ------------------------------------------------------------

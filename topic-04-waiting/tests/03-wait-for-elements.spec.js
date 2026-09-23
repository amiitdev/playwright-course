// tests/03-wait-for-elements.spec.js
// ============================================================
// LESSON: Waiting for elements with expect matchers
// ES6 import / export
// ============================================================
//
// Web-first assertions ARE waits:
//   expect(locator).toBeVisible()   retries up to 5s (default timeout)
//   expect(locator).toBeHidden()
//   expect(locator).toHaveText(...)
//
// You can change timeout per assertion:
//   await expect(locator).toBeVisible({ timeout: 10000 })
//
// States for elements:
//   attached  → in the DOM
//   visible   → on screen (size > 0, not display:none)
//   hidden    → display:none OR removed from DOM (both count as hidden)

import { test, expect } from '@playwright/test';

test('toBeVisible retries until delayed element shows', async ({ page }) => {
  await page.goto('/');

  await page.locator('#load-btn').click();

  // list starts hidden → assertion keeps retrying until visible (~1.5s)
  await expect(page.locator('#products')).toBeVisible({ timeout: 5000 });
});

test('toBeHidden — loading text hides when done', async ({ page }) => {
  await page.goto('/');

  await page.locator('#load-btn').click();

  // #loading is SHOWN first ("Loading products…")
  await expect(page.locator('#loading')).toBeVisible();

  // then hidden when products arrive
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#products')).toBeVisible();
});

test('toHaveText waits for text to change', async ({ page }) => {
  await page.goto('/');

  await page.locator('#load-btn').click();

  // text is empty/wrong at first; retries until match
  await expect(page.locator('#products')).toHaveText(
    'Apple — $1\nBanana — $2',
    { timeout: 5000 }
  );
});

test('count waits for number of children', async ({ page }) => {
  await page.goto('/');

  await page.locator('#load-btn').click();

  // before load: 0 li visible? actually 2 li exist but parent hidden.
  // toHaveCount counts matches of locator — li exist in DOM even if parent hidden.
  // After visible, we check visible items:
  await expect(page.locator('#products')).toBeVisible();
  await expect(page.locator('#products li')).toHaveCount(2);
});

test('not.toBeVisible — element must stay hidden', async ({ page }) => {
  await page.goto('/');

  // toast starts hidden; we never click notify
  await expect(page.locator('#toast')).not.toBeVisible();
});

test('wait between steps — spinner flow with expect', async ({ page }) => {
  await page.goto('/');

  await page.locator('#start-btn').click();

  // while working
  await expect(page.locator('#spinner')).toBeVisible();
  await expect(page.locator('#spinner')).toContainText('working');

  // after 2s done
  await expect(page.locator('#done-msg')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#done-msg')).toHaveText('Task finished!');
  await expect(page.locator('#spinner')).toBeHidden();
});

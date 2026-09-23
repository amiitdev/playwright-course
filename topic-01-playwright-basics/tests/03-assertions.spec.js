// tests/03-assertions.spec.js
// ============================================================
// LESSON: Assertions (expect) — the most important skill
// ES6 JavaScript — import / export
// ============================================================
//
// Mental model:
//   locator   = "WHERE is the element?"   page.getByRole / page.locator
//   assertion = "WHAT should be true?"    expect(...).toBeVisible()
//
// Two flavors:
//   1) Web-first (async, auto-retry)  → for PAGE ELEMENTS.  You await them.
//   2) Generic   (sync, no retry)     → for plain values.   No await.

import { test, expect } from '@playwright/test';

test.describe('web-first assertions (auto-retry)', () => {
  // test.describe('group') — only organizes the report. No effect on execution.

  test('assert element visibility', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { level: 1 });
    // exists + non-zero size + not hidden
    await expect(heading).toBeVisible();
  });

  test('assert exact text', async ({ page }) => {
    await page.goto('/');
    // EXACT full-string match of innerText (trimmed)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Example Domain');
  });

  test('assert text contains substring (RegExp)', async ({ page }) => {
    await page.goto('/');
    // /Example/ is a RegExp → substring match anywhere in the text
    await expect(page.locator('body')).toContainText(/Example/);
  });

  test('assert element count', async ({ page }) => {
    await page.goto('/');
    // how many elements the locator matches right now (example.com has one <h1>)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('assert page URL', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('https://example.com/');
  });

  test('assert page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Example Domain');
  });
});

test.describe('generic assertions (no retry)', () => {
  test('assert plain values with toBe / toContain', async ({ page }) => {
    await page.goto('/');

    // --- toBe: strict equality (===) on a normal JS string ---
    const title = await page.title();
    expect(title).toBe('Example Domain'); // full equality
    expect(title).toContain('Example');    // substring

    // --- toBeTruthy: not empty / null / undefined / false ---
    const url = page.url();
    expect(url).toBeTruthy();

    // --- typeof check: confirm we really got a string ---
    expect(typeof title).toBe('string');
  });
});

// tests/01-first-test.spec.js
// ============================================================
// LESSON: Test file + test syntax (your very first test)
// ES6 JavaScript — import / export (no require)
// ============================================================

// 1) ES6 IMPORT: pull `test` and `export` out of the library.
//    import { a, b } from 'package'  ===  modern replacement for require()
//    - test   → registers a test case
//    - expect → checks (asserts) the result
import { test, expect } from '@playwright/test';

// 2) test('name', async ({ page }) => { ... })
//    - test() registers one test with a human-readable name.
//    - async function → we can use `await` inside.
//    - { page } is a "fixture": Playwright creates a fresh browser page
//      for THIS test only and closes it when the test ends.
test('page loads and shows Example Domain heading', async ({ page }) => {
  // 3) page.goto('/') — navigate to a URL.
  //    '/' is RELATIVE. baseURL in config is 'https://example.com',
  //    so Playwright actually opens: https://example.com/
  //    await = pause until the page finishes loading.
  await page.goto('/');

  // 4) page.getByRole('heading', { level: 1 }) — find the <h1> by ROLE.
  //    Roles = how screen readers describe the page → readable + stable.
  //    level: 1 = only <h1>, not <h2>/<h3>.
  //    Locators are LAZY: nothing runs until an action/assertion uses them.
  const heading = page.getByRole('heading', { level: 1 });

  // 5) ASSERTION: expect(...).toBeVisible()
  //    "I expect this heading to be visible on screen."
  //    Auto-retries for ~5 seconds. Not visible → test FAILS.
  await expect(heading).toBeVisible();

  // 6) ASSERTION: expect(...).toHaveText('Example Domain')
  //    Visible text must equal EXACTLY 'Example Domain' (full match).
  await expect(heading).toHaveText('Example Domain');
});

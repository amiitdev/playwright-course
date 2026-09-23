// tests/04-tags.spec.js
// ============================================================
// LESSON: Tags — run only smoke tests or only regression tests
// ES6 import / export
// ============================================================
//
// Tags are labels like @smoke, @regression, @wip.
// You put them in the test TITLE or as Playwright `tag` option.
//
// Run:
//   npx playwright test --grep @smoke
//   npx playwright test --grep @regression
//   npm run test:smoke
//
// --grep = only tests whose name/title matches the pattern.

import { test, expect } from '@playwright/test';

// ------------------------------------------------------------
// STYLE 1: tag in the title (simple, works with --grep)
// ------------------------------------------------------------
test.describe('@smoke critical path', () => {
  test('@smoke home page loads', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shopping App');
  });

  test('@smoke user can open login', async ({ page }) => {
    await page.goto('login.html');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('@smoke login reaches dashboard', async ({ page }) => {
    await page.goto('login.html');
    await page.locator('#email').fill('amit@gmail.com');
    await page.locator('#password').fill('123456');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/dashboard\.html/);
  });
});

// ------------------------------------------------------------
// STYLE 2: Playwright tag option (cleaner titles in report)
// ------------------------------------------------------------
test('dashboard shows cart', { tag: '@regression' }, async ({ page }) => {
  await page.goto('dashboard.html');
  await expect(page.locator('#cart li')).toHaveCount(2);
});

test('home add to cart works', { tag: '@regression' }, async ({ page }) => {
  await page.goto('index.html');
  await page.locator('.add').first().click();
  await expect(page.locator('#cart-count')).toHaveText('Cart: 1');
});

test('logout returns to login', { tag: '@regression' }, async ({ page }) => {
  await page.goto('dashboard.html');
  await page.locator('#logout').click();
  await expect(page).toHaveURL(/login\.html/);
});

// ------------------------------------------------------------
// STYLE 3: multiple tags on one test
// ------------------------------------------------------------
test('critical checkout path', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
  await page.goto('login.html');
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled();
});

// ------------------------------------------------------------
// ONLY regression / only smoke — see package.json scripts:
//   npm run test:smoke        → --grep @smoke
//   npm run test:regression   → --grep @regression
//   npx playwright test --grep-invert @wip   → skip @wip
// ------------------------------------------------------------

test('@wip work in progress — skip in CI', async () => {
  // mark unfinished work with @wip and exclude it:
  // npx playwright test --grep-invert @wip
  expect(true).toBe(true);
});

// WHEN to use which tag
// ------------------------------------------------------------
//   @smoke        → tiny set, run on every commit (must pass)
//   @regression   → full suite, run nightly / before release
//   @critical     → money paths (login, pay)
//   @wip          → unfinished; exclude with --grep-invert
// ------------------------------------------------------------

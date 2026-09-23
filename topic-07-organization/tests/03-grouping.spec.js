// tests/03-grouping.spec.js
// ============================================================
// LESSON: Test grouping with test.describe
// ES6 import / export
// ============================================================
//
// test.describe('group name', () => { ... })
//   → organizes tests in the report
//   → can hold nested beforeEach / afterEach for that group only
//   → does NOT change how tests run (still independent by default)
//
// Nesting: describe inside describe = folder inside folder.

import { test, expect } from '@playwright/test';

// ------------------------------------------------------------
// TOP LEVEL GROUPS
// ------------------------------------------------------------
test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
  });

  test('shows title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shopping App');
  });

  test('cart starts empty', async ({ page }) => {
    await expect(page.locator('#cart-count')).toHaveText('Cart: 0');
  });

  test('add button increases cart', async ({ page }) => {
    await page.locator('.add').first().click();
    await expect(page.locator('#cart-count')).toHaveText('Cart: 1');
  });
});

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('login.html');
  });

  test('shows login form', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('login with credentials goes to dashboard', async ({ page }) => {
    await page.locator('#email').fill('amit@gmail.com');
    await page.locator('#password').fill('123456');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/dashboard\.html/);
    await expect(page.locator('#user-email')).toHaveText('amit@gmail.com');
  });
});

// ------------------------------------------------------------
// NESTED GROUPS (folder inside folder)
// ------------------------------------------------------------
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('dashboard.html');
  });

  test.describe('when logged in (email in storage)', () => {
    test.beforeEach(async ({ page }) => {
      // prepare logged-in state for this sub-group only
      await page.evaluate(() => localStorage.setItem('email', 'amit@gmail.com'));
      await page.reload();
    });

    test('shows welcome message', async ({ page }) => {
      await expect(page.locator('#welcome-msg')).toBeVisible();
      await expect(page.locator('#user-email')).toHaveText('amit@gmail.com');
    });

    test('shows cart items', async ({ page }) => {
      await expect(page.locator('#cart li')).toHaveCount(2);
    });
  });

  test.describe('when logged out', () => {
    test('welcome message stays hidden', async ({ page }) => {
      // ensure no email
      await page.evaluate(() => localStorage.removeItem('email'));
      await page.reload();

      await expect(page.locator('#welcome-msg')).toBeHidden();
      await expect(page.locator('#user-email')).toHaveText('not logged in');
    });
  });
});

// ------------------------------------------------------------
// describe.configure — control parallelism for a file/group
// ------------------------------------------------------------
test.describe('serial critical path', () => {
  // force tests in this describe to run one after another
  test.beforeAll(async () => {
    // setup shared for serial group
  });

  test('step 1 — open home', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('step 2 — go login', async ({ page }) => {
    // independent page — but we CHOOSE serial so order is stable
    await page.goto('login.html');
    await expect(page.locator('#email')).toBeVisible();
  });
});

// Configure serial for that group (API form):
// test.describe.configure({ mode: 'serial' });  // at file top affects whole file
// Inside a describe callback you can call test.describe.configure too.

// ORDER OF HOOKS IN GROUPS
// ------------------------------------------------------------
//   file beforeEach
//     group beforeEach (outer)
//       subgroup beforeEach (inner)
//         TEST
//       subgroup afterEach
//     group afterEach
//   file afterEach
// ------------------------------------------------------------

// tests/01-hooks.spec.js
// ============================================================
// LESSON: Hooks — beforeAll / beforeEach / afterEach / afterAll
// ES6 import / export
// ============================================================
//
// Lifecycle of ONE test file:
//
//   beforeAll     → ONCE before ALL tests in this file
//     beforeEach  → BEFORE every test
//       test()    → your test body
//     afterEach   → AFTER every test
//   afterAll      → ONCE after ALL tests in this file
//
// beforeEach is for: open page, login, reset state
// afterEach  is for: cleanup, screenshots on failure, clear storage

import { test, expect } from '@playwright/test';

// Run tests in THIS file one-by-one in one worker so module counters
// are shared (otherwise fullyParallel splits them across workers).
test.describe.configure({ mode: 'serial' });

// ---- file-level hooks (apply to every test in THIS file) ----
let beforeAllCount = 0;
let beforeEachCount = 0;
let afterEachCount = 0;

test.beforeAll(async () => {
  // runs 1 time before the first test
  beforeAllCount += 1;
});

test.beforeEach(async ({ page }) => {
  // runs before EACH test — fresh page already exists (fixture)
  beforeEachCount += 1;
  // common pattern: go to a known starting page
  await page.goto('index.html');
});

test.afterEach(async ({ page }, testInfo) => {
  // runs after EACH test — even if the test FAILED
  afterEachCount += 1;
  // common pattern: attach screenshot when failed (testInfo.status)
  // await page.screenshot({ path: `test-results/${testInfo.title}.png` });
  // page is closed automatically after this by Playwright
});

test.afterAll(() => {
  // runs 1 time after the last test in this file
  // (not used for assertions in tests — just teardown)
});

// ------------------------------------------------------------
// Tests — all start already on index.html because of beforeEach
// ------------------------------------------------------------
test('hook: beforeEach opened home page', async ({ page }) => {
  await expect(page).toHaveURL(/index\.html/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shopping App');
});

test('hook: cart starts at 0 for each test (fresh page)', async ({ page }) => {
  // independent: did NOT click Add in the previous test → still 0
  await expect(page.locator('#cart-count')).toHaveText('Cart: 0');
});

test('hook: can interact after beforeEach setup', async ({ page }) => {
  await page.locator('.add').first().click();
  await page.locator('.add').nth(1).click();
  await expect(page.locator('#cart-count')).toHaveText('Cart: 2');
});

test('hook: counters prove order of hooks', async () => {
  // generic assertions — plain numbers
  expect(beforeAllCount).toBe(1);     // only once for the file
  expect(beforeEachCount).toBe(4);    // 4 tests → 4 beforeEach (we are the 4th)
  expect(afterEachCount).toBe(3);     // first 3 tests already finished afterEach
});

// ------------------------------------------------------------
// Nested hooks inside describe (next tests use a group)
// ------------------------------------------------------------
test.describe('checkout group with extra setup', () => {
  let groupReady = false;

  test.beforeEach(() => {
    // runs IN ADDITION to the file-level beforeEach
    groupReady = true;
  });

  test('nested beforeEach also runs', async ({ page }) => {
    expect(groupReady).toBe(true);
    // file-level beforeEach already opened index.html
    await expect(page).toHaveURL(/index\.html/);
  });
});

// KEY RULES
// ------------------------------------------------------------
//   beforeAll / afterAll  → shared expensive setup/teardown (once)
//   beforeEach / afterEach → per test (login, clear cookie, screenshot)
//   hooks run in order: beforeAll → (beforeEach → test → afterEach)* → afterAll
//   afterEach runs even on FAILURE
// ------------------------------------------------------------

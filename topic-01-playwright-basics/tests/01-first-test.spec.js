// tests/01-first-test.spec.js
// ============================================================
// LESSON: anatomy of ONE test — against our local Shopping App
// ES6: import / export
// ============================================================

import { test, expect } from '@playwright/test';

test('Shopping App home page loads with welcome heading', async ({ page }) => {
  // 1) Open the local page: site/index.html
  //    baseURL in config = file:///.../site/
  await page.goto('index.html');

  // 2) FIND the <h1> (lazy — nothing runs yet)
  const heading = page.locator('h1');

  // 3) CHECK: is it visible on screen?   human: "Can I see the heading?"
  await expect(heading).toBeVisible();

  // 4) CHECK: exact text?                human: "Does it say exactly Welcome Amit?"
  await expect(heading).toHaveText('Welcome Amit');
});

// tests/03-full-flow-pom.spec.js
// ============================================================
// LESSON: Multi-page flow with POM — login → dashboard → logout
// ES6 import / export
// ============================================================
//
// Tests read like a USER STORY:
//   open login → login → see welcome → logout → back on login
//
// Selectors live ONLY in pages/*.js — change UI once, fix one class.

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { HomePage } from '../pages/HomePage.js';

test('@smoke full journey: login → dashboard → logout', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboard = new DashboardPage(page);

  // 1) login
  await loginPage.open();
  await loginPage.login('amit@gmail.com', 'secure123');

  // 2) dashboard checks
  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(dashboard.heading).toHaveText('Dashboard');
  await expect(dashboard.userEmail).toHaveText('amit@gmail.com');
  await expect(dashboard.welcomeMsg).toBeVisible();
  await expect(dashboard.statsList).toHaveCount(2);
  await expect(dashboard.statsList.nth(0)).toHaveText('Orders: 3');

  // 3) logout (method waits for login URL)
  await dashboard.logout();

  await expect(page).toHaveURL(/login\.html/);
  await expect(loginPage.heading).toHaveText('Login');
});

test('login then visit home from dashboard nav', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboard = new DashboardPage(page);
  const home = new HomePage(page);

  await loginPage.open();
  await loginPage.login('amit@gmail.com', 'secure123');
  await expect(page).toHaveURL(/dashboard\.html/);

  // use Home page object after navigation
  await home.open();
  await expect(home.heading).toHaveText('Shopping App');
  await home.addProduct('APPLE');
  await expect(home.cartCount).toHaveText('Cart: 1');
});

test('failed login keeps LoginPage methods reusable', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('bad', '1'); // invalid

  await expect(loginPage.errorMessage).toBeVisible();
  // same object can try again
  await loginPage.login('amit@gmail.com', '123456');
  await expect(page).toHaveURL(/dashboard\.html/);
});

test('why POM — one place for URL knowledge', async ({ page }) => {
  // If UI path changes, only BasePage/goto or page class open() changes.
  const loginPage = new LoginPage(page);
  await loginPage.open();
  expect(await loginPage.url()).toContain('login.html');

  const home = new HomePage(page);
  await home.open();
  expect(await home.url()).toContain('index.html');
});

// WITHOUT vs WITH (mental model)
// ------------------------------------------------------------
//  WITHOUT:
//    await page.getByLabel('Email').fill(...)     // in test A
//    await page.getByLabel('Email').fill(...)     // in test B
//    await page.getByLabel('Email').fill(...)     // in test C
//    UI changes label → fix 3 tests
//
//  WITH POM:
//    this.emailInput = page.getByLabel('Email')   // in LoginPage once
//    await login.fillEmail(...)                   // tests unchanged
//    UI changes → fix 1 class
// ------------------------------------------------------------

// tests/01-login-pom.spec.js
// ============================================================
// LESSON: POM in action — login tests without raw selectors
// ES6 import / export
// ============================================================
//
// WITHOUT POM (messy — selector lives in every test):
//   await page.getByLabel('Email').fill('...');
//   await page.getByLabel('Password').fill('...');
//   await page.getByRole('button', { name: 'Sign in' }).click();
//
// WITH POM (clean — only LoginPage knows selectors):
//   const login = new LoginPage(page);
//   await login.open();
//   await login.login(email, password);

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';

test('@smoke login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboard = new DashboardPage(page);

  await loginPage.open();
  await expect(loginPage.heading).toHaveText('Login');

  // ONE line for fill + fill + click
  await loginPage.login('amit@gmail.com', '123456');

  // on dashboard
  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(dashboard.userEmail).toHaveText('amit@gmail.com');
  await expect(dashboard.welcomeMsg).toBeVisible();
});

test('login keeps user on page when password too short', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('amit@gmail.com', '12'); // < 4 chars → error

  await expect(page).toHaveURL(/login\.html/);
  await expect(loginPage.errorMessage).toBeVisible();
  await expect(loginPage.errorMessage).toHaveText('Invalid email or password');
});

test('login error when email has no @', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('not-an-email', '123456');

  await expect(loginPage.errorMessage).toBeVisible();
  await expect(page).toHaveURL(/login\.html/);
});

test('back home link from login page', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.backHomeLink.click();

  await expect(page).toHaveURL(/index\.html/);
});

test('chaining style: open() returns this', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // open() returns this → we can chain (optional style)
  await loginPage.open();
  await expect(loginPage.heading).toBeVisible();
  expect(await loginPage.title()).toContain('Login');
});

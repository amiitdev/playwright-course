// tests/04-wait-network.spec.js
// ============================================================
// LESSON: Waiting for network responses (API calls)
// ES6 import / export
// ============================================================
//
// When you click "Get products", the page calls:
//   GET /api/products   (server sleeps 1 second, then JSON)
//
// Two helpers:
//   page.waitForResponse(urlOrPredicate)  → wait for RESPONSE to come back
//   page.waitForRequest(urlOrPredicate)   → wait for REQUEST to be sent
//
// Pattern (important): start waitForResponse BEFORE the click,
// otherwise the response may finish before you start waiting.

import { test, expect } from '@playwright/test';

test('waitForResponse — click then wait for /api/products', async ({ page }) => {
  await page.goto('/network.html');

  // 1) START waiting first (don't click yet)
  const responsePromise = page.waitForResponse((res) =>
    res.url().includes('/api/products') && res.status() === 200
  );

  // 2) THEN click — this triggers fetch('/api/products')
  await page.getByRole('button', { name: 'Get products' }).click();

  // 3) Wait until the response arrives (~1s on our server)
  const response = await responsePromise;
  expect(response.status()).toBe(200);

  // 4) Now the UI should show results (auto-wait assertion)
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#result')).toHaveText('Products loaded!');
  await expect(page.locator('#products-json')).toContainText('Apple');
});

test('waitForResponse with JSON body check', async ({ page }) => {
  await page.goto('/network.html');

  const responsePromise = page.waitForResponse('/api/products');
  await page.locator('#fetch-products').click();

  const response = await responsePromise;
  const body = await response.json();

  expect(body.products).toHaveLength(2);
  expect(body.products[0].name).toBe('Apple');
});

test('waitForResponse — slower /api/user (1.5s)', async ({ page }) => {
  await page.goto('/network.html');

  const responsePromise = page.waitForResponse((res) =>
    res.url().includes('/api/user')
  );

  await page.getByRole('button', { name: 'Get user' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);

  await expect(page.locator('#user-box')).toBeVisible();
  await expect(page.locator('#user-box')).toHaveText('Hello, Amit!');
});

test('waitForRequest — ensure the API call was even sent', async ({ page }) => {
  await page.goto('/network.html');

  const requestPromise = page.waitForRequest((req) =>
    req.url().includes('/api/products')
  );

  await page.locator('#fetch-products').click();

  const request = await requestPromise;
  expect(request.method()).toBe('GET');

  // UI catches up automatically
  await expect(page.locator('#result')).toBeVisible();
});

test('page.route mock — make API instant (fast tests)', async ({ page }) => {
  await page.goto('/network.html');

  // Intercept and answer OURSELVES — no 1s server delay.
  // Great for unit-ish speed when you do not care about the real API.
  await page.route('**/api/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        products: [{ id: 99, name: 'Mocked Fruit', price: 9 }],
      }),
    });
  });

  const responsePromise = page.waitForResponse('/api/products');
  await page.locator('#fetch-products').click();
  await responsePromise;

  await expect(page.locator('#products-json')).toContainText('Mocked Fruit');
});

// ORDER OF OPERATIONS (memorize)
// ------------------------------------------------------------
//   const p = page.waitForResponse(...)   // 1. arm the trap
//   await page.click(...)                 // 2. trigger the call
//   const res = await p                   // 3. wait for it
//   await expect(ui)...                   // 4. assert UI
// ------------------------------------------------------------

// tests/01-get-requests.spec.js
// ============================================================
// LESSON: GET requests — read data (safe, no side effects)
// ES6 import / export
// ============================================================
//
// Built-in fixture: { request }  → APIRequestContext
//   await request.get('/api/products')
//   res.status()     → HTTP status number (200, 404…)
//   res.ok()         → status in 200–299 ?
//   res.headers()    → response headers
//   res.json()       → parsed JSON body
//   res.text()       → body as string
//
// No browser needed — pure HTTP.

import { test, expect } from '@playwright/test';

test('GET list products — 200 + JSON array', async ({ request }) => {
  const res = await request.get('/api/products');

  // ---- status / ok ----
  expect(res.status()).toBe(200);
  expect(res.ok()).toBe(true);

  // ---- JSON body ----
  const body = await res.json();
  expect(body.count).toBeGreaterThanOrEqual(3);
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.data[0]).toHaveProperty('id');
  expect(body.data[0]).toHaveProperty('name');
  expect(body.data[0]).toHaveProperty('price');
});

test('GET one product by id', async ({ request }) => {
  const res = await request.get('/api/products/1');
  expect(res.status()).toBe(200);

  const product = await res.json();
  expect(product.id).toBe(1);
  expect(product.name).toBe('Apple');
  expect(product.price).toBe(1);
});

test('GET product not found — 404', async ({ request }) => {
  const res = await request.get('/api/products/9999');
  expect(res.status()).toBe(404);

  const body = await res.json();
  expect(body.error).toContain('not found');
});

test('GET with query string ?name=ban', async ({ request }) => {
  // server filters by name contains "ban" → Banana
  const res = await request.get('/api/products?name=ban');
  expect(res.status()).toBe(200);

  const body = await res.json();
  expect(body.count).toBe(1);
  expect(body.data[0].name).toBe('Banana');
});

test('GET headers — content-type is JSON', async ({ request }) => {
  const res = await request.get('/api/products');
  const headers = res.headers();

  expect(headers['content-type']).toContain('application/json');
});

test('GET unknown path — 404 JSON', async ({ request }) => {
  const res = await request.get('/api/nope');
  expect(res.status()).toBe(404);

  const body = await res.json();
  expect(body.error).toBe('Not found');
});

// GET checklist
// ------------------------------------------------------------
//   1. status code
//   2. body shape (keys / types)
//   3. key values
//   4. headers if needed
//   5. error cases (404, 400…)
// ------------------------------------------------------------

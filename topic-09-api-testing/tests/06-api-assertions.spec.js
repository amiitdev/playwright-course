// tests/06-api-assertions.spec.js
// ============================================================
// LESSON: API assertions — status, body, types, headers, chains
// ES6 import / export
// ============================================================
//
// You are NOT looking at a screen — you assert the HTTP response.
//
//   res.status()      number
//   res.ok()          2xx?
//   res.statusText()  "OK" / "Created"…
//   res.headers()     object of headers
//   await res.json()  parsed object
//   await res.text()  raw string
//
// Assert on: status · shape · types · values · headers · chains

import { test, expect } from '@playwright/test';
import { getToken, authHeaders } from './helpers.js';

test('assert status codes exactly', async ({ request }) => {
  expect((await request.get('/api/products')).status()).toBe(200);
  expect((await request.get('/api/products/1')).status()).toBe(200);
  expect((await request.get('/api/products/9999')).status()).toBe(404);
  expect((await request.post('/api/login', { data: {} })).status()).toBe(401);
});

test('assert body shape (keys exist)', async ({ request }) => {
  const body = await (await request.get('/api/products')).json();

  expect(body).toHaveProperty('count');
  expect(body).toHaveProperty('data');
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.data[0]).toMatchObject({
    id: expect.any(Number),
    name: expect.any(String),
    price: expect.any(Number),
    stock: expect.any(Number),
  });
});

test('assert value types', async ({ request }) => {
  const product = await (await request.get('/api/products/1')).json();

  expect(typeof product.id).toBe('number');
  expect(typeof product.name).toBe('string');
  expect(typeof product.price).toBe('number');
  expect(product.name.length).toBeGreaterThan(0);
});

test('assert response headers', async ({ request }) => {
  const res = await request.get('/api/products');
  const headers = res.headers();

  expect(headers['content-type']).toContain('application/json');
  expect(res.ok()).toBe(true);
});

test('assert JSON string equality (text)', async ({ request }) => {
  const res = await request.get('/api/products/1');
  const text = await res.text();

  // body is valid JSON string containing "Apple"
  expect(text).toContain('"Apple"');
  // and it parses
  expect(() => JSON.parse(text)).not.toThrow();
});

test('assert list filtering + count math', async ({ request }) => {
  const all = await (await request.get('/api/products')).json();
  const filtered = await (await request.get('/api/products?name=mango')).json();

  expect(filtered.count).toBeLessThan(all.count);
  expect(filtered.data[0].name.toLowerCase()).toContain('mango');
});

test('assert chain: login → me → create → get → delete', async ({ request }) => {
  // 1) login
  const loginRes = await request.post('/api/login', {
    data: { email: 'amit@gmail.com', password: '123456' },
  });
  expect(loginRes.status()).toBe(200);
  const { token } = await loginRes.json();
  const headers = authHeaders(token);

  // 2) me
  const meRes = await request.get('/api/me', { headers });
  expect(meRes.status()).toBe(200);
  expect((await meRes.json()).loggedIn).toBe(true);

  // 3) create
  const createRes = await request.post('/api/products', {
    headers,
    data: { name: 'AssertChain', price: 15, stock: 4 },
  });
  expect(createRes.status()).toBe(201);
  const created = await createRes.json();
  expect(created.name).toBe('AssertChain');

  // 4) read back
  const getRes = await request.get(`/api/products/${created.id}`, { headers });
  expect(getRes.status()).toBe(200);
  expect((await getRes.json()).price).toBe(15);

  // 5) delete cleanup
  const delRes = await request.delete(`/api/products/${created.id}`, { headers });
  expect(delRes.status()).toBe(200);

  // 6) confirm gone
  const gone = await request.get(`/api/products/${created.id}`);
  expect(gone.status()).toBe(404);
});

test('negative: assert error messages in body', async ({ request }) => {
  const res = await request.post('/api/products', {
    headers: authHeaders(await getToken(request)),
    data: { price: 1 }, // no name
  });

  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/name and price/i);
});

test('page.request — same API from browser context', async ({ page }) => {
  // extra tool: page.request shares cookies with the browser page
  await page.goto('about:blank'); // any page ok for pure API
  const res = await page.request.get('/api/products');
  expect(res.status()).toBe(200);
  expect((await res.json()).count).toBeGreaterThanOrEqual(3);
});

// ASSERTION CHEAT TABLE
// ------------------------------------------------------------
//   status        expect(res.status()).toBe(200)
//   success?      expect(res.ok()).toBe(true)
//   has key       expect(body).toHaveProperty('token')
//   types         expect(typeof x).toBe('number')
//   match object  expect(obj).toMatchObject({ name: expect.any(String) })
//   string match  expect(text).toContain('Apple')
//   regex         expect(body.error).toMatch(/not found/i)
//   chain steps   login → use token → verify → cleanup
// ------------------------------------------------------------

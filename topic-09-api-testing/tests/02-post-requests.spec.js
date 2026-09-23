// tests/02-post-requests.spec.js
// ============================================================
// LESSON: POST requests — CREATE new data
// ES6 import / export
// ============================================================
//
//   request.post('/api/products', { data: {...}, headers: {...} })
//
// Typical create response: 201 Created + body of new resource
// Errors: 400 bad body, 401 no auth, 404…

import { test, expect } from '@playwright/test';
import { getToken, authHeaders } from './helpers.js';

test('POST create product — 201 + returned object', async ({ request }) => {
  const token = await getToken(request);

  const payload = { name: 'Kiwi', price: 4, stock: 12 };
  const res = await request.post('/api/products', {
    headers: authHeaders(token),
    data: payload,
  });

  expect(res.status()).toBe(201);

  const created = await res.json();
  expect(created).toHaveProperty('id');
  expect(created.name).toBe('Kiwi');
  expect(created.price).toBe(4);
  expect(created.stock).toBe(12);
  expect(typeof created.id).toBe('number');

  // follow-up: it really exists via GET
  const getRes = await request.get(`/api/products/${created.id}`);
  expect(getRes.status()).toBe(200);
  const found = await getRes.json();
  expect(found.name).toBe('Kiwi');
});

test('POST without auth — 401', async ({ request }) => {
  const res = await request.post('/api/products', {
    data: { name: 'Hacker', price: 0 },
    headers: { 'Content-Type': 'application/json' },
  });

  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.error).toContain('Authorization');
});

test('POST invalid body (missing price) — 400', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.post('/api/products', {
    headers: authHeaders(token),
    data: { name: 'NoPrice' }, // price missing
  });

  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toContain('name and price');
});

test('POST then list contains new item', async ({ request }) => {
  const token = await getToken(request);

  const before = await (await request.get('/api/products')).json();
  const beforeCount = before.count;

  await request.post('/api/products', {
    headers: authHeaders(token),
    data: { name: 'Papaya', price: 5, stock: 3 },
  });

  const after = await (await request.get('/api/products')).json();
  expect(after.count).toBe(beforeCount + 1);
  expect(after.data.some((p) => p.name === 'Papaya')).toBe(true);
});

// POST checklist
// ------------------------------------------------------------
//   1. status 201 (created)
//   2. body echoes what you sent (+ id)
//   3. resource visible on GET
//   4. missing auth → 401
//   5. bad payload → 400
// ------------------------------------------------------------

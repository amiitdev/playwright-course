// tests/03-put-patch.spec.js
// ============================================================
// LESSON: PUT (replace all) vs PATCH (update part)
// ES6 import / export
// ============================================================
//
// PUT    /api/products/1   body = FULL object → replace
// PATCH  /api/products/1   body = only fields to change → merge
//
// Both need Authorization + exist (else 404).

import { test, expect } from '@playwright/test';
import { getToken, authHeaders } from './helpers.js';

test('PUT replace full product — 200', async ({ request }) => {
  const token = await getToken(request);

  // create a target first
  const created = await (
    await request.post('/api/products', {
      headers: authHeaders(token),
      data: { name: 'Old Name', price: 1, stock: 1 },
    })
  ).json();

  // PUT = send the WHOLE new object
  const res = await request.put(`/api/products/${created.id}`, {
    headers: authHeaders(token),
    data: { name: 'New Name', price: 99, stock: 50 },
  });

  expect(res.status()).toBe(200);
  const updated = await res.json();
  expect(updated.name).toBe('New Name');
  expect(updated.price).toBe(99);
  expect(updated.stock).toBe(50);
  expect(updated.id).toBe(created.id);
});

test('PUT without full fields — 400', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.put('/api/products/1', {
    headers: authHeaders(token),
    data: { name: 'OnlyName' }, // missing price
  });

  expect(res.status()).toBe(400);
});

test('PUT missing product — 404', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.put('/api/products/424242', {
    headers: authHeaders(token),
    data: { name: 'Ghost', price: 1, stock: 0 },
  });

  expect(res.status()).toBe(404);
});

test('PATCH only one field — other fields stay', async ({ request }) => {
  const token = await getToken(request);

  // baseline
  const before = await (await request.get('/api/products/1')).json();
  expect(before.name).toBe('Apple');
  expect(before.price).toBe(1);

  // PATCH only stock
  const res = await request.patch('/api/products/1', {
    headers: authHeaders(token),
    data: { stock: 99 },
  });

  expect(res.status()).toBe(200);
  const after = await res.json();

  expect(after.stock).toBe(99);       // changed
  expect(after.name).toBe('Apple');   // unchanged
  expect(after.price).toBe(1);        // unchanged
  expect(after.id).toBe(1);
});

test('PATCH price only', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.patch('/api/products/2', {
    headers: authHeaders(token),
    data: { price: 2.5 },
  });

  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.price).toBe(2.5);
  expect(body.name).toBe('Banana');
});

test('PUT vs PATCH — mental check', async ({ request }) => {
  const token = await getToken(request);

  // create disposable product
  const p = await (
    await request.post('/api/products', {
      headers: authHeaders(token),
      data: { name: 'Temp', price: 1, stock: 1 },
    })
  ).json();

  // PUT sends everything
  const putRes = await request.put(`/api/products/${p.id}`, {
    headers: authHeaders(token),
    data: { name: 'Temp2', price: 2, stock: 2 },
  });
  expect((await putRes.json()).name).toBe('Temp2');

  // PATCH sends one key
  const patchRes = await request.patch(`/api/products/${p.id}`, {
    headers: authHeaders(token),
    data: { stock: 77 },
  });
  const patched = await patchRes.json();
  expect(patched.stock).toBe(77);
  expect(patched.name).toBe('Temp2'); // still Temp2
});

// PUT vs PATCH
// ------------------------------------------------------------
//   PUT    → "here is the full new object" (replace)
//   PATCH  → "change only these fields"    (merge)
//
//   PUT missing field  → often 400 or field reset
//   PATCH missing field → field stays as before
// ------------------------------------------------------------

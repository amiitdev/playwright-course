// tests/04-delete.spec.js
// ============================================================
// LESSON: DELETE requests — remove data
// ES6 import / export
// ============================================================
//
//   DELETE /api/products/:id
//   success → often 200 with { deleted: true } or 204 No Content
//   missing → 404
//   no auth → 401
//
// Best practice in tests: create → delete → verify gone (cleanup).

import { test, expect } from '@playwright/test';
import { getToken, authHeaders } from './helpers.js';

async function createProduct(request, overrides = {}) {
  const token = await getToken(request);
  const res = await request.post('/api/products', {
    headers: authHeaders(token),
    data: { name: 'ToDelete', price: 9, stock: 1, ...overrides },
  });
  expect(res.status()).toBe(201);
  return { token, product: await res.json() };
}

test('DELETE product — 200 + gone on GET', async ({ request }) => {
  const { token, product } = await createProduct(request);

  // delete it
  const delRes = await request.delete(`/api/products/${product.id}`, {
    headers: authHeaders(token),
  });
  expect(delRes.status()).toBe(200);
  const delBody = await delRes.json();
  expect(delBody.deleted).toBe(true);
  expect(delBody.product.id).toBe(product.id);

  // verify gone
  const getRes = await request.get(`/api/products/${product.id}`);
  expect(getRes.status()).toBe(404);
});

test('DELETE missing product — 404', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.delete('/api/products/888888', {
    headers: authHeaders(token),
  });
  expect(res.status()).toBe(404);
});

test('DELETE without auth — 401', async ({ request }) => {
  const res = await request.delete('/api/products/1');
  expect(res.status()).toBe(401);
});

test('DELETE twice — second is 404', async ({ request }) => {
  const { token, product } = await createProduct(request, { name: 'OnceOnly' });

  const first = await request.delete(`/api/products/${product.id}`, {
    headers: authHeaders(token),
  });
  expect(first.status()).toBe(200);

  const second = await request.delete(`/api/products/${product.id}`, {
    headers: authHeaders(token),
  });
  expect(second.status()).toBe(404);
});

test('full CRUD lifecycle: create → read → update → delete', async ({ request }) => {
  const token = await getToken(request);

  // CREATE
  const createRes = await request.post('/api/products', {
    headers: authHeaders(token),
    data: { name: 'Lifecycle', price: 10, stock: 5 },
  });
  expect(createRes.status()).toBe(201);
  const { id } = await createRes.json();

  // READ
  const readRes = await request.get(`/api/products/${id}`);
  expect(readRes.status()).toBe(200);
  expect((await readRes.json()).name).toBe('Lifecycle');

  // UPDATE (PATCH)
  const patchRes = await request.patch(`/api/products/${id}`, {
    headers: authHeaders(token),
    data: { price: 11 },
  });
  expect(patchRes.status()).toBe(200);
  expect((await patchRes.json()).price).toBe(11);

  // DELETE
  const delRes = await request.delete(`/api/products/${id}`, {
    headers: authHeaders(token),
  });
  expect(delRes.status()).toBe(200);

  // GONE
  const gone = await request.get(`/api/products/${id}`);
  expect(gone.status()).toBe(404);
});

// DELETE checklist
// ------------------------------------------------------------
//   1. success status (200 / 204)
//   2. GET after delete → 404
//   3. no auth → 401
//   4. delete again → 404
//   5. always cleanup in tests (create → use → delete)
// ------------------------------------------------------------

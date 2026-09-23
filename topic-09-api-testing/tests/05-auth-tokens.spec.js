// tests/05-auth-tokens.spec.js
// ============================================================
// LESSON: Authentication tokens (Bearer JWT-style)
// ES6 import / export
// ============================================================
//
// Flow:
//   1. POST /api/login  { email, password }
//   2. response: { token: "tok_..." }
//   3. later requests:  Authorization: Bearer <token>
//
// Without / with wrong token → 401 Unauthorized

import { test, expect } from '@playwright/test';
import { getToken, authHeaders } from './helpers.js';

test('login returns a token', async ({ request }) => {
  const res = await request.post('/api/login', {
    data: { email: 'amit@gmail.com', password: '123456' },
  });

  expect(res.status()).toBe(200);
  const body = await res.json();

  expect(body).toHaveProperty('token');
  expect(body.token).toMatch(/^tok_/);
  expect(body.user.email).toBe('amit@gmail.com');
  expect(body.user.name).toBe('Amit');
});

test('login wrong password — 401', async ({ request }) => {
  const res = await request.post('/api/login', {
    data: { email: 'amit@gmail.com', password: 'wrong' },
  });

  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.error).toContain('Invalid');
});

test('login unknown email — 401', async ({ request }) => {
  const res = await request.post('/api/login', {
    data: { email: 'nobody@x.com', password: '123456' },
  });
  expect(res.status()).toBe(401);
});

test('GET /api/me with valid token — 200', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.get('/api/me', {
    headers: authHeaders(token),
  });

  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.loggedIn).toBe(true);
  expect(body.email).toBe('amit@gmail.com');
});

test('GET /api/me without token — 401', async ({ request }) => {
  const res = await request.get('/api/me');
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.error).toContain('Missing Authorization');
});

test('GET /api/me with garbage token — 401', async ({ request }) => {
  const res = await request.get('/api/me', {
    headers: { Authorization: 'Bearer not-a-real-token' },
  });
  expect(res.status()).toBe(401);
});

test('protected POST without token — 401', async ({ request }) => {
  const res = await request.post('/api/products', {
    data: { name: 'NoAuth', price: 1 },
  });
  expect(res.status()).toBe(401);
});

test('use token across several calls (helper pattern)', async ({ request }) => {
  // one login → many authorized calls
  const token = await getToken(request);

  const me = await request.get('/api/me', { headers: authHeaders(token) });
  expect(me.status()).toBe(200);

  const list = await request.get('/api/products', { headers: authHeaders(token) });
  expect(list.status()).toBe(200);

  const create = await request.post('/api/products', {
    headers: authHeaders(token),
    data: { name: 'WithToken', price: 6, stock: 2 },
  });
  expect(create.status()).toBe(201);

  // cleanup
  const { id } = await create.json();
  const del = await request.delete(`/api/products/${id}`, {
    headers: authHeaders(token),
  });
  expect(del.status()).toBe(200);
});

// AUTH checklist
// ------------------------------------------------------------
//   login success  → token
//   login fail     → 401
//   no header      → 401
//   bad token      → 401
//   good token     → 200 on protected routes
//
//   Pattern: getToken() once → authHeaders(token) everywhere
// ------------------------------------------------------------

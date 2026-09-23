# Topic 9 — API Testing

> **Goal:** test REST APIs with Playwright’s built-in `request` fixture — **GET, POST, PUT, PATCH, DELETE**, **Bearer tokens**, and solid **API assertions**. No browser UI required.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Server:** tiny Node REST API (`server.js`, auto-started by Playwright)  
**Real result from my machine:** `38 passed (1.8s)` ✅

---

## Table of Contents

1. [What is API testing?](#1-what-is-api-testing)
2. [Our API](#2-our-api)
3. [Setup](#3-setup)
4. [GET requests](#4-get-requests)
5. [POST requests](#5-post-requests)
6. [PUT / PATCH](#6-put--patch)
7. [DELETE](#7-delete)
8. [Authentication tokens](#8-authentication-tokens)
9. [API assertions](#9-api-assertions)
10. [Real failures we fixed](#10-real-failures-we-fixed)
11. [Cheat sheet](#11-cheat-sheet)
12. [Real full output](#12-real-full-output)

---

## 1. What is API testing?

UI tests click buttons. **API tests call the server directly.**

```text
  UI test:   open page → click "Add" → see cart
  API test:  POST /api/products → assert 201 + JSON body
```

| | UI test | API test |
|--|---------|----------|
| Fixture | `page` | **`request`** |
| Sees | screens, elements | status codes, JSON |
| Speed | slower | **very fast** (1.8s for 38 tests) |
| Needs browser? | yes | **no** |

Playwright gives you:

```js
test('example', async ({ request }) => {
  const res = await request.get('/api/products');
  expect(res.status()).toBe(200);
});
```

---

## 2. Our API

Base URL: `http://localhost:3456`

| Method | Path | Auth? | What it does |
|--------|------|-------|--------------|
| GET | `/api/products` | no | list (`?name=` filter) |
| GET | `/api/products/:id` | no | one product |
| POST | `/api/products` | **yes** | create |
| PUT | `/api/products/:id` | **yes** | replace full object |
| PATCH | `/api/products/:id` | **yes** | merge partial fields |
| DELETE | `/api/products/:id` | **yes** | remove |
| POST | `/api/login` | no | `{email,password}` → `{token}` |
| GET | `/api/me` | **yes** | who am I? |

**Auth model:**

```text
  POST /api/login
    body: { "email": "amit@gmail.com", "password": "123456" }
    → 200 { "token": "tok_amit@gmail.com", "user": {...} }

  Later requests:
    Authorization: Bearer tok_amit@gmail.com
```

Data lives **in memory** → reset when server restarts.  
Config uses `workers: 1` so tests never race the shared DB.

---

## 3. Setup

```bash
cd topic-09-api-testing
npm install
npx playwright install chromium   # still needed for one page.request demo
npx playwright test
```

`playwright.config.js` starts the server for you:

```js
use: {
  baseURL: 'http://localhost:3456',
},
workers: 1,  // shared in-memory DB
webServer: {
  command: 'node server.js',
  url: 'http://localhost:3456/api/products',
  reuseExistingServer: true,
},
```

**Human check:** *"`npx playwright test` boots the API automatically."*

### Shared helpers — `tests/helpers.js`

```js
export async function getToken(request, email = 'amit@gmail.com', password = '123456') {
  const res = await request.post('/api/login', { data: { email, password } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.token;
}

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
```

---

## 4. GET requests

**Human check:** *"Give me the list. Give me product #1. What if #9999?"*

```js
test('GET list products — 200 + JSON array', async ({ request }) => {
  const res = await request.get('/api/products');

  expect(res.status()).toBe(200);   // status
  expect(res.ok()).toBe(true);      // 2xx?

  const body = await res.json();    // parsed JSON
  expect(body.count).toBeGreaterThanOrEqual(3);
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.data[0]).toHaveProperty('name');
});

test('GET one product by id', async ({ request }) => {
  const res = await request.get('/api/products/1');
  expect(res.status()).toBe(200);

  const product = await res.json();
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
  const res = await request.get('/api/products?name=ban');
  const body = await res.json();
  expect(body.data[0].name).toBe('Banana');
});
```

| Response API | Meaning |
|--------------|---------|
| `res.status()` | `200`, `404`, … |
| `res.ok()` | status 200–299? |
| `res.headers()` | header object |
| `await res.json()` | parsed object |
| `await res.text()` | raw string |

---

## 5. POST requests

**Human check:** *"Create a Kiwi. Did I get 201 and an id?"*

```js
test('POST create product — 201 + returned object', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.post('/api/products', {
    headers: authHeaders(token),
    data: { name: 'Kiwi', price: 4, stock: 12 },
  });

  expect(res.status()).toBe(201);          // Created

  const created = await res.json();
  expect(created.name).toBe('Kiwi');
  expect(typeof created.id).toBe('number');

  // it really exists
  const getRes = await request.get(`/api/products/${created.id}`);
  expect(getRes.status()).toBe(200);
});
```

### Error cases

```js
// no token → 401
test('POST without auth — 401', async ({ request }) => {
  const res = await request.post('/api/products', {
    data: { name: 'Hacker', price: 0 },
  });
  expect(res.status()).toBe(401);
});

// missing price → 400
test('POST invalid body — 400', async ({ request }) => {
  const token = await getToken(request);
  const res = await request.post('/api/products', {
    headers: authHeaders(token),
    data: { name: 'NoPrice' },
  });
  expect(res.status()).toBe(400);
});
```

| Status | When |
|--------|------|
| **201** | resource created |
| **400** | bad JSON / missing fields |
| **401** | not logged in |

---

## 6. PUT / PATCH

```text
  PUT    → replace the WHOLE object (send name + price + stock)
  PATCH  → change ONLY the fields you send (merge)
```

### PUT (replace)

```js
test('PUT replace full product — 200', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.put(`/api/products/${created.id}`, {
    headers: authHeaders(token),
    data: { name: 'New Name', price: 99, stock: 50 }, // full object
  });

  expect(res.status()).toBe(200);
  const updated = await res.json();
  expect(updated.name).toBe('New Name');
  expect(updated.price).toBe(99);
});
```

### PATCH (partial)

```js
test('PATCH only one field — other fields stay', async ({ request }) => {
  const token = await getToken(request);

  const res = await request.patch('/api/products/1', {
    headers: authHeaders(token),
    data: { stock: 99 },   // ONLY stock
  });

  const after = await res.json();
  expect(after.stock).toBe(99);       // changed
  expect(after.name).toBe('Apple');   // unchanged
  expect(after.price).toBe(1);        // unchanged
});
```

| | PUT | PATCH |
|--|-----|-------|
| Body | full object | only changed keys |
| Missing field | 400 (our API) | field stays old |
| English | *“here is the new object”* | *“change these bits”* |

---

## 7. DELETE

```js
test('DELETE product — 200 + gone on GET', async ({ request }) => {
  const token = await getToken(request);
  // … create product first …

  const delRes = await request.delete(`/api/products/${product.id}`, {
    headers: authHeaders(token),
  });
  expect(delRes.status()).toBe(200);
  expect((await delRes.json()).deleted).toBe(true);

  // verify gone
  const getRes = await request.get(`/api/products/${product.id}`);
  expect(getRes.status()).toBe(404);
});
```

### Full CRUD lifecycle (one test)

```js
// CREATE → READ → UPDATE → DELETE → 404
create → 201
get    → 200
patch  → 200
delete → 200
get    → 404
```

**Human check:** *"Create, read, update, delete — then confirm it’s gone."*

| Case | Status |
|------|--------|
| success | 200 |
| already deleted | 404 |
| no auth | 401 |

---

## 8. Authentication tokens

### Flow

```text
  ┌─────────────┐   email + password   ┌──────────────┐
  │ POST        │ ───────────────────► │ /api/login   │
  │ /api/login  │ ◄─────────────────── │              │
  └─────────────┘   { token: "tok_…" } └──────────────┘
         │
         │  Authorization: Bearer tok_…
         ▼
  ┌──────────────────┐
  │ GET /api/me      │  → 200 { email, loggedIn: true }
  │ POST /products   │  → 201
  └──────────────────┘
```

### Tests

```js
test('login returns a token', async ({ request }) => {
  const res = await request.post('/api/login', {
    data: { email: 'amit@gmail.com', password: '123456' },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.token).toMatch(/^tok_/);
});

test('wrong password — 401', async ({ request }) => {
  const res = await request.post('/api/login', {
    data: { email: 'amit@gmail.com', password: 'wrong' },
  });
  expect(res.status()).toBe(401);
});

test('GET /api/me with valid token — 200', async ({ request }) => {
  const token = await getToken(request);
  const res = await request.get('/api/me', {
    headers: authHeaders(token),
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).loggedIn).toBe(true);
});

test('GET /api/me without token — 401', async ({ request }) => {
  const res = await request.get('/api/me');
  expect(res.status()).toBe(401);
});
```

**Pattern to memorize:**

```js
const token = await getToken(request);
const headers = authHeaders(token);
// reuse headers on every protected call
```

| Situation | Status |
|-----------|--------|
| good login | 200 + token |
| bad password | 401 |
| missing header | 401 |
| garbage token | 401 |
| valid Bearer | 200 |

---

## 9. API assertions

You assert the **HTTP response**, not a screen.

### Status

```js
expect(res.status()).toBe(200);
expect(res.ok()).toBe(true);
```

### Body shape

```js
const body = await res.json();
expect(body).toHaveProperty('count');
expect(body).toHaveProperty('data');
expect(Array.isArray(body.data)).toBe(true);
expect(body.data[0]).toMatchObject({
  id: expect.any(Number),
  name: expect.any(String),
  price: expect.any(Number),
});
```

### Types & values

```js
expect(typeof product.id).toBe('number');
expect(product.name.length).toBeGreaterThan(0);
expect(product.name).toBe('Apple');
```

### Headers

```js
const headers = res.headers();
expect(headers['content-type']).toContain('application/json');
```

### Raw text / regex errors

```js
const text = await res.text();
expect(text).toContain('"Apple"');

expect(body.error).toMatch(/name and price/i);
```

### Chain (multi-step)

```js
login → me → create → get → delete → 404
```

Every step has its own status + body asserts.

### `page.request` (bonus)

```js
// same API client, but shares browser cookies
const res = await page.request.get('/api/products');
expect(res.status()).toBe(200);
```

---

## 10. Real failures we fixed

### Fail A — expected 200 on missing product

```text
Error: expect(received).toBe(expected)
Expected: 200
Received: 404
```

| | |
|--|--|
| Expected | `200` (we were wrong) |
| Received | `404` (correct — id 9999 does not exist) |
| Fix | expect `404` for missing resources |

### Fail B — parallel workers raced shared DB

```text
Expected: 7
Received: 6
(after.count).toBe(beforeCount + 1)
```

**Cause:** 6 workers created/deleted products **at the same time** on one in-memory array.

**Fix:**

```js
workers: 1,   // in playwright.config.js
fullyParallel: false,
```

**Rule:** shared mutable server state → **one worker** (or isolate data per test).

---

## 11. Cheat sheet

| I want to... | Code |
|--------------|------|
| GET | `await request.get('/api/products')` |
| GET with query | `request.get('/api/products?name=ban')` |
| POST | `request.post(url, { headers, data })` |
| PUT | `request.put(url, { headers, data })` |
| PATCH | `request.patch(url, { headers, data })` |
| DELETE | `request.delete(url, { headers })` |
| status | `expect(res.status()).toBe(201)` |
| JSON | `const body = await res.json()` |
| headers | `res.headers()['content-type']` |
| login once | `const token = await getToken(request)` |
| auth call | `{ headers: authHeaders(token) }` |
| start API | `webServer` in config |

### HTTP status map (this API)

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET, PATCH, DELETE success |
| 201 | Created | POST success |
| 400 | Bad request | missing `price` |
| 401 | Unauthorized | no/bad token |
| 404 | Not found | unknown id / path |

---

## 12. Real full output

### Environment + install

```text
$ node --version
v24.19.0

$ npx playwright --version
Version 1.63.0

$ npm install
added 3 packages, and audited 4 packages in 3s

found 0 vulnerabilities
```

### Project files

```text
./server.js
./package.json
./playwright.config.js
./tests/helpers.js
./tests/01-get-requests.spec.js
./tests/02-post-requests.spec.js
./tests/03-put-patch.spec.js
./tests/04-delete.spec.js
./tests/05-auth-tokens.spec.js
./tests/06-api-assertions.spec.js
```

### One file — `npx playwright test tests/01-get-requests.spec.js`

```text
Running 6 tests using 1 worker

  ✓  1 [chromium] › tests/01-get-requests.spec.js:19:1 › GET list products — 200 + JSON array (44ms)
  ✓  2 [chromium] › tests/01-get-requests.spec.js:35:1 › GET one product by id (26ms)
  ✓  3 [chromium] › tests/01-get-requests.spec.js:45:1 › GET product not found — 404 (19ms)
  ✓  4 [chromium] › tests/01-get-requests.spec.js:53:1 › GET with query string ?name=ban (13ms)
  ✓  5 [chromium] › tests/01-get-requests.spec.js:63:1 › GET headers — content-type is JSON (24ms)
  ✓  6 [chromium] › tests/01-get-requests.spec.js:70:1 › GET unknown path — 404 JSON (13ms)

  6 passed (777ms)
```

### Auth file — `npx playwright test tests/05-auth-tokens.spec.js`

```text
Running 8 tests using 1 worker

  ✓  1 [chromium] › tests/05-auth-tokens.spec.js:17:1 › login returns a token (74ms)
  ✓  2 [chromium] › tests/05-auth-tokens.spec.js:31:1 › login wrong password — 401 (57ms)
  ✓  3 [chromium] › tests/05-auth-tokens.spec.js:41:1 › login unknown email — 401 (21ms)
  ✓  4 [chromium] › tests/05-auth-tokens.spec.js:48:1 › GET /api/me with valid token — 200 (34ms)
  ✓  5 [chromium] › tests/05-auth-tokens.spec.js:61:1 › GET /api/me without token — 401 (57ms)
  ✓  6 [chromium] › tests/05-auth-tokens.spec.js:68:1 › GET /api/me with garbage token — 401 (17ms)
  ✓  7 [chromium] › tests/05-auth-tokens.spec.js:75:1 › protected POST without token — 401 (10ms)
  ✓  8 [chromium] › tests/05-auth-tokens.spec.js:82:1 › use token across several calls (helper pattern) (15ms)

  8 passed (1.5s)
```

### Full suite — `npx playwright test`

```text
Running 38 tests using 1 worker

  ✓   1 [chromium] › tests/01-get-requests.spec.js:19:1 › GET list products — 200 + JSON array (40ms)
  ✓   2 [chromium] › tests/01-get-requests.spec.js:35:1 › GET one product by id (24ms)
  ✓   3 [chromium] › tests/01-get-requests.spec.js:45:1 › GET product not found — 404 (12ms)
  ✓   4 [chromium] › tests/01-get-requests.spec.js:53:1 › GET with query string ?name=ban (13ms)
  ✓   5 [chromium] › tests/01-get-requests.spec.js:63:1 › GET headers — content-type is JSON (26ms)
  ✓   6 [chromium] › tests/01-get-requests.spec.js:70:1 › GET unknown path — 404 JSON (10ms)
  ✓   7 [chromium] › tests/02-post-requests.spec.js:15:1 › POST create product — 201 + returned object (46ms)
  ✓   8 [chromium] › tests/02-post-requests.spec.js:40:1 › POST without auth — 401 (9ms)
  ✓   9 [chromium] › tests/02-post-requests.spec.js:51:1 › POST invalid body (missing price) — 400 (13ms)
  ✓  10 [chromium] › tests/02-post-requests.spec.js:64:1 › POST then list contains new item (16ms)
  ✓  11 [chromium] › tests/03-put-patch.spec.js:15:1 › PUT replace full product — 200 (15ms)
  ✓  12 [chromium] › tests/03-put-patch.spec.js:40:1 › PUT without full fields — 400 (12ms)
  ✓  13 [chromium] › tests/03-put-patch.spec.js:51:1 › PUT missing product — 404 (12ms)
  ✓  14 [chromium] › tests/03-put-patch.spec.js:62:1 › PATCH only one field — other fields stay (15ms)
  ✓  15 [chromium] › tests/03-put-patch.spec.js:85:1 › PATCH price only (13ms)
  ✓  16 [chromium] › tests/03-put-patch.spec.js:99:1 › PUT vs PATCH — mental check (15ms)
  ✓  17 [chromium] › tests/04-delete.spec.js:27:1 › DELETE product — 200 + gone on GET (16ms)
  ✓  18 [chromium] › tests/04-delete.spec.js:44:1 › DELETE missing product — 404 (22ms)
  ✓  19 [chromium] › tests/04-delete.spec.js:53:1 › DELETE without auth — 401 (5ms)
  ✓  20 [chromium] › tests/04-delete.spec.js:58:1 › DELETE twice — second is 404 (20ms)
  ✓  21 [chromium] › tests/04-delete.spec.js:72:1 › full CRUD lifecycle: create → read → update → delete (11ms)
  ✓  22 [chromium] › tests/05-auth-tokens.spec.js:17:1 › login returns a token (9ms)
  ✓  23 [chromium] › tests/05-auth-tokens.spec.js:31:1 › login wrong password — 401 (17ms)
  ✓  24 [chromium] › tests/05-auth-tokens.spec.js:41:1 › login unknown email — 401 (8ms)
  ✓  25 [chromium] › tests/05-auth-tokens.spec.js:48:1 › GET /api/me with valid token — 200 (7ms)
  ✓  26 [chromium] › tests/05-auth-tokens.spec.js:61:1 › GET /api/me without token — 401 (13ms)
  ✓  27 [chromium] › tests/05-auth-tokens.spec.js:68:1 › GET /api/me with garbage token — 401 (9ms)
  ✓  28 [chromium] › tests/05-auth-tokens.spec.js:75:1 › protected POST without token — 401 (7ms)
  ✓  29 [chromium] › tests/05-auth-tokens.spec.js:82:1 › use token across several calls (helper pattern) (10ms)
  ✓  30 [chromium] › tests/06-api-assertions.spec.js:21:1 › assert status codes exactly (8ms)
  ✓  31 [chromium] › tests/06-api-assertions.spec.js:28:1 › assert body shape (keys exist) (6ms)
  ✓  32 [chromium] › tests/06-api-assertions.spec.js:42:1 › assert value types (5ms)
  ✓  33 [chromium] › tests/06-api-assertions.spec.js:51:1 › assert response headers (5ms)
  ✓  34 [chromium] › tests/06-api-assertions.spec.js:59:1 › assert JSON string equality (text) (8ms)
  ✓  35 [chromium] › tests/06-api-assertions.spec.js:69:1 › assert list filtering + count math (13ms)
  ✓  36 [chromium] › tests/06-api-assertions.spec.js:77:1 › assert chain: login → me → create → get → delete (22ms)
  ✓  37 [chromium] › tests/06-api-assertions.spec.js:114:1 › negative: assert error messages in body (11ms)
  ✓  38 [chromium] › tests/06-api-assertions.spec.js:125:1 › page.request — same API from browser context (64ms)

  38 passed (1.8s)
```

---

## Quick self-check

1. Fixture for API calls? → **`request`**
2. Create success status? → **201**
3. PUT vs PATCH? → PUT **replaces all** · PATCH **merges part**
4. DELETE then GET? → **404**
5. Send token how? → `Authorization: Bearer <token>`
6. Login endpoint returns? → **`{ token }`**
7. No token on protected route? → **401**
8. Shared in-memory DB + parallel? → **use `workers: 1`**

All 8 → Topic 9 done ✅

---

## Next topic

**Topic 10 — CI/CD with GitHub Actions** — run these tests on every push — coming soon.

---

*Topic 9 · API Testing · ES6 · Real output: 38 passed (1.8s) · Playwright 1.63.0*

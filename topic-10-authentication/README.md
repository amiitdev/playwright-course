# Topic 10 — Authentication

> **Goal:** log users in tests — **UI login**, **session cookies**, **cookie API**, and **storage state** so you login once and reuse everywhere.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Server:** local app with `HttpOnly` session cookie  
**Real results from my machine:**

| Command | Result |
|---------|--------|
| `npx playwright test` | `23 passed (3.6s)` ✅ |
| `tests/01-login-flows.spec.js` | `5 passed (1.5s)` ✅ |
| `tests/04-storage-state.spec.js` | `4 passed (1.5s)` ✅ |

**Demo account:** `amit@gmail.com` / `123456`

---

## Table of Contents

1. [What is authentication in tests?](#1-what-is-authentication-in-tests)
2. [Our app](#2-our-app)
3. [Login flows](#3-login-flows)
4. [Session management](#4-session-management)
5. [Cookies](#5-cookies)
6. [Storage state](#6-storage-state)
7. [Which approach should I use?](#7-which-approach-should-i-use)
8. [Real failures we hit](#8-real-failures-we-hit)
9. [Cheat sheet](#9-cheat-sheet)
10. [Real full output](#10-real-full-output)

---

## 1. What is authentication in tests?

Many apps only show data **after login**. Your tests must become that user.

```text
  Without auth:  page loads → 401 / redirected to login → test fails
  With auth:     login (or reuse session) → protected pages work
```

Four skills in this topic:

```text
  1. Login flows     → how to log in (UI or API)
  2. Session         → stay logged in, logout, protected routes
  3. Cookies         → read / inject / clear session cookies
  4. Storage state   → SAVE login → LOAD in new browser (fast)
```

---

## 2. Our app

| Page / API | Needs session? | What it shows |
|------------|----------------|---------------|
| `/login.html` | no | form |
| `/dashboard.html` | yes (`/api/me`) | status + email |
| `/profile.html` | yes | email or “Please log in” |
| `POST /api/login` | no | sets **HttpOnly** cookie |
| `GET /api/me` | yes | `{ email, loggedIn }` |
| `GET /api/secret` | yes | secret JSON |
| `POST /api/logout` | yes | clears cookie (`Max-Age=0`) |

**Session model:**

```text
  POST /api/login
       │
       ▼
  Set-Cookie: session=sess_…; HttpOnly; Path=/
       │
       ▼  browser stores cookie
  GET /api/me   Cookie: session=sess_…  →  200 { email }
       │
  logout → Max-Age=0 → cookie gone → 401
```

`HttpOnly` = **JavaScript cannot read** the cookie (`document.cookie` skips it).  
Playwright `context.cookies()` **can** see it.

---

## 3. Login flows

### 3.1 Flow A — UI (like a human)

```js
test('@smoke UI login success → dashboard', async ({ page }) => {
  await page.goto('/login.html');

  await page.locator('#email').fill('amit@gmail.com');
  await page.locator('#password').fill('123456');
  await page.locator('#login-btn').click();

  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText('amit@gmail.com');
});
```

**Human check:** *"Type email + password, click Sign in. Am I on dashboard?"*

### 3.2 Wrong password

```js
await page.locator('#password').fill('wrong-pass');
await page.locator('#login-btn').click();

await expect(page).toHaveURL(/login\.html/);
await expect(page.getByTestId('login-error')).toBeVisible();
```

### 3.3 Flow B — API login (fast setup)

```js
test('API login via request fixture', async ({ request }) => {
  const res = await request.post('/api/login', {
    data: { email: 'amit@gmail.com', password: '123456' },
  });

  expect(res.status()).toBe(200);
  // Set-Cookie was stored on this request context
  const me = await request.get('/api/me');
  expect(me.status()).toBe(200);
});
```

### 3.4 API login + browser page (same context)

```js
test('API login then browser uses same session', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // login on THIS context's request client
  const loginRes = await context.request.post('/api/login', {
    data: { email: 'amit@gmail.com', password: '123456' },
  });
  expect(loginRes.status()).toBe(200);

  // page shares cookies with context → already logged in
  await page.goto('/dashboard.html');
  await expect(page.getByTestId('status')).toHaveText('logged in');

  await context.close();
});
```

```text
  context  = cookies live here
     ├── context.request   (API)
     └── page              (browser)
           both send the same session cookie
```

---

## 4. Session management

**Session** = server remembers you between requests.

### 4.1 Logged in checks

```js
await expect(page.getByTestId('status')).toHaveText('logged in');
await expect(page.getByTestId('user')).toHaveText('amit@gmail.com');
```

### 4.2 Session works on another page

```js
// after UI login…
await page.goto('/profile.html');
await expect(page.getByTestId('profile-email')).toHaveText('amit@gmail.com');
await expect(page.getByTestId('need-login')).toBeHidden();
```

### 4.3 No session → protected blocked

```js
test('no session → profile asks to log in', async ({ page }) => {
  await page.goto('/profile.html');
  await expect(page.getByTestId('need-login')).toBeVisible();
  await expect(page.getByTestId('profile-email')).toHaveText('—');
});

test('protected API without session → 401', async ({ request }) => {
  expect((await request.get('/api/me')).status()).toBe(401);
  expect((await request.get('/api/secret')).status()).toBe(401);
});
```

### 4.4 With session → secret OK

```js
await request.post('/api/login', {
  data: { email: 'amit@gmail.com', password: '123456' },
});

const secret = await request.get('/api/secret');
expect(secret.status()).toBe(200);
expect((await secret.json()).secret).toContain('banana');
```

### 4.5 Logout (UI)

```js
await page.locator('#logout-btn').click();
await expect(page).toHaveURL(/login\.html/);

await page.goto('/dashboard.html');
await expect(page.getByTestId('status')).toHaveText('not logged in');
```

### 4.6 Logout (API)

```js
await request.post('/api/login', { data: { … } });
expect((await request.get('/api/me')).status()).toBe(200);

await request.post('/api/logout');
expect((await request.get('/api/me')).status()).toBe(401); // cookie cleared
```

### 4.7 Survives reload

```js
await page.reload();
await expect(page.getByTestId('status')).toHaveText('logged in');
```

```text
  login → cookie on context → every page/request sends it
  logout → cookie removed → 401 / “not logged in”
```

---

## 5. Cookies

Playwright **context** cookie API:

| Call | Meaning |
|------|---------|
| `context.cookies()` | all cookies |
| `context.cookies(url)` | cookies for that URL |
| `context.clearCookies()` | delete all |
| `context.addCookies([...])` | inject cookies |

### 5.1 Session cookie exists after UI login

```js
const cookies = await context.cookies();
const session = cookies.find((c) => c.name === 'session');

expect(session).toBeTruthy();
expect(session.value).toMatch(/^sess_/);
expect(session.httpOnly).toBe(true);
```

### 5.2 HttpOnly — JS cannot see it

```js
// browser JS skips HttpOnly
const fromJs = await page.evaluate(() => document.cookie);
expect(fromJs).not.toContain('session=');

// Playwright can
const cookies = await context.cookies();
expect(cookies.some((c) => c.name === 'session')).toBe(true);
```

### 5.3 clearCookies → logged out

```js
await context.clearCookies();
await page.goto('/dashboard.html');
await expect(page.getByTestId('status')).toHaveText('not logged in');
```

### 5.4 addCookies — inject session without typing the form

```js
// 1) real login via API to get a valid token cookie
await context.request.post('/api/login', {
  data: { email: 'amit@gmail.com', password: '123456' },
});
const session = (await context.cookies()).find((c) => c.name === 'session');

// 2) optional: wipe browser cookies, put session back
await context.clearCookies();
await context.addCookies([
  {
    name: 'session',
    value: session.value,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  },
]);

// 3) logged in again
await page.goto('/dashboard.html');
await expect(page.getByTestId('status')).toHaveText('logged in');
```

### 5.5 Logout response expires cookie

Server sends `Set-Cookie: session=; Max-Age=0` → browser drops it.

```js
await page.locator('#logout-btn').click();
const cookies = await context.cookies();
const session = cookies.find((c) => c.name === 'session');
expect(!session || session.value === '').toBe(true);
```

---

## 6. Storage state

**storageState** = cookies **+** localStorage of a context.

```text
  SAVE  await context.storageState({ path: 'auth.json' })
  LOAD  browser.newContext({ storageState: 'auth.json' })
```

**Why:** login **once**, many tests start already logged in.

### 6.1 Save after login

```js
test('save storage state after login', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/login.html');
  await page.locator('#email').fill('amit@gmail.com');
  await page.locator('#password').fill('123456');
  await page.locator('#login-btn').click();
  await expect(page).toHaveURL(/dashboard\.html/);

  await context.storageState({ path: 'auth.json' });
  await context.close();
});
```

### 6.2 Load in a brand-new context

```js
test('new context loads storage state', async ({ browser }) => {
  const context = await browser.newContext({ storageState: 'auth.json' });
  const page = await context.newPage();

  await page.goto('/dashboard.html');
  await expect(page.getByTestId('status')).toHaveText('logged in');
  await expect(page.getByTestId('user')).toHaveText('amit@gmail.com');

  await page.goto('/profile.html');
  await expect(page.getByTestId('profile-email')).toHaveText('amit@gmail.com');

  await context.close();
});
```

### 6.3 Object form (no file)

```js
const state = await tmpContext.storageState();          // object
const context = await browser.newContext({ storageState: state });
```

### 6.4 Fresh context — logged out

```js
const context = await browser.newContext(); // no storageState
await page.goto('/dashboard.html');
await expect(page.getByTestId('status')).toHaveText('not logged in');
```

**File layout note:** `auth.json` is gitignored (see `.gitignore`).

---

## 7. Which approach should I use?

```text
  Testing login itself?          → UI login in that test
  Many tests need same user?     → storage state (login once)
  Only API tests?                → request.post('/api/login')
  Need a cookie only?            → context.addCookies / context.request
  Must verify logout?            → clearCookies / logout button + 401
```

| Approach | Speed | Best for |
|----------|-------|----------|
| UI login every test | slow | login form tests only |
| API login in test | fast | API + quick setup |
| **storageState** | **fastest** | large UI suites |
| config `use.storageState` | fastest | all tests logged in |

---

## 8. Real failures we hit

### Fail A — protected page without login

```text
Expected: "amit@gmail.com"
Received: "—"
Locator: getByTestId('profile-email')
```

**Cause:** opened `/profile.html` with **no session**.  
**Fix:** login first, **or** `storageState`, **or** assert “Please log in”.

### Fail B — port already in use / connection refused

```text
Error: listen EADDRINUSE: address already in use :::3456
page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3456/…
```

**Cause:** another process (old server / parallel run) held port **3456**.  
**Fix:**

```bash
fuser -k 3456/tcp   # free the port
npx playwright test # then run once (don’t run two suites at once)
```

**Rule:** one `webServer` per port — don’t start two projects on the same port together.

---

## 9. Cheat sheet

| I want to... | Code |
|--------------|------|
| UI login | fill + click → wait URL |
| API login | `request.post('/api/login', { data })` |
| API + browser | `context.request.post(...)` then `page.goto` |
| list cookies | `await context.cookies()` |
| clear cookies | `await context.clearCookies()` |
| inject cookie | `await context.addCookies([{ name, value, domain, path }])` |
| save login | `await context.storageState({ path: 'auth.json' })` |
| reuse login | `browser.newContext({ storageState: 'auth.json' })` |
| object state | `const s = await context.storageState()` |
| protected API | expect 401 without cookie, 200 with |
| logout | UI button or `POST /api/logout` |

### Mental map

```text
  Login flows  → HOW you become the user
  Session      → STAY the user across pages
  Cookies      → the ticket in the browser (session=…)
  Storage state→ SAVE that ticket → LOAD next browser
```

---

## 10. Real full output

### Environment + install

```text
$ node --version
v24.19.0

$ npx playwright --version
Version 1.63.0

$ npm install
added 3 packages, and audited 4 packages in 1s

found 0 vulnerabilities
```

### Project files

```text
./server.js
./package.json
./playwright.config.js
./site/login.html
./site/dashboard.html
./site/profile.html
./tests/01-login-flows.spec.js
./tests/02-session-management.spec.js
./tests/03-cookies.spec.js
./tests/04-storage-state.spec.js
```

### One file — `tests/01-login-flows.spec.js`

```text
Running 5 tests using 5 workers

  ✓  5 [chromium] › tests/01-login-flows.spec.js:45:1 › API login via request fixture — get session cookie (77ms)
  ✓  2 [chromium] › tests/01-login-flows.spec.js:79:1 › login page shows demo credentials (static) (322ms)
  ✓  4 [chromium] › tests/01-login-flows.spec.js:61:1 › API login then browser uses same session (context API) (304ms)
  ✓  3 [chromium] › tests/01-login-flows.spec.js:34:1 › UI login wrong password → error stays on login (426ms)
  ✓  1 [chromium] › tests/01-login-flows.spec.js:21:1 › @smoke UI login success → dashboard (511ms)

  5 passed (1.5s)
```

### Storage state — `tests/04-storage-state.spec.js`

```text
Running 4 tests using 1 worker

  ✓  1 [chromium] › tests/04-storage-state.spec.js:28:1 › save storage state after login (245ms)
  ✓  2 [chromium] › tests/04-storage-state.spec.js:53:1 › new context loads storage state — already logged in (149ms)
  ✓  3 [chromium] › tests/04-storage-state.spec.js:75:1 › storage state without file — object form (276ms)
  ✓  4 [chromium] › tests/04-storage-state.spec.js:99:1 › fresh context WITHOUT storage — logged out (78ms)

  4 passed (1.5s)
```

### Full suite — `npx playwright test`

```text
Running 23 tests using 6 workers

  ✓   5 [chromium] › tests/01-login-flows.spec.js:45:1 › API login via request fixture — get session cookie (79ms)
  ✓   4 [chromium] › tests/01-login-flows.spec.js:79:1 › login page shows demo credentials (static) (465ms)
  ✓   3 [chromium] › tests/01-login-flows.spec.js:61:1 › API login then browser uses same session (context API) (510ms)
  ✓   9 [chromium] › tests/02-session-management.spec.js:51:1 › protected API without session → 401 (18ms)
  ✓   2 [chromium] › tests/01-login-flows.spec.js:34:1 › UI login wrong password → error stays on login (651ms)
  ✓  10 [chromium] › tests/02-session-management.spec.js:59:1 › protected API with session → 200 + secret (46ms)
  ✓  12 [chromium] › tests/02-session-management.spec.js:85:1 › logout via API clears cookie on request context (74ms)
  ✓   1 [chromium] › tests/02-session-management.spec.js:27:1 › @smoke session works on dashboard (803ms)
  ✓   8 [chromium] › tests/02-session-management.spec.js:45:1 › no session → profile asks to log in (217ms)
  ✓   6 [chromium] › tests/01-login-flows.spec.js:21:1 › @smoke UI login success → dashboard (660ms)
  ✓   7 [chromium] › tests/02-session-management.spec.js:37:1 › session also works on another page (profile) (768ms)
  ✓  14 [chromium] › tests/03-cookies.spec.js:20:1 › after UI login, session cookie exists (448ms)
  ✓  15 [chromium] › tests/03-cookies.spec.js:36:1 › cookie is HttpOnly — page JS cannot read it (464ms)
  ✓  13 [chromium] › tests/02-session-management.spec.js:98:1 › session survives page reload (590ms)
  ✓  16 [chromium] › tests/03-cookies.spec.js:56:1 › clearCookies → logged out (618ms)
  ✓  11 [chromium] › tests/02-session-management.spec.js:72:1 › logout clears session — UI flow (797ms)
  ✓  17 [chromium] › tests/03-cookies.spec.js:69:1 › addCookies — inject session without UI login (368ms)
  ✓  18 [chromium] › tests/03-cookies.spec.js:99:1 › cookies for a specific URL only (419ms)
  ✓  20 [chromium] › tests/04-storage-state.spec.js:28:1 › save storage state after login (309ms)
  ✓  19 [chromium] › tests/03-cookies.spec.js:110:1 › expired-style: Max-Age=0 logout response clears browser cookie (513ms)
  ✓  21 [chromium] › tests/04-storage-state.spec.js:53:1 › new context loads storage state — already logged in (188ms)
  ✓  22 [chromium] › tests/04-storage-state.spec.js:75:1 › storage state without file — object form (312ms)
  ✓  23 [chromium] › tests/04-storage-state.spec.js:99:1 › fresh context WITHOUT storage — logged out (73ms)

  23 passed (3.6s)
```

---

## Quick self-check

1. Two login styles? → **UI** and **API** (`context.request`)
2. `context.request` and `page` share? → **yes, same context cookies**
3. HttpOnly cookie in `document.cookie`? → **no**
4. See HttpOnly cookie in Playwright? → **`context.cookies()`**
5. Wipe all cookies? → **`context.clearCookies()`**
6. Save login for later tests? → **`storageState({ path: 'auth.json' })`**
7. Start logged in? → **`newContext({ storageState: 'auth.json' })`**
8. Protected without cookie? → **401 / “Please log in”**

All 8 → Topic 10 done ✅

---

## Next topic

**Topic 11 — CI/CD with GitHub Actions** — run Playwright on every push — coming soon.

---

*Topic 10 · Authentication · ES6 · Real output: 23 passed (3.6s) · Playwright 1.63.0*

# Topic 4 — Waiting & Synchronization

> **Goal:** understand when Playwright waits for you, how to wait on purpose, how to wait for **network/API** calls, and how to stop tests from being **flaky**.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Website:** local Shopping App + tiny Node server (for real API waits)  
**Real result from my machine:** `25 passed (9.9s)` ✅

---

## Table of Contents

1. [Why waiting matters](#1-why-waiting-matters)
2. [Our setup for this topic](#2-our-setup-for-this-topic)
3. [Auto-waiting (the default — learn this first)](#3-auto-waiting-the-default--learn-this-first)
4. [Explicit waits](#4-explicit-waits)
5. [Waiting for elements (expect matchers)](#5-waiting-for-elements-expect-matchers)
6. [Waiting for network responses](#6-waiting-for-network-responses)
7. [Avoiding flaky tests](#7-avoiding-flaky-tests)
8. [Waiting cheat sheet](#8-waiting-cheat-sheet)
9. [Real failure we captured](#9-real-failure-we-captured)
10. [Command cheat sheet](#10-command-cheat-sheet)
11. [Real full output](#11-real-full-output)

---

## 1. Why waiting matters

Web pages are **not instant**:

```text
  click "Load"
      |
      +--> spinner shows
      +--> API takes 1 second
      +--> list appears after 1.5s
```

If you assert **too early** → test fails (flaky).  
If you **sleep 3 seconds always** → slow + still can flake.

```text
  WRONG:  click();  sleep(3000);  assert();
  RIGHT:  click();  expect(list).toBeVisible();   ← retries until ready
```

**Flaky test** = same code, sometimes ✅ sometimes ❌ — usually a **waiting** problem.

---

## 2. Our setup for this topic

This topic uses a **real HTTP server** (not `file://`) so we can practice **network waiting**.

```text
topic-04-waiting/
├── server.js              ← tiny Node server (static + slow APIs)
├── playwright.config.js   ← baseURL + webServer (auto start/stop)
├── site/
│   ├── index.html         ← delayed UI: load list, spinner, toast
│   └── network.html       ← buttons that call /api/* 
└── tests/
    ├── 01-auto-wait.spec.js
    ├── 02-explicit-wait.spec.js
    ├── 03-wait-for-elements.spec.js
    ├── 04-wait-network.spec.js
    └── 05-avoid-flaky.spec.js
```

### What the pages do

| Page | Behavior | Used for |
|------|----------|----------|
| `/` **Load products** | list appears after **1.5s** | auto-wait |
| `/` **Start task** | spinner 2s → “Task finished!” | explicit wait |
| `/` **Show toast** | toast shows 1s then hides | wait until hidden |
| `/network` **Get products** | `GET /api/products` after **1s** | waitForResponse |
| `/network` **Get user** | `GET /api/user` after **1.5s** | waitForResponse + JSON |

### `playwright.config.js` — starts the server for you

```js
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3456/',
  },

  // Playwright runs server.js BEFORE tests, stops AFTER
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3456/',
    reuseExistingServer: true,
    timeout: 15000,
  },
});
```

**Human check:** *"When I run `npx playwright test`, the server starts by itself."*

---

## 3. Auto-waiting (the default — learn this first)

**You almost never need manual sleeps.**

Before actions and assertions, Playwright waits until the element is:

```text
  1. attached  → exists in the DOM
  2. visible   → on screen (not display:none, has size)
  3. enabled   → not disabled (for click)
```

### 3.1 Content appears after 1.5s — still no sleep

```js
await page.goto('/');

await expect(page.locator('#products')).toBeHidden();  // starts hidden

await page.getByRole('button', { name: 'Load products' }).click();

// AUTO-RETRIES up to 5s until list is visible (~1.5s in reality)
await expect(page.locator('#products')).toBeVisible();
await expect(page.locator('#products')).toContainText('Apple — $1');
```

**Human check:** *"Click Load. Wait until products are on screen — don’t count seconds."*

### 3.2 What auto-wait means for each action

| Action | Playwright waits until… |
|--------|-------------------------|
| `.click()` | element visible + enabled + stable |
| `.fill()` | element visible + editable |
| `.check()` | checkbox visible and clickable |
| `expect(...).toBeVisible()` | visible **or** timeout |

```text
  click()  =  "wait until I CAN click, then click"
  expect() =  "keep checking until TRUE or timeout"
```

---

## 4. Explicit waits

**`locator.waitFor()`** = pause until a specific **state**.

```js
await locator.waitFor();                       // default: attached
await locator.waitFor({ state: 'visible' });   // on screen
await locator.waitFor({ state: 'hidden' });    // hidden OR removed
await locator.waitFor({ state: 'detached' });  // removed from DOM
await locator.waitFor({ timeout: 10000 });     // custom ms
```

### 4.1 Spinner flow (visible → hidden)

```js
await page.goto('/');
await page.locator('#start-btn').click();

// step 1: working…
await page.locator('#spinner').waitFor({ state: 'visible' });
await expect(page.locator('#spinner')).toHaveText('Please wait… working');

// step 2: finished (spinner gone)
await page.locator('#spinner').waitFor({ state: 'hidden' });
await expect(page.locator('#done-msg')).toHaveText('Task finished!');
```

**Human check:** *"Wait until spinner shows. Then wait until it goes away."*

### 4.2 Toast that disappears

```js
await page.locator('#notify-btn').click();

await page.locator('#toast').waitFor({ state: 'visible' });
await expect(page.locator('#toast')).toHaveText('Saved successfully!');

await page.locator('#toast').waitFor({ state: 'hidden' });  // after 1s
await expect(page.locator('#toast')).toBeHidden();
```

### 4.3 Custom timeout

```js
await page.locator('#products').waitFor({
  state: 'visible',
  timeout: 10000,   // allow 10 seconds (default is 5s)
});
```

### When `waitFor` vs `expect`?

| Use | Example |
|-----|---------|
| **`expect(...).toBeVisible()`** | 95% of the time — clear error + retries |
| **`waitFor({ state })`** | need `hidden` / `detached` as an explicit step, or wait before next action |

```text
  expect  → "check this is true (retry)"
  waitFor → "wait until this state"
```

---

## 5. Waiting for elements (expect matchers)

Web-first assertions **are** waits. Default timeout: **5000 ms**.

```js
await expect(el).toBeVisible();                 // retry until visible
await expect(el).toBeHidden();                  // retry until hidden
await expect(el).toBeVisible({ timeout: 10000 }); // per-assertion timeout
await expect(el).toHaveText('...');             // retry until text matches
await expect(el).toHaveText('...', { timeout: 5000 });
```

### Element states

```text
  attached   → node exists in DOM
  visible    → attached + shown on screen
  hidden     → display:none  OR  not in DOM  (both count as hidden)
```

### Examples from `03-wait-for-elements.spec.js`

**Delayed list:**

```js
await page.locator('#load-btn').click();
await expect(page.locator('#products')).toBeVisible({ timeout: 5000 });
```

**Loading text hides when done:**

```js
await page.locator('#load-btn').click();
await expect(page.locator('#loading')).toBeVisible();   // first appears
await expect(page.locator('#loading')).toBeHidden();    // then gone
await expect(page.locator('#products')).toBeVisible();
```

**Text changes:**

```js
await page.locator('#load-btn').click();
await expect(page.locator('#products')).toHaveText(
  'Apple — $1\nBanana — $2',
  { timeout: 5000 }
);
```

**Stays hidden (we never clicked):**

```js
await expect(page.locator('#toast')).not.toBeVisible();
```

**Human check:** *"Keep checking until the page shows the truth I need."*

---

## 6. Waiting for network responses

When the user clicks **Get products**, the browser calls:

```text
GET /api/products     → server sleeps 1s → JSON
GET /api/user         → server sleeps 1.5s → JSON
```

### 6.1 Golden order (memorize this)

```text
  1. const p = page.waitForResponse(...)   // arm the trap
  2. await page.click(...)                 // trigger the call
  3. const res = await p                   // wait for it
  4. await expect(UI)...                   // assert the UI
```

**If you click first and wait second, the response may already be gone.**

### 6.2 Full example

```js
await page.goto('/network.html');

// 1) arm
const responsePromise = page.waitForResponse((res) =>
  res.url().includes('/api/products') && res.status() === 200
);

// 2) trigger
await page.getByRole('button', { name: 'Get products' }).click();

// 3) wait (~1s)
const response = await responsePromise;
expect(response.status()).toBe(200);

// 4) UI should be ready (auto-wait)
await expect(page.locator('#result')).toHaveText('Products loaded!');
await expect(page.locator('#products-json')).toContainText('Apple');
```

### 6.3 Simple string URL

```js
const responsePromise = page.waitForResponse('/api/products');
await page.locator('#fetch-products').click();
const response = await responsePromise;
```

### 6.4 Read the JSON body

```js
const body = await response.json();
expect(body.products).toHaveLength(2);
expect(body.products[0].name).toBe('Apple');
```

### 6.5 `waitForRequest` — was the call even sent?

```js
const requestPromise = page.waitForRequest((req) =>
  req.url().includes('/api/products')
);
await page.locator('#fetch-products').click();
const request = await requestPromise;
expect(request.method()).toBe('GET');
```

### 6.6 Mock with `page.route` (fast tests)

Skip the real 1s delay when you do not need it:

```js
await page.route('**/api/products', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      products: [{ id: 99, name: 'Mocked Fruit', price: 9 }],
    }),
  })
);

const p = page.waitForResponse('**/api/products');
await page.locator('#fetch-products').click();
await p;

await expect(page.locator('#products-json')).toContainText('Mocked Fruit');
```

**Human check:** *"Answer the API myself → test runs instantly and stays stable."*

| Helper | Waits for |
|--------|-----------|
| `page.waitForResponse(url)` | response came back |
| `page.waitForRequest(url)` | request was sent |
| `page.route(url, handler)` | intercept / mock / delay yourself |

---

## 7. Avoiding flaky tests

**Flaky** = passes sometimes, fails sometimes — without a real product bug.

### 7.1 Main causes

| Cause | Looks like |
|-------|------------|
| Fixed sleeps | `waitForTimeout(2000)` — too short **or** wasted time |
| Assert too early | check list before API finished |
| Wrong order | click, then wait for response that already finished |
| Shared state | test A leaves page dirty for test B |
| Guessing numbers | “sleep 1500 because today it takes 1.5s” |

### 7.2 The anti-pattern (do NOT use as main strategy)

```js
// ❌ BAD
await page.locator('#load-btn').click();
await page.waitForTimeout(1500);          // clock-wait
await expect(page.locator('#products')).toBeVisible();
```

Why bad:

```text
  slow machine  → 1500ms not enough → FAIL (flaky)
  fast machine  → you always waste 1500ms
  app changes to 2s → your number is wrong forever
```

`waitForTimeout` is only for rare cases (e.g. CSS animation with **no** observable condition). Prefer a real condition.

### 7.3 Real failure we captured (assert too early)

```text
Error: expect(locator).toBeVisible() failed

Locator:  locator('#products')
Expected: visible
Received: hidden
Timeout:  100ms

  4 × locator resolved to <ul id="products" class="hidden">…</ul>
     - unexpected value "hidden"
```

**Reading it:**

| Clue | Meaning |
|------|---------|
| `Expected: visible` | we wanted it shown |
| `Received: hidden` | still `class="hidden"` |
| `Timeout: 100ms` | we did not wait long enough |
| Fix | default timeout (5s) **or** no custom tiny timeout |

With normal `toBeVisible()` (5s default) → **PASS** at ~1.5s.

### 7.4 Good patterns (all in `05-avoid-flaky.spec.js`)

| # | Rule | Example |
|---|------|---------|
| 1 | Wait for **outcome**, not seconds | `expect(list).toBeVisible()` |
| 2 | Step conditions in order | spinner visible → then done visible |
| 3 | Arm network wait **before** click | `waitForResponse` then `click` |
| 4 | Mock when latency is irrelevant | `page.route(...)` |
| 5 | Fail fast if already visible | `toBeVisible({ timeout: 2000 })` |
| 6 | Keep tests independent | fresh `page` each test (default) |

```text
  FLAKY mindset:  "sleep 2 seconds and hope"
  STABLE  mindset: "wait until THIS thing is true"
```

---

## 8. Waiting cheat sheet

| I want to... | Code |
|--------------|------|
| Wait until shown | `await expect(el).toBeVisible()` |
| Wait until hidden | `await expect(el).toBeHidden()` |
| Wait until text matches | `await expect(el).toHaveText('...')` |
| Longer timeout | `expect(el).toBeVisible({ timeout: 10000 })` |
| Explicit visible state | `el.waitFor({ state: 'visible' })` |
| Explicit hidden state | `el.waitFor({ state: 'hidden' })` |
| Wait for API response | `page.waitForResponse('/api/...')` **before** click |
| Wait for request sent | `page.waitForRequest(...)` |
| Mock API | `page.route('**/api/...', route => route.fulfill(...))` |
| Auto-start server | `webServer: { command, url }` in config |
| ❌ Fixed sleep | `waitForTimeout(ms)` — avoid as main strategy |

**Default timeouts:**

| What | Default |
|------|---------|
| Each test | 30 000 ms (`timeout` in config) |
| Each assertion / waitFor | 5 000 ms |
| `goto` load | 30 000 ms |

---

## 9. Real failure we captured

Temporary test — click then allow only **100 ms** (products need **1500 ms**):

```text
  ✘  1 [chromium] › DEMO FAIL: assert too early (timeout 100ms, needs 1500ms) (375ms)

Error: expect(locator).toBeVisible() failed

Locator:  locator('#products')
Expected: visible
Received: hidden
Timeout:  100ms

Call log:
  - Expect "toBeVisible" locator('#products') with timeout 100ms
  - waiting for locator('#products')
    4 × locator resolved to <ul id="products" class="hidden">…</ul>
       - unexpected value "hidden"
```

**Then the same assertion with default timeout → PASS** (waits until ~1.5s).

---

## 10. Command cheat sheet

| I want to... | Command |
|--------------|---------|
| Install libraries | `npm install` |
| Install browser | `npx playwright install chromium` |
| Run all tests | `npx playwright test` |
| Run one file | `npx playwright test tests/04-wait-network.spec.js` |
| Run by name | `npx playwright test -g "flaky"` |
| Watch browser | `npm run test:headed` |
| Start server only | `npm run server` |
| Open report | `npm run test:report` |

Note: with `webServer` in config you **do not** need to start the server yourself.

---

## 11. Real full output

Captured on this machine (ES6 + local server).

### Environment + install

```text
$ node --version
v24.19.0

$ npx playwright --version
Version 1.63.0

$ npm install
added 3 packages, and audited 4 packages in 2s

found 0 vulnerabilities
```

### Project files

```text
./server.js
./package.json
./playwright.config.js
./site/index.html
./site/network.html
./tests/01-auto-wait.spec.js
./tests/02-explicit-wait.spec.js
./tests/03-wait-for-elements.spec.js
./tests/04-wait-network.spec.js
./tests/05-avoid-flaky.spec.js
```

### One file — `npx playwright test tests/01-auto-wait.spec.js`

```text
Running 3 tests using 3 workers

  ✓  2 [chromium] › tests/01-auto-wait.spec.js:44:1 › auto-wait on fill — input must exist first (1.1s)
  ✓  1 [chromium] › tests/01-auto-wait.spec.js:17:1 › click then content appears — NO manual wait needed (3.2s)
  ✓  3 [chromium] › tests/01-auto-wait.spec.js:33:1 › auto-wait before click — button appears late is OK (3.1s)

  3 passed (5.6s)
```

### All tests — `npx playwright test`

```text
Running 25 tests using 6 workers

  ✓   6 [chromium] › tests/01-auto-wait.spec.js:44:1 › auto-wait on fill — input must exist first (1.1s)
  ✓   7 [chromium] › tests/02-explicit-wait.spec.js:62:1 › waitFor attached — exists in DOM (even if hidden) (348ms)
  ✓   1 [chromium] › tests/01-auto-wait.spec.js:33:1 › auto-wait before click — button appears late is OK (2.8s)
  ✓   4 [chromium] › tests/01-auto-wait.spec.js:17:1 › click then content appears — NO manual wait needed (3.0s)
  ✓   3 [chromium] › tests/02-explicit-wait.spec.js:35:1 › waitFor hidden — toast disappears after 1s (3.1s)
  ✓  10 [chromium] › tests/03-wait-for-elements.spec.js:44:1 › toHaveText waits for text to change (215ms)
  ✓  12 [chromium] › tests/03-wait-for-elements.spec.js:68:1 › not.toBeVisible — element must stay hidden (260ms)
  ✓   2 [chromium] › tests/02-explicit-wait.spec.js:49:1 › waitFor with custom timeout (3.5s)
  ✓   8 [chromium] › tests/03-wait-for-elements.spec.js:22:1 › toBeVisible retries until delayed element shows (2.1s)
  ✓   5 [chromium] › tests/02-explicit-wait.spec.js:20:1 › waitFor visible — spinner shows then we continue (3.9s)
  ✓   9 [chromium] › tests/03-wait-for-elements.spec.js:31:1 › toBeHidden — loading text hides when done (2.0s)
  ✓  14 [chromium] › tests/04-wait-network.spec.js:19:1 › waitForResponse — click then wait for /api/products (1.3s)
  ✓  18 [chromium] › tests/04-wait-network.spec.js:84:1 › page.route mock — make API instant (fast tests) (173ms)
  ✓  15 [chromium] › tests/04-wait-network.spec.js:40:1 › waitForResponse with JSON body check (1.2s)
  ✓  11 [chromium] › tests/03-wait-for-elements.spec.js:56:1 › count waits for number of children (2.1s)
  ✓  16 [chromium] › tests/04-wait-network.spec.js:53:1 › waitForResponse — slower /api/user (1.5s) (1.7s)
  ✓  22 [chromium] › tests/05-avoid-flaky.spec.js:71:1 › good: route mock removes slow delay (still stable) (160ms)
  ✓  23 [chromium] › tests/05-avoid-flaky.spec.js:92:1 › good: fail fast with short timeout when element should already be there (132ms)
  ✓  13 [chromium] › tests/03-wait-for-elements.spec.js:75:1 › wait between steps — spinner flow with expect (2.6s)
  ✓  24 [chromium] › tests/05-avoid-flaky.spec.js:104:1 › good: test A does not depend on test B (128ms)
  ✓  17 [chromium] › tests/04-wait-network.spec.js:68:1 › waitForRequest — ensure the API call was even sent (1.5s)
  ✓  25 [chromium] › tests/05-avoid-flaky.spec.js:109:1 › good: test B also starts clean (127ms)
  ✓  21 [chromium] › tests/05-avoid-flaky.spec.js:57:1 › good: waitForResponse before click (1.2s)
  ✓  19 [chromium] › tests/05-avoid-flaky.spec.js:27:1 › good: wait for outcome not seconds (2.0s)
  ✓  20 [chromium] › tests/05-avoid-flaky.spec.js:41:1 › good: step-by-step conditions (2.5s)

  25 passed (9.9s)
```

---

## Quick self-check

1. Do you need `sleep(1500)` for delayed content? → **No** — `toBeVisible()` retries
2. Default assertion timeout? → **5 seconds**
3. Wait until spinner is gone? → `waitFor({ state: 'hidden' })` or `toBeHidden()`
4. Order for network wait? → **waitForResponse → click → await → assert UI**
5. How to make API instant in a test? → `page.route(...)` mock
6. Biggest cause of flaky tests? → **fixed sleeps / waiting the wrong way**

All 6 → Topic 4 done ✅

---

## Next topic

**Topic 5 — Page Object Model (POM)** — clean structure for locators & actions — coming soon.

---

*Topic 4 · Waiting & Synchronization · ES6 · Real output: 25 passed (9.9s) · Playwright 1.63.0*

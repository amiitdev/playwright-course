# Topic 7 — Test Organization

> **Goal:** keep suites clean with **hooks**, **fixtures**, **grouping**, and **tags** — so tests stay short and you can run only smoke or only regression.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Website:** local Shopping App (login → dashboard)  
**Real results from my machine:**

| Command | Result |
|---------|--------|
| `npx playwright test` | `28 passed (4.8s)` ✅ |
| `npm run test:smoke` | `4 passed (5.0s)` ✅ |
| `npm run test:regression` | `3 passed (4.6s)` ✅ |
| `--grep-invert @wip` | `27 passed (6.6s)` ✅ |

---

## Table of Contents

1. [Why organize tests?](#1-why-organize-tests)
2. [Hooks](#2-hooks)
3. [Fixtures](#3-fixtures)
4. [Test grouping](#4-test-grouping)
5. [Tags](#5-tags)
6. [Project layout](#6-project-layout)
7. [Real failures we fixed](#7-real-failures-we-fixed)
8. [Cheat sheet](#8-cheat-sheet)
9. [Real full output](#9-real-full-output)

---

## 1. Why organize tests?

```text
  Messy suite (copy-paste login 40 times)
           |
           v
  Hard to read · Hard to run one group · Slow feedback

  Organized suite
           |
           +-- hooks       → shared setup/cleanup
           +-- fixtures    → login once, reuse everywhere
           +-- grouping    → Home / Login / Dashboard folders
           +-- tags        → run only @smoke in 5 seconds
```

---

## 2. Hooks

### 2.1 Lifecycle

```text
  beforeAll          ONCE before ALL tests in the file
    beforeEach       BEFORE every test
      test()         your code
    afterEach        AFTER every test  (even if FAILED)
  afterAll           ONCE after ALL tests in the file
```

```text
  ┌─ beforeAll ─────────────────────────────────────┐
  │  ┌─ beforeEach ─┐   ┌─ beforeEach ─┐            │
  │  │    TEST 1     │   │    TEST 2     │  ...      │
  │  └─ afterEach ───┘   └─ afterEach ───┘           │
  └─ afterAll ──────────────────────────────────────┘
```

### 2.2 File-level hooks

```js
import { test, expect } from '@playwright/test';

test.beforeAll(async () => {
  // expensive setup ONCE (seed data, start mock…)
});

test.beforeEach(async ({ page }) => {
  // every test starts on a known page
  await page.goto('index.html');
});

test.afterEach(async ({ page }, testInfo) => {
  // cleanup — runs even on failure
  // common: screenshot if failed
  // if (testInfo.status !== testInfo.expectedStatus) {
  //   await page.screenshot({ path: 'failure.png' });
  // }
});

test.afterAll(() => {
  // teardown ONCE
});
```

### 2.3 What we assert (real test)

```js
test('hook: beforeEach opened home page', async ({ page }) => {
  await expect(page).toHaveURL(/index\.html/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shopping App');
});

test('hook: cart starts at 0 for each test (fresh page)', async ({ page }) => {
  // previous test clicked Add — but THIS test has a new page → still 0
  await expect(page.locator('#cart-count')).toHaveText('Cart: 0');
});
```

**Human check:** *"Did beforeEach already open Home? Is cart clean for each test?"*

### 2.4 Group-level hooks (extra for one describe)

```js
test.describe('checkout group', () => {
  test.beforeEach(() => {
    // runs IN ADDITION to file-level beforeEach
  });

  test('nested beforeEach also runs', async ({ page }) => { /* ... */ });
});
```

**Order with nesting:**

```text
  file beforeEach
    group beforeEach
      subgroup beforeEach
        TEST
      subgroup afterEach
    group afterEach
  file afterEach
```

### 2.5 When to use which

| Hook | Use for |
|------|---------|
| `beforeAll` | create test data once, expensive login token |
| `beforeEach` | `goto`, clear storage, login every test |
| `afterEach` | screenshot on fail, clear cookie |
| `afterAll` | delete test user, stop mock server |

---

## 3. Fixtures

**Fixture** = a value Playwright creates and passes into your test.

### 3.1 Built-in (you already use these)

| Fixture | Meaning |
|---------|---------|
| `page` | one tab |
| `context` | cookies + localStorage profile |
| `browser` | whole browser |
| `browserName` | `'chromium'` etc. |

```js
test('built-in page fixture', async ({ page }) => {
  await page.goto('login.html');
  await expect(page).toHaveTitle('Login — Shopping App');
});
```

### 3.2 Custom fixtures — `tests/fixtures.js`

```js
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // simple value
  testUser: async ({}, use) => {
    await use({ email: 'amit@gmail.com', password: '123456' });
  },

  // page that is ALREADY logged in (uses page + testUser)
  authPage: async ({ page, testUser }, use) => {
    await page.goto('login.html');
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/dashboard\.html/);

    await use(page);   // hand finished page to the test
  },
});

export { expect };
```

### 3.3 Use them in a test

```js
// import OUR test, not '@playwright/test'
import { test, expect } from './fixtures.js';

test('custom fixture: testUser object', async ({ testUser }) => {
  expect(testUser.email).toBe('amit@gmail.com');
});

test('authPage starts on dashboard', async ({ authPage }) => {
  // no login steps here — fixture did them
  await expect(authPage).toHaveURL(/dashboard\.html/);
  await expect(authPage.locator('#user-email')).toHaveText('amit@gmail.com');
});
```

**Human check:** *"Give me a page that’s already logged in."* → `authPage`

### 3.4 Fixture anatomy

```text
  name: async (deps, use) => {
      // setup before test
      await use(value);  // ← value goes into your test parameter
      // cleanup after test
  }
```

```text
  WITHOUT fixture:  login copy-pasted in 20 tests
  WITH fixture:     async ({ authPage }) => { ... }
```

---

## 4. Test grouping

**`test.describe('name', () => { ... })`** = folder in the report.  
Does **not** merge tests — each test still independent (unless you choose serial).

### 4.1 Top-level groups

```js
test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
  });

  test('shows title', async ({ page }) => { /* ... */ });
  test('cart starts empty', async ({ page }) => { /* ... */ });
  test('add button increases cart', async ({ page }) => { /* ... */ });
});

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('login.html');
  });

  test('shows login form', async ({ page }) => { /* ... */ });
  test('login with credentials goes to dashboard', async ({ page }) => { /* ... */ });
});
```

### 4.2 Nested groups

```js
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('dashboard.html');
  });

  test.describe('when logged in (email in storage)', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('email', 'amit@gmail.com'));
      await page.reload();
    });

    test('shows welcome message', async ({ page }) => { /* ... */ });
    test('shows cart items', async ({ page }) => { /* ... */ });
  });

  test.describe('when logged out', () => {
    test('welcome message stays hidden', async ({ page }) => { /* ... */ });
  });
});
```

**Report looks like:**

```text
  Dashboard
    when logged in (email in storage)
      ✓ shows welcome message
      ✓ shows cart items
    when logged out
      ✓ welcome message stays hidden
```

**Human check:** *"Dashboard → logged-in state → welcome shows."*

### 4.3 Serial mode (one after another)

```js
test.describe.configure({ mode: 'serial' }); // whole file

// or for one group — call inside describe
test.describe('critical path', () => {
  test.describe.configure({ mode: 'serial' });
  test('step 1', async () => { /* ... */ });
  test('step 2', async () => { /* ... */ });
});
```

| Mode | Behavior |
|------|----------|
| default + `fullyParallel` | tests run together (fast) |
| `serial` | one-by-one, **stop on first failure** (use for multi-step flows) |

We used `serial` in `01-hooks.spec.js` so hook counters are shared in one worker.

---

## 5. Tags

Tags = labels (`@smoke`, `@regression`, `@wip`) so you can **run a subset**.

### 5.1 Style 1 — in the title

```js
test('@smoke home page loads', async ({ page }) => { /* ... */ });
```

### 5.2 Style 2 — Playwright tag option (cleaner title)

```js
test('dashboard shows cart', { tag: '@regression' }, async ({ page }) => {
  /* ... */
});
// report shows: dashboard shows cart  @regression
```

### 5.3 Style 3 — multiple tags

```js
test('critical checkout path', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
  /* ... */
});
```

### 5.4 How to run subsets (real output below)

```bash
# only smoke
npx playwright test --grep @smoke
npm run test:smoke

# only regression
npx playwright test --grep @regression
npm run test:regression

# everything EXCEPT work-in-progress
npx playwright test --grep-invert @wip
```

`--grep` = “test title/tag matches this pattern”.  
`--grep-invert` = “does NOT match”.

### 5.5 When to use which tag

| Tag | Meaning | When to run |
|-----|---------|-------------|
| `@smoke` | tiny must-pass set | every commit / PR |
| `@regression` | broader suite | nightly / before release |
| `@critical` | money paths (login, pay) | before every deploy |
| `@wip` | unfinished | **exclude** with `--grep-invert @wip` |

**Human check:** *"CI green needs only 4 smoke tests in 5 seconds."*

---

## 6. Project layout

```text
topic-07-organization/
├── package.json          # scripts: test, test:smoke, test:regression
├── playwright.config.js
├── site/
│   ├── index.html
│   ├── login.html        # saves email → localStorage
│   └── dashboard.html
└── tests/
    ├── fixtures.js       # custom testUser + authPage (NOT a .spec file)
    ├── 01-hooks.spec.js
    ├── 02-fixtures.spec.js
    ├── 03-grouping.spec.js
    └── 04-tags.spec.js
```

Only `*.spec.js` are collected as tests — `fixtures.js` is a helper module.

---

## 7. Real failures we fixed

### Fail 1 — login never saved the email

```text
Expected: "amit@gmail.com"
Received: "not logged in"
```

**Cause:** `login.html` redirected to dashboard but never `localStorage.setItem('email', ...)`.

**Fix:**

```js
localStorage.setItem('email', email);
window.location.href = 'dashboard.html';
```

### Fail 2 — hook counters with parallel workers

```text
Expected: 4
Received: 1
```

**Cause:** `fullyParallel: true` can run file tests in **different workers** — each worker loads the file fresh → counters don’t add up.

**Fix:**

```js
test.describe.configure({ mode: 'serial' }); // one worker, shared counters
```

**Rule:** shared module state + parallel tests = surprise. Prefer **serial** for counter demos, or don’t assert on cross-test counters.

---

## 8. Cheat sheet

| I want to... | Code / command |
|--------------|----------------|
| Setup every test | `test.beforeEach(async ({ page }) => { ... })` |
| Setup once per file | `test.beforeAll(...)` |
| Cleanup after each | `test.afterEach(...)` |
| Group tests | `test.describe('Name', () => { ... })` |
| Nested group | describe inside describe |
| Force order | `test.describe.configure({ mode: 'serial' })` |
| Custom fixture | `test.extend({ name: async (d, use) => await use(x) })` |
| Import custom test | `import { test, expect } from './fixtures.js'` |
| Tag in title | `test('@smoke ...', ...)` |
| Tag option | `test('name', { tag: '@regression' }, ...)` |
| Run smoke only | `npx playwright test --grep @smoke` |
| Run regression only | `npx playwright test --grep @regression` |
| Skip wip | `npx playwright test --grep-invert @wip` |
| npm scripts | `npm run test:smoke` |

---

## 9. Real full output

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
./package.json
./playwright.config.js
./site/index.html
./site/login.html
./site/dashboard.html
./tests/fixtures.js
./tests/01-hooks.spec.js
./tests/02-fixtures.spec.js
./tests/03-grouping.spec.js
./tests/04-tags.spec.js
```

### Full suite — `npx playwright test`

```text
Running 28 tests using 6 workers

  ✓   5 [chromium] › tests/02-fixtures.spec.js:41:1 › custom fixture: testUser object (23ms)
  ✓   1 [chromium] › tests/01-hooks.spec.js:57:1 › hook: beforeEach opened home page (780ms)
  ✓   4 [chromium] › tests/02-fixtures.spec.js:21:1 › built-in page fixture (856ms)
  ✓   7 [chromium] › tests/03-grouping.spec.js:24:3 › Home page › shows title (693ms)
  ✓   2 [chromium] › tests/02-fixtures.spec.js:49:1 › custom fixture: authPage starts on dashboard (1.2s)
  ✓   8 [chromium] › tests/01-hooks.spec.js:62:1 › hook: cart starts at 0 for each test (fresh page) (316ms)
  ✓   9 [chromium] › tests/03-grouping.spec.js:28:3 › Home page › cart starts empty (261ms)
  ✓   6 [chromium] › tests/02-fixtures.spec.js:26:1 › built-in context — storage state (1.2s)
  ✓  10 [chromium] › tests/03-grouping.spec.js:32:3 › Home page › add button increases cart (396ms)
  ✓   3 [chromium] › tests/02-fixtures.spec.js:56:1 › authPage ready for real work (orders in cart) (1.3s)
  ✓  11 [chromium] › tests/03-grouping.spec.js:43:3 › Login page › shows login form (346ms)
  ✓  12 [chromium] › tests/01-hooks.spec.js:67:1 › hook: can interact after beforeEach setup (566ms)
  ✓  14 [chromium] › tests/03-grouping.spec.js:74:5 › Dashboard › when logged in (email in storage) › shows welcome message (569ms)
  ✓  16 [chromium] › tests/03-grouping.spec.js:79:5 › Dashboard › when logged in (email in storage) › shows cart items (482ms)
  ✓  15 [chromium] › tests/03-grouping.spec.js:85:5 › Dashboard › when logged out › welcome message stays hidden (523ms)
  ✓  18 [chromium] › tests/01-hooks.spec.js:73:1 › hook: counters prove order of hooks (258ms)
  ✓  17 [chromium] › tests/03-grouping.spec.js:105:3 › serial critical path › step 1 — open home (366ms)
  ✓  13 [chromium] › tests/03-grouping.spec.js:49:3 › Login page › login with credentials goes to dashboard (851ms)
  ✓  20 [chromium] › tests/04-tags.spec.js:23:3 › @smoke critical path › @smoke home page loads (273ms)
  ✓  21 [chromium] › tests/04-tags.spec.js:28:3 › @smoke critical path › @smoke user can open login (253ms)
  ✓  19 [chromium] › tests/03-grouping.spec.js:110:3 › serial critical path › step 2 — go login (364ms)
  ✓  24 [chromium] › tests/04-tags.spec.js:46:1 › dashboard shows cart @regression (243ms)
  ✓  22 [chromium] › tests/01-hooks.spec.js:91:3 › checkout group with extra setup › nested beforeEach also runs (251ms)
  ✓  28 [chromium] › tests/04-tags.spec.js:79:1 › @wip work in progress — skip in CI (2ms)
  ✓  25 [chromium] › tests/04-tags.spec.js:51:1 › home add to cart works @regression (259ms)
  ✓  23 [chromium] › tests/04-tags.spec.js:34:3 › @smoke critical path › @smoke login reaches dashboard (475ms)
  ✓  27 [chromium] › tests/04-tags.spec.js:66:1 › critical checkout path @smoke @critical (269ms)
  ✓  26 [chromium] › tests/04-tags.spec.js:57:1 › logout returns to login @regression (385ms)

  28 passed (4.8s)
```

### Smoke only — `npm run test:smoke` / `--grep @smoke`

```text
Running 4 tests using 4 workers

  ✓  3 [chromium] › tests/04-tags.spec.js:28:3 › @smoke critical path › @smoke user can open login (1.0s)
  ✓  2 [chromium] › tests/04-tags.spec.js:66:1 › critical checkout path @smoke @critical (1.2s)
  ✓  1 [chromium] › tests/04-tags.spec.js:23:3 › @smoke critical path › @smoke home page loads (1.3s)
  ✓  4 [chromium] › tests/04-tags.spec.js:34:3 › @smoke critical path › @smoke login reaches dashboard (2.1s)

  4 passed (5.0s)
```

### Regression only — `npm run test:regression`

```text
Running 3 tests using 3 workers

  ✓  1 [chromium] › tests/04-tags.spec.js:46:1 › dashboard shows cart @regression (1.5s)
  ✓  3 [chromium] › tests/04-tags.spec.js:57:1 › logout returns to login @regression (1.6s)
  ✓  2 [chromium] › tests/04-tags.spec.js:51:1 › home add to cart works @regression (1.8s)

  3 passed (4.6s)
```

### Skip WIP — `--grep-invert @wip`

```text
  ...
  27 passed (6.6s)
```

*(28 total − 1 `@wip` = 27.)*

---

## Quick self-check

1. Setup before **every** test? → `beforeEach`
2. Setup once per **file**? → `beforeAll`
3. Cleanup after **failed** test too? → `afterEach` ✅
4. Login once and reuse? → **custom fixture** `authPage`
5. Report folder for related tests? → `test.describe`
6. Multi-step flow must run in order? → `mode: 'serial'`
7. Run only critical tests on each commit? → tag `@smoke` + `--grep @smoke`
8. Skip unfinished tests? → `@wip` + `--grep-invert @wip`

All 8 → Topic 7 done ✅

---

## Next topic

**Topic 8 — Page Object Model (POM)** — another organization pattern for locators/actions — coming soon.

---

*Topic 7 · Test Organization · ES6 · Real output: 28 passed full · 4 smoke · 3 regression · Playwright 1.63.0*

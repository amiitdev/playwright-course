# Topic 1 — Playwright Basics

> **Goal:** install Playwright, understand project structure, run tests, learn test syntax, and learn every assertion (`expect`) with **one simple Shopping App** — no confusing websites.

**Language:** modern **ES6 JavaScript** (`import` / `export`)

**Real result from my machine:** `15 passed (3.3s)` ✅

---

## Table of Contents

1. [What is Playwright?](#1-what-is-playwright)
2. [ES6 in this course](#2-es6-in-this-course)
3. [Our simple website: Shopping App](#3-our-simple-website-shopping-app)
4. [Installation](#4-installation)
5. [Project structure](#5-project-structure)
6. [How a test runs](#6-how-a-test-runs)
7. [Running tests](#7-running-tests)
8. [Test files and syntax](#8-test-files-and-syntax)
9. [Assertions (expect) — matcher by matcher](#9-assertions-expect--matcher-by-matcher)
10. [Real login example](#10-real-login-example)
11. [What a failing test looks like (real)](#11-what-a-failing-test-looks-like-real)
12. [Which matcher should I use?](#12-which-matcher-should-i-use)
13. [Command cheat sheet](#13-command-cheat-sheet)
14. [Real full output](#14-real-full-output)

---

## 1. What is Playwright?

```text
  You write a test (JavaScript)
            |
            v
  Playwright opens a real browser
            |
            v
  Browser opens YOUR page (here: our Shopping App)
            |
            v
  expect(...) checks if something is true
            |
            +---- yes --> PASS  ✓
            +---- no  --> FAIL  ✘  (shows Expected vs Received)
```

**In one line:** Playwright **opens a page** and **checks things** for you.

---

## 2. ES6 in this course

Every file uses modern ES6 modules.

| Old way (we do NOT use) | New way (we USE this) |
|-------------------------|------------------------|
| `const { test } = require(...)` | `import { test } from '...'` |
| `module.exports = config` | `export default config` |

Enabled by this one line in `package.json`:

```json
"type": "module"
```

```js
// ✅ always this
import { test, expect } from '@playwright/test';

// ❌ never this
const { test, expect } = require('@playwright/test');
```

---

## 3. Our simple website: Shopping App

Forget `example.com`. We test **our own tiny local website** in `site/`.

### Home page — `site/index.html`

```html
<title>Shopping App</title>

<h1>Welcome Amit</h1>

<p>Your order has been placed successfully.</p>

<ul>
  <li>Apple</li>
  <li>Banana</li>
</ul>

<div class="hidden-secret" style="display:none">
  Secret Admin Panel
</div>

<a href="login.html">Go to Login Page</a>
```

**What is on this page (your checklist):**

| Element | Text / value | We use it for |
|---------|--------------|---------------|
| `<title>` | `Shopping App` | `toHaveTitle` |
| `<h1>` | `Welcome Amit` | `toBeVisible`, `toHaveText` |
| `<p>` | `Your order has been placed successfully.` | `toContainText` |
| `<li>` × 2 | `Apple`, `Banana` | `toHaveCount` |
| hidden div | `Secret Admin Panel` | shows `toBeVisible` FAIL |
| address | `.../site/index.html` | `toHaveURL` |

### Login page — `site/login.html`

Simple form: email + password + Login button.  
On submit → jumps to `dashboard.html` (no real server).

### Dashboard page — `site/dashboard.html`

```html
<title>Dashboard — Shopping App</title>
<h1>Welcome Amit</h1>
<button class="logout-btn">Logout</button>
```

**Why local file?** No internet needed. Playwright opens:

```text
file:///home/amit/Desktop/playwright-course/topic-01-playwright-basics/site/index.html
```

Set once in config as `baseURL` → tests just write `page.goto('index.html')`.

---

## 4. Installation

### Prerequisites (your machine)

```bash
node --version
npm --version
```

**Real output:**

```text
v24.19.0
11.17.0
```

### Install (3 commands)

```bash
cd topic-01-playwright-basics
npm install
npx playwright install chromium
```

| Command | What it does |
|---------|--------------|
| `npm install` | downloads the Playwright library |
| `npx playwright install chromium` | downloads the real browser (one-time) |

**Real output — `npm install`:**

```text
added 3 packages, and audited 4 packages in 3s

found 0 vulnerabilities
```

**Real output — version:**

```text
$ npx playwright --version
Version 1.63.0
```

---

## 5. Project structure

```text
topic-01-playwright-basics/
│
├── package.json            # "type": "module" + scripts
├── playwright.config.js    # baseURL → our local site/
├── .gitignore
│
├── site/                   # ★ our tiny Shopping App website
│   ├── index.html          #   home (h1, p, list, title)
│   ├── login.html          #   fake login form
│   └── dashboard.html      #   after login
│
└── tests/
    ├── 01-first-test.spec.js      # anatomy of one test
    ├── 02-running-tests.spec.js   # several small tests
    └── 03-assertions.spec.js      # every matcher explained
```

### `playwright.config.js` — line by line (ES6)

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// __dirname = folder of this config file (ES6 has no built-in __dirname)

export default defineConfig({
  testDir: './tests',              // look for tests inside tests/
  timeout: 30000,                  // fail any test after 30 seconds
  fullyParallel: true,             // run tests together (each has own page)
  retries: 0,                      // do not re-run failures
  reporter: 'list',                // nice checklist in terminal

  use: {
    // file:// URL of site/  (trailing slash is important!)
    // page.goto('index.html')  →  file:///.../site/index.html
    baseURL: `file://${path.join(__dirname, 'site')}/`,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**baseURL in one picture:**

```text
  page.goto('index.html')   +   baseURL = file:///.../site/
                                --------------------------------
  browser actually opens  -->  file:///.../site/index.html
```

---

## 6. How a test runs

```text
npx playwright test
        |
        v
  read playwright.config.js  (find baseURL, testDir)
        |
        v
  collect every tests/*.spec.js
        |
        v
  for each test('name', fn):
        |
        +-- open browser (chromium)
        +-- open a fresh page     ← "page" fixture
        +-- page.goto('index.html')
        +-- locator  = WHERE
        +-- expect   = WHAT must be true
        |
        +-- PASS ✓  or  FAIL ✘ (Expected vs Received)
        +-- close page
        |
        v
  summary:  "15 passed (3.3s)"
```

---

## 7. Running tests

| Command | What it does |
|---------|--------------|
| `npx playwright test` | run ALL tests |
| `npx playwright test tests/01-first-test.spec.js` | run ONE file |
| `npx playwright test -g "login"` | run tests with "login" in the name |
| `npm run test:headed` | watch the browser live |
| `npm run test:report` | open HTML report |

### Real output — one file

```text
$ npx playwright test tests/01-first-test.spec.js

Running 1 test using 1 worker

  ✓  1 [chromium] › tests/01-first-test.spec.js:9:1 › Shopping App home page loads with welcome heading (444ms)

  1 passed (2.6s)
```

### Real output — all tests

```text
$ npx playwright test

Running 15 tests using 6 workers

  ✓   3 [chromium] › tests/03-assertions.spec.js:20:3 › web-first (auto-retry) › toBeVisible — can I see the heading? (784ms)
  ✓   1 [chromium] › tests/02-running-tests.spec.js:11:1 › tab title is Shopping App (822ms)
  ✓   2 [chromium] › tests/02-running-tests.spec.js:17:1 › we are on the home page URL (917ms)
  ✓   6 [chromium] › tests/01-first-test.spec.js:9:1 › Shopping App home page loads with welcome heading (730ms)
  ✓   5 [chromium] › tests/02-running-tests.spec.js:29:1 › order message contains the word order (711ms)
  ✓   4 [chromium] › tests/02-running-tests.spec.js:23:1 › fruits list has exactly 2 items (763ms)
  ✓   7 [chromium] › tests/03-assertions.spec.js:30:3 › web-first (auto-retry) › toHaveText — exact full text (305ms)
  ✓   9 [chromium] › tests/03-assertions.spec.js:46:3 › web-first (auto-retry) › toHaveCount — how many elements? (244ms)
  ✓   8 [chromium] › tests/03-assertions.spec.js:37:3 › web-first (auto-retry) › toContainText — piece of text inside (306ms)
  ✓  14 [chromium] › tests/03-assertions.spec.js:99:3 › generic (no retry) › toContain — string and array (6ms)
  ✓  10 [chromium] › tests/03-assertions.spec.js:53:3 › web-first (auto-retry) › toHaveURL — where is the browser? (301ms)
  ✓  15 [chromium] › tests/03-assertions.spec.js:109:3 › generic (no retry) › toBeTruthy — is the value not empty? (6ms)
  ✓  11 [chromium] › tests/03-assertions.spec.js:59:3 › web-first (auto-retry) › toHaveTitle — what is on the tab? (282ms)
  ✓  13 [chromium] › tests/03-assertions.spec.js:87:3 › generic (no retry) › toBe — strict === comparison (155ms)
  ✓  12 [chromium] › tests/03-assertions.spec.js:64:3 › web-first (auto-retry) › real flow: login → dashboard (URL + text + visible) (453ms)

  15 passed (3.3s)
```

**How to read one line:**

```text
✓  6  [chromium]  ›  tests/01-first-test.spec.js:9:1  ›  Shopping App home page...  (730ms)
│    │              │                │                     │                        │
│    │              │                │                     │                        └ how long
│    │              │                │                     └ test name (story language)
│    │              │                └ file : line : column  (click to jump in editor)
│    │              └ which browser
│    └ passed
└ green check = PASS
```

---

## 8. Test files and syntax

**Rule:** only files ending in `.spec.js` are tests.

```text
tests/01-first-test.spec.js   ✅ collected
tests/helper.js               ❌ ignored (not a test)
```

### Anatomy of ONE test (open the file while reading)

```js
// tests/01-first-test.spec.js

import { test, expect } from '@playwright/test';
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^ ES6 import (not require)
//  test   = create a test
//  expect = check something

test('Shopping App home page loads with welcome heading', async ({ page }) => {
//  ^^^ story-style name you will see in the report
//  async + { page } = Playwright gives a fresh page for THIS test

  await page.goto('index.html');
  // open our local home page (baseURL handles the file:// path)

  const heading = page.locator('h1');
  // WHERE: find the <h1>. Lazy — does nothing until we assert.

  await expect(heading).toBeVisible();
  // WHAT: "Can I see it?"  → human check

  await expect(heading).toHaveText('Welcome Amit');
  // WHAT: "Is the text exactly Welcome Amit?" → human check
});
```

### The mental model (memorize)

```text
   LOCATOR  -->  WHERE?    page.locator('h1')
      |
      v
 ASSERTION -->  WHAT?     expect(heading).toBeVisible()
```

You always need **both**.

---

## 9. Assertions (expect) — matcher by matcher

> An assertion is the only line that can **pass or fail**.

### Two flavors (very important)

```text
┌──────────────────────────────┬─────────────────────────────────────┐
│ WEB-FIRST (page elements)    │ GENERIC (plain JavaScript values)  │
│ expect(locator).toHaveText   │ expect(someValue).toBe(...)        │
│ expect(page).toHaveURL       │                                     │
│                              │                                     │
│ • you MUST await             │ • no await                          │
│ • auto-retries ~5 seconds    │ • checks ONCE                       │
└──────────────────────────────┴─────────────────────────────────────┘
```

---

### 9.1 `toBeVisible()` — can I see it?

**Checks:** is the element actually shown on screen?

Page:

```html
<h1>Welcome Amit</h1>
```

Test:

```js
const heading = page.locator('h1');
await expect(heading).toBeVisible();
```

**Human check:** *"Can I see the heading?"* → yes ✅ **PASS**

If hidden:

```html
<h1 style="display:none">Welcome Amit</h1>
```

```js
await expect(page.locator('h1')).toBeVisible();  // ❌ FAIL
```

**Real failure from my machine:**

```text
Error: expect(locator).toBeVisible() failed

Locator:  locator('.hidden-secret')
Expected: visible
Received: hidden
```

`Expected: visible` / `Received: hidden` — now you know instantly.

---

### 9.2 `toHaveText('...')` — exact full text

**Checks:** the text is **exactly** what you wrote (no more, no less).

Page:

```html
<h1>Welcome Amit</h1>
```

Test:

```js
await expect(page.locator('h1')).toHaveText('Welcome Amit');  // ✅ PASS
```

Because text matches **exactly**.

Wrong:

```js
await expect(page.locator('h1')).toHaveText('Welcome');  // ❌ FAIL
```

Because actual text is `Welcome Amit`, not `Welcome`.

**Real failure from my machine:**

```text
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('h1')
Expected: "Welcome"
Received: "Welcome Amit"
```

| | |
|--|--|
| `toHaveText('Welcome Amit')` | ✅ full match |
| `toHaveText('Welcome')` | ❌ too short — must be complete text |

---

### 9.3 `toContainText('...')` — piece of text inside

**Checks:** some words **exist somewhere** inside a bigger text.

Page:

```html
<p>Your order has been placed successfully.</p>
```

Test:

```js
await expect(page.locator('p')).toContainText('order');  // ✅ PASS
```

Because:

```text
Your order has been placed successfully.
        ^^^^^ contains "order"
```

Also works with RegExp:

```js
await expect(page.locator('p')).toContainText(/success/i);  // ✅ PASS
```

`i` = ignore case (`SUCCESS`, `Success`, `success` all OK).

#### Difference (very important)

```js
// EXACT full sentence needed
toHaveText('Your order has been placed successfully.')

// only a piece needed
toContainText('order')
```

```text
  toHaveText     =  full sentence must match 100%
  toContainText  =  a few letters/words found inside = enough
```

---

### 9.4 `toHaveCount(n)` — how many matches?

Page:

```html
<li>Apple</li>
<li>Banana</li>
```

Test:

```js
await expect(page.locator('li')).toHaveCount(2);  // ✅ PASS
```

Because there are **2** `<li>` elements.

```js
await expect(page.locator('li')).toHaveCount(3);  // ❌ FAIL
```

Only 2 exist.

**Human check:** *"How many items does my locator match right now?"*

---

### 9.5 `toHaveURL('...')` — where is the browser?

Suppose browser is on:

```text
file:///.../site/login.html
```

Test:

```js
await expect(page).toHaveURL(/login\.html/);  // ✅ PASS
```

Wrong:

```js
await expect(page).toHaveURL(/dashboard\.html/);  // ❌ FAIL
```

Current page is login, not dashboard.

**Human check:** *"What address is in the address bar?"*

Tip: for local files the full URL contains your computer path, so we often use a **RegExp** like `/login\.html/` instead of the whole path.

---

### 9.6 `toHaveTitle('...')` — browser tab name

HTML:

```html
<title>Shopping App</title>
```

Test:

```js
await expect(page).toHaveTitle('Shopping App');  // ✅ PASS
```

**Human check:** *"What name is on the browser tab?"*

---

### 9.7 `toBe(...)` — strict `===` (NOT for locators)

This compares **normal JavaScript values**.

```js
const name = 'Amit';
expect(name).toBe('Amit');     // ✅ PASS

const age = 38;
expect(age).toBe(38);          // ✅ PASS
expect(age).toBe('38');        // ❌ FAIL
```

Why FAIL?

```text
38 === "38"   is   false

number and string are different types
```

**Human check:** *"Is this value exactly equal (===) to that value?"*

---

### 9.8 `toContain(...)` — string and array

**String example:**

```js
const title = 'Shopping App';

expect(title).toContain('Shopping');  // ✅ PASS
expect(title).toContain('Amazon');    // ❌ FAIL
```

**Array example:**

```js
const fruits = ['Apple', 'Banana', 'Mango'];

expect(fruits).toContain('Banana');   // ✅ PASS
expect(fruits).toContain('Orange');   // ❌ FAIL
```

**Human check:** *"Is this piece inside the string / array?"*

Note: `toContain` is **generic** (no retry). For page text use `toContainText` (with retry).

---

### 9.9 `toBeTruthy()` — is the value not empty?

**Truthy (passes) values:** `true`, `1`, `"hello"`, `[]`, `{}`

```js
const loggedIn = true;
expect(loggedIn).toBeTruthy();   // ✅ PASS

const username = 'Amit';
expect(username).toBeTruthy();   // ✅ PASS
```

**Falsy (fails) values:** `false`, `0`, `""`, `null`, `undefined`, `NaN`

```js
const username = '';
expect(username).toBeTruthy();   // ❌ FAIL — empty string is falsy
```

**Human check:** *"Is there actually something here (not empty/false/nothing)?"*

---

### Quick table — all matchers

| Matcher | Human question | Retry? | On |
|---------|----------------|--------|-----|
| `toBeVisible()` | Can I see it? | ✅ | element |
| `toHaveText('...')` | Exact full text? | ✅ | element |
| `toContainText('...')` | Piece of text inside? | ✅ | element |
| `toHaveCount(n)` | How many matches? | ✅ | locator |
| `toHaveURL('...')` | What address bar? | ✅ | page |
| `toHaveTitle('...')` | What tab name? | ✅ | page |
| `toBe(...)` | Exactly equal `===`? | ❌ | plain value |
| `toContain(...)` | Piece in string/array? | ❌ | plain value |
| `toBeTruthy()` | Not empty / not false? | ❌ | plain value |

---

## 10. Real login example

Our `site/login.html` → click Login → `site/dashboard.html`.

```js
await page.goto('login.html');

await page.fill('#email', 'amit@gmail.com');
await page.fill('#password', '123456');
await page.click('button[type="submit"]');

// Did login redirect to dashboard?  → toHaveURL
await expect(page).toHaveURL(/dashboard\.html/);

// Is heading exactly "Welcome Amit"? → toHaveText
await expect(page.locator('h1')).toHaveText('Welcome Amit');

// Is logout button visible?         → toBeVisible
await expect(page.locator('.logout-btn')).toBeVisible();
```

Here you check 3 things after login:

| Question | Matcher |
|----------|---------|
| Did we land on dashboard? | `toHaveURL()` |
| Heading exactly right? | `toHaveText()` |
| Logout button showing? | `toBeVisible()` |

**This test is in the project and PASSED** (see real output below — name: `real flow: login → dashboard`).

---

## 11. What a failing test looks like (real)

I ran 2 temporary tests that **should fail**, to show you the real messages.

### Fail 1 — wrong exact text

```text
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('h1')
Expected: "Welcome"
Received: "Welcome Amit"
Timeout:  5000ms
```

| Clue | Meaning |
|------|---------|
| `Expected: "Welcome"` | what the test wanted |
| `Received: "Welcome Amit"` | what the page really shows |
| Fix | write the full text, or use `toContainText('Welcome')` |

### Fail 2 — hidden element

```text
Error: expect(locator).toBeVisible() failed

Locator:  locator('.hidden-secret')
Expected: visible
Received: hidden
```

| Clue | Meaning |
|------|---------|
| `Received: hidden` | element exists but `display:none` |
| Fix | remove the hide, or pick a different element |

**Rule:** always read **Expected** vs **Received** first. The answer is usually right there.

---

## 12. Which matcher should I use?

### Learn these 3 first (you will use them every day)

```js
await expect(locator).toBeVisible();     // is it there on screen?
await expect(locator).toHaveText('...');  // is the text exact?
await expect(page).toHaveURL('...');      // did we navigate right?
```

### Then learn these 2

```js
await expect(locator).toContainText('...');  // partial text
await expect(locator).toHaveCount(2);        // how many
```

### The rest are standard JavaScript checks

```js
expect(value).toBe(...);        // ===
expect(value).toContain(...);   // piece in string/array
expect(value).toBeTruthy();     // not empty
```

```text
  PAGE checks  →  await + auto-retry     (toBeVisible, toHaveText, toHaveURL ...)
  VALUE checks →  no await, once         (toBe, toContain, toBeTruthy)
```

---

## 13. Command cheat sheet

| I want to... | Command |
|--------------|---------|
| Install libraries | `npm install` |
| Install browser | `npx playwright install chromium` |
| Run all tests | `npx playwright test` |
| Run one file | `npx playwright test tests/01-first-test.spec.js` |
| Run by name | `npx playwright test -g "login"` |
| Watch browser | `npm run test:headed` |
| Open report | `npm run test:report` |

---

## 14. Real full output

Captured on this machine with the Shopping App (ES6 code).

### Environment

```text
$ node --version
v24.19.0

$ npm --version
11.17.0

$ npx playwright --version
Version 1.63.0
```

### Install

```text
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
./tests/01-first-test.spec.js
./tests/02-running-tests.spec.js
./tests/03-assertions.spec.js
```

### Final run — `npx playwright test`

```text
Running 15 tests using 6 workers

  ✓   3 [chromium] › tests/03-assertions.spec.js:20:3 › web-first (auto-retry) › toBeVisible — can I see the heading? (784ms)
  ✓   1 [chromium] › tests/02-running-tests.spec.js:11:1 › tab title is Shopping App (822ms)
  ✓   2 [chromium] › tests/02-running-tests.spec.js:17:1 › we are on the home page URL (917ms)
  ✓   6 [chromium] › tests/01-first-test.spec.js:9:1 › Shopping App home page loads with welcome heading (730ms)
  ✓   5 [chromium] › tests/02-running-tests.spec.js:29:1 › order message contains the word order (711ms)
  ✓   4 [chromium] › tests/02-running-tests.spec.js:23:1 › fruits list has exactly 2 items (763ms)
  ✓   7 [chromium] › tests/03-assertions.spec.js:30:3 › web-first (auto-retry) › toHaveText — exact full text (305ms)
  ✓   9 [chromium] › tests/03-assertions.spec.js:46:3 › web-first (auto-retry) › toHaveCount — how many elements? (244ms)
  ✓   8 [chromium] › tests/03-assertions.spec.js:37:3 › web-first (auto-retry) › toContainText — piece of text inside (306ms)
  ✓  14 [chromium] › tests/03-assertions.spec.js:99:3 › generic (no retry) › toContain — string and array (6ms)
  ✓  10 [chromium] › tests/03-assertions.spec.js:53:3 › web-first (auto-retry) › toHaveURL — where is the browser? (301ms)
  ✓  15 [chromium] › tests/03-assertions.spec.js:109:3 › generic (no retry) › toBeTruthy — is the value not empty? (6ms)
  ✓  11 [chromium] › tests/03-assertions.spec.js:59:3 › web-first (auto-retry) › toHaveTitle — what is on the tab? (282ms)
  ✓  13 [chromium] › tests/03-assertions.spec.js:87:3 › generic (no retry) › toBe — strict === comparison (155ms)
  ✓  12 [chromium] › tests/03-assertions.spec.js:64:3 › web-first (auto-retry) › real flow: login → dashboard (URL + text + visible) (453ms)

  15 passed (3.3s)
```

---

## Quick self-check

1. Our test website lives in which folder? → `site/`
2. Which matcher = "Can I see it?"? → `toBeVisible()`
3. Which matcher = exact full text? → `toHaveText('...')`
4. Which matcher = a piece of text inside? → `toContainText('...')`
5. `toHaveText('Welcome')` vs page text `Welcome Amit` → PASS or FAIL? → **FAIL**
6. Which 3 matchers should you learn first? → `toBeVisible`, `toHaveText`, `toHaveURL`

All 6 → Topic 1 done ✅

---

## Next topic

**Topic 2 — Locators** (`locator`, `getByRole`, `getByText`, chaining) — coming soon.

---

*Topic 1 · Playwright Basics · Shopping App · ES6 · Real output: 15 passed (3.3s) · Playwright 1.63.0*

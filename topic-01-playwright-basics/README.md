# Topic 1 — Playwright Basics

> **Goal of this topic:** understand what Playwright is, how to install it, how a project is structured, how to run tests, the test file syntax, and how assertions (`expect`) work.

**Language: modern ES6 JavaScript** (`import` / `export` — no `require`)

**Real result from my machine:** `11 passed (3.6s)` ✅

---

## Table of Contents

1. [What is Playwright?](#1-what-is-playwright)
2. [ES6 in this course](#2-es6-in-this-course)
3. [Installation](#3-installation)
4. [Project Structure](#4-project-structure)
5. [How a Test Runs (flow diagram)](#5-how-a-test-runs-flow-diagram)
6. [Running Tests](#6-running-tests)
7. [Test Files and Syntax](#7-test-files-and-syntax)
8. [Assertions (expect)](#8-assertions-expect)
9. [What a Failing Test Looks Like](#9-what-a-failing-test-looks-like)
10. [Command Cheat Sheet](#10-command-cheat-sheet)
11. [Real Full Output](#11-real-full-output)

---

## 1. What is Playwright?

```text
  You write a test (JavaScript / ES6)
            |
            v
  Playwright opens a real browser (Chromium)
            |
            v
  Browser visits your URL, clicks, types, reads page
            |
            v
  expect(...) checks if result is correct
            |
            +---- PASS --> green check ✓
            |
            +---- FAIL --> red cross  ✘  (+ reason)
```

**In one line:** Playwright is a tool that **drives a real browser** and **checks the results** automatically.

Why Playwright?

| Feature | Meaning in simple words |
|---------|-------------------------|
| Real browser | Not a simulation — actual Chromium/Firefox/WebKit |
| Auto-wait | Playwright waits for elements by itself, no manual sleeps |
| One language | Tests written in **ES6 JavaScript** (this course) |
| Free & open | Made by Microsoft, no license cost |

---

## 2. ES6 in this course

Every file in this course uses **modern ES6 modules**.

| Old way (CommonJS) | New way (ES6 — WE USE THIS) |
|--------------------|-----------------------------|
| `const { test } = require('@playwright/test')` | `import { test } from '@playwright/test'` |
| `module.exports = config` | `export default config` |
| file-level scope tricks | real standard, works in browser + Node |

**One switch makes Node use ES6** — in `package.json`:

```json
"type": "module"
```

```text
  "type": "module"  in package.json
         |
         +-->  Node treats every .js file as an ES6 module
         |
         +-->  import / export work everywhere in this project
```

**Rule for this course:**

```js
// ✅ DO (ES6)
import { test, expect } from '@playwright/test';
export default defineConfig({ ... });

// ❌ DON'T (CommonJS — not used in this course)
const { test, expect } = require('@playwright/test');
module.exports = { ... };
```

---

## 3. Installation

### 3.1 Prerequisites (already on your machine)

```bash
node --version    # need Node.js
npm --version     # need npm
```

**Real output from my machine:**

```text
v24.19.0
11.17.0
```

### 3.2 Step-by-step install (run these 3 commands)

```bash
# Step 1: enter the topic folder
cd topic-01-playwright-basics

# Step 2: install the Playwright test library
npm install

# Step 3: download the Chromium browser (one-time)
npx playwright install chromium
```

**What each command does:**

| Command | What it does | Like ordering... |
|---------|--------------|------------------|
| `npm install` | Reads `package.json`, downloads `@playwright/test` into `node_modules/` | Ordering the tool kit |
| `npx playwright install chromium` | Downloads the actual browser binary (~150 MB) | Ordering the machine the tool runs on |

**Real output — `npm install`:**

```text
added 3 packages, and audited 4 packages in 3s

found 0 vulnerabilities
```

**Real output — `npx playwright --version`:**

```text
Version 1.63.0
```

**Real output — `npm ls @playwright/test`:**

```text
playwright-basics-topic-01@1.0.0 /home/amit/Desktop/playwright-course/topic-01-playwright-basics
└── @playwright/test@1.63.0
```

> **Remember:** `npm install` once per project. `playwright install chromium` once per machine (or when Playwright version upgrades).

---

## 4. Project Structure

```text
topic-01-playwright-basics/
│
├── package.json            # project name + "type": "module" + dependencies
├── package-lock.json       # exact versions (auto-generated, do not edit)
├── playwright.config.js    # settings (ES6: import/export)
├── .gitignore              # files Git should ignore
│
└── tests/                  # ALL test files live here
    ├── 01-first-test.spec.js        # syntax: anatomy of one test
    ├── 02-running-tests.spec.js     # running: multiple tests in one run
    └── 03-assertions.spec.js        # expect: all assertion types
```

### 4.1 `package.json` — line by line

```json
{
  "name": "playwright-basics-topic-01",   // project name (only a label)
  "version": "1.0.0",                     // your project's version
  "type": "module",                       // ★ ES6: enable import/export in all .js files
  "scripts": {                            // shortcuts: "npm run test" == "playwright test"
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:report": "playwright show-report"
  },
  "devDependencies": {                    // tools needed ONLY for development/testing
    "@playwright/test": "^1.63.0"         // the Playwright library, version 1.63+
  }
}
```

### 4.2 `playwright.config.js` — line by line (ES6)

```js
// ES6: import instead of require
import { defineConfig, devices } from '@playwright/test';
// defineConfig → wraps your config object with default settings
// devices      → pre-made browser profiles (screen size, user agent...)

// ES6: export default instead of module.exports
export default defineConfig({
  testDir: './tests',          // WHERE to look for test files (relative to this file)
  timeout: 30000,              // each test fails if it takes longer than 30 000 ms (30 s)
  fullyParallel: true,         // run tests at the same time — each test is isolated
  retries: 0,                  // do NOT re-run failed tests (set 1 or 2 in CI later)
  reporter: 'list',            // output format: simple checklist in terminal

  use: {                       // DEFAULT settings applied to every test
    baseURL: 'https://example.com',  // page.goto('/') means https://example.com/
    trace: 'on-first-retry',         // record a debug trace if a retry fails
  },

  projects: [                  // which browsers to test on
    {
      name: 'chromium',        // label shown in the report
      use: { ...devices['Desktop Chrome'] },  // 1280x720 Chrome-like profile
    },
  ],
});
```

**Key idea — `baseURL`:**

```text
  page.goto('/')   +   baseURL: 'https://example.com'
                     --------------------------------
  actually opens  -->  https://example.com/
```

This keeps tests short and lets you change the domain in ONE place only.

---

## 5. How a Test Runs (flow diagram)

```text
npx playwright test
        |
        v
  Playwright reads playwright.config.js
        |
        v
  Finds every *.spec.js inside tests/
        |
        v
  For each test('name', fn):
        |
        +-- creates a fresh Browser
        +-- creates a fresh Page  <-- "page" fixture
        +-- runs your async function
        |       |
        |       +-- page.goto(...)     navigate
        |       +-- getByRole(...)     find element (lazy - nothing happens yet)
        |       +-- expect(...).to...  check + auto-wait up to 5 s
        |
        +-- PASS?  green ✓   /   FAIL? red ✘ + error message
        +-- closes page & browser
        |
        v
  Final summary:  "11 passed (3.6s)"
```

---

## 6. Running Tests

### 6.1 Commands

| Command | What it does |
|---------|--------------|
| `npx playwright test` | Run ALL tests |
| `npx playwright test tests/01-first-test.spec.js` | Run ONE file |
| `npx playwright test -g "exact text"` | Run tests whose name contains "exact text" |
| `npm run test:headed` | Run while WATCHING the browser (learning mode) |
| `npm run test:report` | Open the HTML report in your browser |

### 6.2 Real output — run ONE file

```bash
npx playwright test tests/01-first-test.spec.js
```

```text
Running 1 test using 1 worker

  ✓  1 [chromium] › tests/01-first-test.spec.js:18:1 › page loads and shows Example Domain heading (1.2s)

  1 passed (2.7s)
```

**How to read this:**

| Part | Meaning |
|------|---------|
| `Running 1 test using 1 worker` | 1 test, 1 browser window working on it |
| `✓` | passed |
| `[chromium]` | which browser project ran it |
| `tests/01-first-test.spec.js:18:1` | file **line : column** — jump there in your editor |
| `(1.2s)` | how long it took |
| `1 passed (2.7s)` | summary |

### 6.3 Real output — run ALL tests (the moment of truth)

```bash
npx playwright test
```

```text
Running 11 tests using 6 workers

  ✓   4 [chromium] › tests/02-running-tests.spec.js:26:1 › third check: body has readable paragraph (824ms)
  ✓   1 [chromium] › tests/01-first-test.spec.js:18:1 › page loads and shows Example Domain heading (940ms)
  ✓   3 [chromium] › tests/02-running-tests.spec.js:12:1 › first check: title contains Example (1.1s)
  ✓   2 [chromium] › tests/03-assertions.spec.js:27:3 › web-first assertions (auto-retry) › assert exact text (1.1s)
  ✓   5 [chromium] › tests/02-running-tests.spec.js:20:1 › second check: page URL is correct (1.1s)
  ✓   6 [chromium] › tests/03-assertions.spec.js:20:3 › web-first assertions (auto-retry) › assert element visibility (1.0s)
  ✓   7 [chromium] › tests/03-assertions.spec.js:33:3 › web-first assertions (auto-retry) › assert text contains substring (RegExp) (682ms)
  ✓   8 [chromium] › tests/03-assertions.spec.js:39:3 › web-first assertions (auto-retry) › assert element count (711ms)
  ✓  10 [chromium] › tests/03-assertions.spec.js:57:3 › generic assertions (no retry) › assert plain values with toBe / toContain (609ms)
  ✓  11 [chromium] › tests/03-assertions.spec.js:45:3 › web-first assertions (auto-retry) › assert page URL (667ms)
  ✓   9 [chromium] › tests/03-assertions.spec.js:50:3 › web-first assertions (auto-retry) › assert page title (776ms)

  11 passed (3.6s)
```

> **Note:** numbers like `✓ 4` may appear out of order because 6 workers run tests **in parallel** — whoever finishes first is printed first. All 11 still ran.

---

## 7. Test Files and Syntax

**File naming rule:** only files ending in `.spec.js` (or `.test.js`) are treated as tests.

```text
tests/01-first-test.spec.js   <-- collected ✅
tests/helper.js               <-- NOT a test  (ignored)
```

### 7.1 Anatomy of one test (ES6)

```js
// File: tests/01-first-test.spec.js   (open this file while reading!)

import { test, expect } from '@playwright/test';
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^ LINE A — ES6 import (not require)
//  test   = function that creates/registers a test case
//  expect = function that checks (asserts) something
//  import { a, b } from 'pkg'  is the modern way to load a library

test('page loads and shows Example Domain heading', async ({ page }) => {
//  ^^^^ LINE B — test #1 begins
//  'page loads...' = the NAME you will see in the report. Write it like a story.
//  async  = this function uses "await", so it MUST be async
//  ({ page }) = "destructure": pull `page` out of the object Playwright passes in
//               Playwright gives you a brand-new page for THIS test only

  await page.goto('/');
//  ^^^^ LINE C — go to the website
//  await = pause until navigation finishes
//  '/'   + baseURL in config = https://example.com/

  const heading = page.getByRole('heading', { level: 1 });
//  ^^^^ LINE D — FIND the <h1> element (by semantic role, not CSS)
//  Nothing is searched yet! Locators are LAZY — they only run when an
//  action or assertion uses them. That lets Playwright re-search later
//  (auto-retry) instead of grabbing a stale element.

  await expect(heading).toBeVisible();
//  ^^^^ LINE E — ASSERTION #1: is it visible on screen?
//  expect(...)   = "I expect..."
//  .toBeVisible() = "...this element to be visible"
//  await = Playwright retries for up to 5 seconds if not yet visible

  await expect(heading).toHaveText('Example Domain');
//  ^^^^ LINE F — ASSERTION #2: does it show EXACTLY this text?
//  Full-string match. Extra/missing space = FAIL.
});
// end of test
```

### 7.2 The mental model (memorize this)

```text
   LOCATOR  -->  WHERE is the element?   page.getByRole / page.locator
      |
      v
 ASSERTION -->  WHAT must be true?       expect(locator).toBeVisible()
```

You always need **both**. A locator alone does nothing. An assertion without a locator has nothing to check.

### 7.3 Other 2 test files (same pattern, more examples)

| File | What it teaches |
|------|-----------------|
| `tests/02-running-tests.spec.js` | multiple `test()` in one file; title / URL / RegExp checks |
| `tests/03-assertions.spec.js` | every common `expect` style, grouped with `test.describe` |

`test.describe` explained in one line:

```js
test.describe('web-first assertions (auto-retry)', () => {
  // purely a FOLDER for the report — tests inside still run independently
  test('assert element visibility', async ({ page }) => { /* ... */ });
  test('assert exact text', async ({ page }) => { /* ... */ });
});
```

---

## 8. Assertions (expect)

An **assertion** is the only line that can **pass or fail** your test.  
Everything else (goto, locator) is preparation.

### 8.1 Two flavors — the #1 thing to remember

```text
┌─────────────────────────────┬──────────────────────────────────────┐
│  WEB-FIRST (async, retry)   │  GENERIC (sync, no retry)           │
│  expect(locator).toHaveText │  expect(someValue).toBe(...)        │
│  expect(page).toHaveURL     │                                      │
│                              │                                      │
│  • auto-retries ~5 seconds   │  • checks ONCE, immediately          │
│  • for PAGE ELEMENTS         │  • for: page.title(), variables,     │
│  • you MUST await it         │    API JSON, numbers                 │
│                              │  • no await needed                   │
└─────────────────────────────┴──────────────────────────────────────┘
         ^^^ USE THESE MOST                      ^^^ USE FOR PLAIN DATA
```

Why retry? Web pages load slowly. An element may appear 2 seconds later — the retry absorbs that. A plain string from `page.title()` has no "later"; either you fetched it or not.

### 8.2 Assertion catalog (all in `tests/03-assertions.spec.js`)

| Assertion | Checks | Retry? | Example |
|-----------|--------|--------|---------|
| `toBeVisible()` | element shown | ✅ | `expect(h1).toBeVisible()` |
| `toHaveText('...')` | exact full text | ✅ | `expect(h1).toHaveText('Example Domain')` |
| `toContainText(/.../)` | substring / RegExp | ✅ | `expect(body).toContainText(/Example/)` |
| `toHaveCount(n)` | number of matches | ✅ | `expect(h1).toHaveCount(1)` |
| `toHaveURL('...')` | final address | ✅ | `expect(page).toHaveURL('https://example.com/')` |
| `toHaveTitle('...')` | `<title>` content | ✅ | `expect(page).toHaveTitle('Example Domain')` |
| `toBe(...)` | strict `===` | ❌ | `expect(title).toBe('Example Domain')` |
| `toContain(...)` | substring in string/array | ❌ | `expect(title).toContain('Example')` |
| `toBeTruthy()` | value is not empty/false/null | ❌ | `expect(url).toBeTruthy()` |

### 8.3 Code — web-first (ES6 copy of `03-assertions.spec.js` core)

```js
import { test, expect } from '@playwright/test';

test('assert exact text', async ({ page }) => {
  await page.goto('/');
  // EXACT match of the <h1> visible text. Retries up to 5s.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Example Domain');
});

test('assert text contains substring (RegExp)', async ({ page }) => {
  await page.goto('/');
  // /Example/ is a RegExp → PARTIAL match anywhere in the text.
  await expect(page.locator('body')).toContainText(/Example/);
});

test('assert page title', async ({ page }) => {
  await page.goto('/');              // ← never skip this!
  await expect(page).toHaveTitle('Example Domain');
});
```

### 8.4 Code — generic (no retry)

```js
test('assert plain values with toBe / toContain', async ({ page }) => {
  await page.goto('/');

  const title = await page.title();    // plain JS string — already "here", no waiting
  expect(title).toBe('Example Domain'); // === comparison
  expect(title).toContain('Example');   // substring
  expect(typeof title).toBe('string');  // sanity check on the type

  const url = page.url();
  expect(url).toBeTruthy();             // URL is non-empty
});
```

**Notice:** no `await` before generic `expect(...)` — because there is nothing to wait for.

---

## 9. What a Failing Test Looks Like

On one run during this topic, a test failed because **I forgot `page.goto('/')`**.  
This is a real, unedited failure — learning to read this is half the skill:

```text
  ✘  10 [chromium] › tests/03-assertions.spec.js:50:3 › web-first assertions (auto-retry) › assert page title (5.1s)

  1) [chromium] › tests/03-assertions.spec.js:50:3 › web-first assertions (auto-retry) › assert page title

    Error: expect(page).toHaveTitle(expected) failed

    Expected: "Example Domain"
    Received: ""
    Timeout:  5000ms

    Call log:
      - Expect "toHaveTitle" with timeout 5000ms
        14 × locator resolved to <html>…</html>
           - unexpected value ""

      49 |
      50 |   test('assert page title', async ({ page }) => {
    > 51 |     await expect(page).toHaveTitle('Example Domain');
         |                        ^
      52 |   });

  1 failed
  10 passed (7.8s)
```

**Reading the failure in 5 seconds:**

| Clue | What it tells you |
|------|-------------------|
| `Expected: "Example Domain"` | what YOUR test wanted |
| `Received: ""` | page title is EMPTY |
| `14 × locator resolved to <html>` | browser opened, but no navigation happened |
| Root cause | forgot `await page.goto('/')` |
| Fix | add `await page.goto('/')` before the assertion |

After the fix → **11 passed**. Failure is normal; the error message tells you exactly where to look.

*(An earlier real failure also showed example.com changing its paragraph text — same skill: read Expected vs Received.)*

---

## 10. Command Cheat Sheet

| I want to... | Command |
|--------------|---------|
| Install libraries | `npm install` |
| Install browser | `npx playwright install chromium` |
| Run all tests | `npx playwright test` |
| Run one file | `npx playwright test tests/01-first-test.spec.js` |
| Run by name | `npx playwright test -g "exact text"` |
| Watch the browser | `npm run test:headed` |
| Open HTML report | `npm run test:report` |
| Update browsers (later) | `npx playwright install` |

---

## 11. Real Full Output

Everything below was captured by running the commands **on this machine** with the **ES6** code.

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

### Project files (real `find` output)

```text
.
./package.json
./playwright.config.js
./tests
./tests/01-first-test.spec.js
./tests/02-running-tests.spec.js
./tests/03-assertions.spec.js
```

### Final test run — `npx playwright test`

```text
Running 11 tests using 6 workers

  ✓   4 [chromium] › tests/02-running-tests.spec.js:26:1 › third check: body has readable paragraph (824ms)
  ✓   1 [chromium] › tests/01-first-test.spec.js:18:1 › page loads and shows Example Domain heading (940ms)
  ✓   3 [chromium] › tests/02-running-tests.spec.js:12:1 › first check: title contains Example (1.1s)
  ✓   2 [chromium] › tests/03-assertions.spec.js:27:3 › web-first assertions (auto-retry) › assert exact text (1.1s)
  ✓   5 [chromium] › tests/02-running-tests.spec.js:20:1 › second check: page URL is correct (1.1s)
  ✓   6 [chromium] › tests/03-assertions.spec.js:20:3 › web-first assertions (auto-retry) › assert element visibility (1.0s)
  ✓   7 [chromium] › tests/03-assertions.spec.js:33:3 › web-first assertions (auto-retry) › assert text contains substring (RegExp) (682ms)
  ✓   8 [chromium] › tests/03-assertions.spec.js:39:3 › web-first assertions (auto-retry) › assert element count (711ms)
  ✓  10 [chromium] › tests/03-assertions.spec.js:57:3 › generic assertions (no retry) › assert plain values with toBe / toContain (609ms)
  ✓  11 [chromium] › tests/03-assertions.spec.js:45:3 › web-first assertions (auto-retry) › assert page URL (667ms)
  ✓   9 [chromium] › tests/03-assertions.spec.js:50:3 › web-first assertions (auto-retry) › assert page title (776ms)

  11 passed (3.6s)
```

---

## Quick Self-Check (answer in your head)

1. Which 2 things does every test file import? → `test`, `expect`
2. Which keyword loads them in ES6? → `import` (not `require`)
3. What line in `package.json` enables ES6? → `"type": "module"`
4. What does `await page.goto('/')` open when `baseURL` is set? → `https://example.com/`
5. Which assertion auto-retries for ~5 s? → web-first ones (`toHaveText`, `toBeVisible`, ...)
6. Which assertion checks a plain string with no retry? → `expect(value).toBe(...)`

If you answered all 6 → Topic 1 done ✅

---

## Next Topic

**Topic 2 — Locators** (`page.getByRole`, `getByTestId`, `locator`, chained locators) — coming soon.

---

*Topic 1 · Playwright Basics · ES6 JavaScript · Real output: 11 passed (3.6s) · Playwright 1.63.0*

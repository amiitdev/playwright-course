# Topic 8 — Page Object Model (POM)

> **Goal:** move locators and actions into **classes** so tests read like user stories — and when the UI changes, you fix **one file**, not fifty tests.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Website:** local Shopping App (login / home / dashboard)  
**Real results from my machine:**

| Command | Result |
|---------|--------|
| `npx playwright test` | `16 passed (7.1s)` ✅ |
| `npm run test:smoke` | `3 passed (6.0s)` ✅ |

---

## Table of Contents

1. [What is POM?](#1-what-is-pom)
2. [Without POM vs With POM](#2-without-pom-vs-with-pom)
3. [Our page classes](#3-our-page-classes)
4. [BasePage](#4-basepage)
5. [LoginPage](#5-loginpage)
6. [HomePage](#6-homepage)
7. [DashboardPage](#7-dashboardpage)
8. [Tests using POM](#8-tests-using-pom)
9. [Full flow example](#9-full-flow-example)
10. [POM rules (do / don't)](#10-pom-rules-do--dont)
11. [Real failures we fixed](#11-real-failures-we-fixed)
12. [Cheat sheet](#12-cheat-sheet)
13. [Real full output](#13-real-full-output)

---

## 1. What is POM?

**Page Object Model** = a **class per web page** that holds:

```text
  LOCATORS  →  where the elements are
  ACTIONS   →  what the user does (login, add to cart, logout)
  URL open  →  how to go to the page
```

Tests talk to the **class**, not to CSS/role selectors.

```text
  Test  ──calls──►  LoginPage.login()  ──uses──►  real selectors
                          │
                          └── only place that knows #email, getByLabel, ...
```

**Why:** UI changes → edit **one class**, tests stay the same.

---

## 2. Without POM vs With POM

### WITHOUT (selectors in every test)

```js
// test A
await page.getByLabel('Email').fill('amit@gmail.com');
await page.getByLabel('Password').fill('123456');
await page.getByRole('button', { name: 'Sign in' }).click();

// test B — same copy-paste
await page.getByLabel('Email').fill('amit@gmail.com');
await page.getByLabel('Password').fill('123456');
await page.getByRole('button', { name: 'Sign in' }).click();
```

UI renames “Email” → “Email address” → **fix 50 tests**.

### WITH POM

```js
// LoginPage.js — selectors live HERE only
this.emailInput = page.getByLabel('Email');

// tests — no selectors
await loginPage.login('amit@gmail.com', '123456');
```

UI renames label → **fix LoginPage once**.

```text
  WITHOUT:  N tests × M selectors = chaos
  WITH:     N tests call 1 class  = clean
```

---

## 3. Our page classes

```text
topic-08-pom/
├── pages/
│   ├── BasePage.js        # shared goto / title / url
│   ├── LoginPage.js       # login form
│   ├── HomePage.js        # products, cart, search
│   └── DashboardPage.js   # welcome, logout, stats
├── site/
│   ├── login.html
│   ├── index.html
│   └── dashboard.html
└── tests/
    ├── 01-login-pom.spec.js
    ├── 02-home-pom.spec.js
    └── 03-full-flow-pom.spec.js
```

**Class anatomy (every page object):**

```text
  class XxxPage extends BasePage {
    constructor(page) {
      super(page);
      this.locator1 = ...   // WHERE
      this.locator2 = ...
    }

    async open() { await this.goto('xxx.html'); }

    async doSomething() {   // WHAT user does
      await this.locator1.fill(...);
      await this.locator2.click();
    }
  }
```

---

## 4. BasePage

```js
// pages/BasePage.js
export class BasePage {
  constructor(page) {
    this.page = page;          // Playwright page for all children
  }

  async goto(path = 'index.html') {
    await this.page.goto(path);
  }

  async title() {
    return this.page.title();
  }

  async url() {
    return this.page.url();
  }
}
```

**Human check:** *"Every page can navigate and read URL/title."*

Child classes: `class LoginPage extends BasePage`.

---

## 5. LoginPage

```js
// pages/LoginPage.js
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);  // sets this.page

    // ---- LOCATORS ----
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByTestId('login-error');
    this.backHomeLink = page.getByTestId('back-home');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async open() {
    await this.goto('login.html');
    return this;   // chaining optional
  }

  // ---- small actions ----
  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  // ---- high-level action: full login ----
  async login(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }
}
```

**Two levels of actions:**

| Level | Example | When |
|-------|---------|------|
| small | `fillEmail()` | test wants step-by-step |
| high-level | `login(email, pass)` | happy path in one line |

**Human check:** *"Open login. Type email and password. Click Sign in."*

---

## 6. HomePage

```js
// pages/HomePage.js
export class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.searchInput = page.locator('#search');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.searchResult = page.getByTestId('search-result');
    this.cartCount = page.locator('#cart-count');
    this.productCards = page.locator('.product');
  }

  async open() {
    await this.goto('index.html');
    return this;
  }

  // parameterized locator — one method, any SKU
  productCard(sku) {
    return this.page.locator(`.product[data-sku="${sku}"]`);
  }

  addToCartButton(sku) {
    return this.page.locator(`.add-btn[data-sku="${sku}"]`);
  }

  async addProduct(sku) {
    await this.addToCartButton(sku).click();
  }

  async addProductTimes(sku, times) {
    for (let i = 0; i < times; i += 1) {
      await this.addProduct(sku);
    }
  }

  async search(term) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  async productCount() {
    return this.productCards.count();
  }
}
```

**Human check:** *"Add Mango to cart. Search for 'app'."*

---

## 7. DashboardPage

```js
// pages/DashboardPage.js
export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.userEmail = page.getByTestId('user-email');
    this.welcomeMsg = page.getByTestId('welcome');
    this.logoutButton = page.locator('#logout-btn');
    this.statsList = page.locator('#stats li');
  }

  async open() {
    await this.goto('dashboard.html');
    return this;
  }

  async logout() {
    await this.logoutButton.click();
    // our page redirects after 200ms — wait for it
    await this.page.waitForURL(/login\.html/);
  }
}
```

Note: **assertions can stay in the test** (using page object locators) or be wrapped as helpers. Both styles are fine.

```js
// style A — assert in test (common)
await expect(dashboard.userEmail).toHaveText('amit@gmail.com');

// style B — helper method (optional)
// await dashboard.expectWelcomeVisible();
```

---

## 8. Tests using POM

### Import the class

```js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
```

### Login test — no raw selectors

```js
test('@smoke login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboard = new DashboardPage(page);

  await loginPage.open();
  await expect(loginPage.heading).toHaveText('Login');

  await loginPage.login('amit@gmail.com', '123456');

  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(dashboard.userEmail).toHaveText('amit@gmail.com');
  await expect(dashboard.welcomeMsg).toBeVisible();
});
```

**Human check:** *"Open login. Login with Amit. Am I on dashboard with right email?"*

### Error login

```js
test('login keeps user on page when password too short', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('amit@gmail.com', '12'); // too short

  await expect(page).toHaveURL(/login\.html/);
  await expect(loginPage.errorMessage).toBeVisible();
  await expect(loginPage.errorMessage).toHaveText('Invalid email or password');
});
```

### Home cart + search

```js
test('add same product twice', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.addProductTimes('BANANA', 2);
  await expect(home.cartCount).toHaveText('Cart: 2');
});

test('search finds apple', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.search('app');
  await expect(home.searchResult).toHaveText('Found: apple');
});
```

---

## 9. Full flow example

```js
test('@smoke full journey: login → dashboard → logout', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboard = new DashboardPage(page);

  // 1) login
  await loginPage.open();
  await loginPage.login('amit@gmail.com', 'secure123');

  // 2) dashboard
  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(dashboard.heading).toHaveText('Dashboard');
  await expect(dashboard.userEmail).toHaveText('amit@gmail.com');
  await expect(dashboard.welcomeMsg).toBeVisible();
  await expect(dashboard.statsList).toHaveCount(2);

  // 3) logout (waits for login URL)
  await dashboard.logout();

  await expect(page).toHaveURL(/login\.html/);
  await expect(loginPage.heading).toHaveText('Login');
});
```

**Reads like a user story** — not like a list of CSS paths.

```text
  open login → login → check welcome → logout → back on login
```

---

## 10. POM rules (do / don't)

| ✅ DO | ❌ DON'T |
|------|---------|
| Put selectors in the page class | Repeat `getByLabel` in every test |
| High-level actions (`login()`, `addProduct`) | Expose only raw locators for everything |
| One class per page (or major component) | One giant “GodPage” for the whole app |
| Assert in the test (or thin helpers) | Hide **all** assertions so tests can’t fail clearly |
| Keep classes stable when UI changes | Change tests every time a `div` class renames |
| `new LoginPage(page)` in the test | Import Playwright `page` hacks from the class module |

```text
  POM + fixtures (Topic 7) work together:

    const login = new LoginPage(page);
    await login.login(user.email, user.pass);

  or fixture gives you authPage already logged in → skip login entirely.
```

---

## 11. Real failures we fixed

### Fail A — HTML5 blocked our error test

```text
Expected: visible
Received: hidden
Locator: getByTestId('login-error')
```

**Cause:** `<input type="email">` without `novalidate` — browser **refuses to submit** `not-an-email`, so our JS error never runs.

**Fix:**

```html
<form id="login-form" novalidate>
```

Now JS validation shows `#error` for bad email / short password.

### Fail B — asserted dashboard after failed login

```text
Expected pattern: /dashboard\.html/
Received string: ".../site/login.html"
```

**Cause:** login failed (password `12` < 4 chars) → stayed on login.  
**Fix:** assert error on login page first; only assert dashboard after **valid** login.

**Rule:** POM does not replace thinking — wrong expectations still fail (and that’s good).

---

## 12. Cheat sheet

| I want to... | Code |
|--------------|------|
| Create page object | `const login = new LoginPage(page)` |
| Open page | `await login.open()` |
| High-level action | `await login.login(email, pass)` |
| Use locator from object | `await expect(login.errorMessage).toBeVisible()` |
| Parameterized product | `home.addToCartButton('MANGO')` |
| Wait inside action | `await this.page.waitForURL(/login\.html/)` |
| Shared helpers | `class X extends BasePage` |
| File layout | `pages/LoginPage.js` + `tests/01-login.spec.js` |

**Minimal page class template:**

```js
import { BasePage } from './BasePage.js';

export class ExamplePage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.submit = page.getByRole('button', { name: 'Submit' });
  }

  async open() {
    await this.goto('example.html');
    return this;
  }

  async submitForm() {
    await this.submit.click();
  }
}
```

---

## 13. Real full output

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
./pages/BasePage.js
./pages/LoginPage.js
./pages/HomePage.js
./pages/DashboardPage.js
./site/login.html
./site/index.html
./site/dashboard.html
./tests/01-login-pom.spec.js
./tests/02-home-pom.spec.js
./tests/03-full-flow-pom.spec.js
```

### One file — `npx playwright test tests/01-login-pom.spec.js`

```text
Running 5 tests using 5 workers

  ✓  1 [chromium] › tests/01-login-pom.spec.js:48:1 › login error when email has no @ (1.9s)
  ✓  3 [chromium] › tests/01-login-pom.spec.js:58:1 › back home link from login page (1.7s)
  ✓  2 [chromium] › tests/01-login-pom.spec.js:37:1 › login keeps user on page when password too short (1.8s)
  ✓  4 [chromium] › tests/01-login-pom.spec.js:67:1 › chaining style: open() returns this (1.7s)
  ✓  5 [chromium] › tests/01-login-pom.spec.js:21:1 › @smoke login with valid credentials (1.4s)

  5 passed (6.4s)
```

### Full suite — `npx playwright test`

```text
Running 16 tests using 6 workers

  ✓   3 [chromium] › tests/01-login-pom.spec.js:67:1 › chaining style: open() returns this (1.5s)
  ✓   1 [chromium] › tests/01-login-pom.spec.js:37:1 › login keeps user on page when password too short (2.2s)
  ✓   2 [chromium] › tests/01-login-pom.spec.js:48:1 › login error when email has no @ (2.6s)
  ✓   4 [chromium] › tests/02-home-pom.spec.js:9:1 › @smoke home shows 3 products (1.7s)
  ✓   7 [chromium] › tests/02-home-pom.spec.js:18:1 › add one product to cart (1.3s)
  ✓   5 [chromium] › tests/01-login-pom.spec.js:21:1 › @smoke login with valid credentials (2.7s)
  ✓   6 [chromium] › tests/01-login-pom.spec.js:58:1 › back home link from login page (2.6s)
  ✓   8 [chromium] › tests/02-home-pom.spec.js:26:1 › add same product twice (1.2s)
  ✓   9 [chromium] › tests/02-home-pom.spec.js:34:1 › add different products (1.1s)
  ✓  12 [chromium] › tests/02-home-pom.spec.js:63:1 › product card by SKU helper (768ms)
  ✓  10 [chromium] › tests/02-home-pom.spec.js:43:1 › search finds apple (1.2s)
  ✓  11 [chromium] › tests/02-home-pom.spec.js:53:1 › search no results (951ms)
  ✓  16 [chromium] › tests/03-full-flow-pom.spec.js:68:1 › why POM — one place for URL knowledge (490ms)
  ✓  14 [chromium] › tests/03-full-flow-pom.spec.js:56:1 › failed login keeps LoginPage methods reusable (1.3s)
  ✓  15 [chromium] › tests/03-full-flow-pom.spec.js:40:1 › login then visit home from dashboard nav (1.4s)
  ✓  13 [chromium] › tests/03-full-flow-pom.spec.js:17:1 › @smoke full journey: login → dashboard → logout (1.6s)

  16 passed (7.1s)
```

### Smoke — `npm run test:smoke` / `--grep @smoke`

```text
Running 3 tests using 3 workers

  ✓  1 [chromium] › tests/01-login-pom.spec.js:21:1 › @smoke login with valid credentials (2.1s)
  ✓  3 [chromium] › tests/02-home-pom.spec.js:9:1 › @smoke home shows 3 products (1.3s)
  ✓  2 [chromium] › tests/03-full-flow-pom.spec.js:17:1 › @smoke full journey: login → dashboard → logout (3.7s)

  3 passed (6.0s)
```

---

## Quick self-check

1. POM class holds? → **locators + actions** (not test logic chaos)
2. Where should `getByLabel('Email')` live? → **LoginPage**, not every test
3. High-level action example? → `login(email, password)`
4. Shared base helpers? → `extends BasePage`
5. Parameterized product button? → `addToCartButton(sku)` method
6. Assert in class or test? → **either**; keep failures readable (often test)
7. UI label changes → fix how many files? → **one page class**

All 7 → Topic 8 done ✅

---

## Next topic

**Topic 9 — CI/CD with GitHub Actions** — run Playwright on every push — coming soon.

---

*Topic 8 · Page Object Model · ES6 · Real output: 16 passed full · 3 smoke · Playwright 1.63.0*

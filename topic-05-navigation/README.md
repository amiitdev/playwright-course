# Topic 5 — Navigation

> **Goal:** move between pages like a real browser — open URLs, **Back/Forward**, **multiple tabs**, and **popups**.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Website:** local multi-page Shopping App (`file://`)  
**Real result from my machine:** `21 passed (5.9s)` ✅

---

## Table of Contents

1. [What is navigation?](#1-what-is-navigation)
2. [Our pages for this topic](#2-our-pages-for-this-topic)
3. [Page navigation](#3-page-navigation)
4. [Back / Forward](#4-back--forward)
5. [Multiple tabs](#5-multiple-tabs)
6. [Popups](#6-popups)
7. [Navigation cheat sheet](#7-navigation-cheat-sheet)
8. [Real failure we captured](#8-real-failure-we-captured)
9. [Command cheat sheet](#9-command-cheat-sheet)
10. [Real full output](#10-real-full-output)

---

## 1. What is navigation?

**Navigation** = moving the browser from one URL to another (or opening another window).

```text
  same tab:     Home → About → Contact
                    ↑ back      forward ↑

  new tab:      click "Help (new tab)"  → tab #2 opens
  popup:        window.open(...)        → small window opens
```

**One `page` object = one tab.**

```text
  Browser context (like a Chrome profile)
        |
        +-- page  (tab 1)     ← fixture `page`
        +-- tab2  (tab 2)     ← context.newPage()  or popup
```

---

## 2. Our pages for this topic

```text
site/
├── index.html     title: Home     data-page="home"
│                  links: About, Contact, Products
│                  button: Open order summary (window.open)
│                  link: Help (new tab) target=_blank
├── about.html     title: About    → link #go-contact → Contact
├── contact.html   title: Contact
├── products.html  title: Products (3 product cards)
└── help.html      title: Help / Order summary  (popup target)
```

Every page has a marker: `<p data-page="home">` etc. — easy to assert **which** page you are on.

---

## 3. Page navigation

### 3.1 Open a URL — `page.goto`

```js
await page.goto('index.html');   // relative to baseURL = file:///.../site/

await expect(page).toHaveURL(/index\.html/);
await expect(page).toHaveTitle('Home — Shopping App');
await expect(page.getByRole('heading', { level: 1 })).toHaveText('Home');
```

**Human check:** *"Did we open the home page?"*

### 3.2 Navigate by clicking (same tab)

```js
await page.goto('index.html');
await page.getByRole('link', { name: 'About', exact: true }).click();

// toHaveURL waits until the address changes
await expect(page).toHaveURL(/about\.html/);
await expect(page).toHaveTitle('About — Shopping App');
```

### 3.3 Reload

```js
await page.goto('products.html');
await page.reload();

await expect(page).toHaveURL(/products\.html/);
await expect(page.locator('.product')).toHaveCount(3);
```

**Human check:** *"Refresh the page — still products with 3 items?"*

### 3.4 Read URL and title (plain values)

```js
await page.goto('contact.html');

const url = page.url();          // string, current address
const title = await page.title(); // string, <title> content

expect(url).toContain('contact.html');
expect(title).toBe('Contact — Shopping App');
```

Note: no `await` on `expect(...)` here — these are **generic** assertions (Topic 1).

### 3.5 `waitForURL` — arm before click

```js
await page.goto('index.html');

const urlPromise = page.waitForURL(/about\.html/);  // 1. arm
await page.getByRole('link', { name: 'About', exact: true }).click(); // 2. click
await urlPromise;                                   // 3. wait
```

Usually `await click(); await expect(page).toHaveURL(...)` is enough — both work.

### 3.6 `waitForLoadState` — page finished loading

```js
await page.goto('products.html');
await page.waitForLoadState('load');          // all resources done (default for goto)

await page.goto('about.html', { waitUntil: 'domcontentloaded' }); // HTML only (faster)
```

| Load state | Meaning | When |
|------------|---------|------|
| `domcontentloaded` | HTML parsed | early interaction |
| `load` | images/CSS/JS done | **default** for `goto` |
| `networkidle` | quiet network ~500ms | **rare** — often flaky |

### 3.7 Multi-step journey

```js
await page.goto('index.html');
await expect(page.locator('[data-page="home"]')).toBeVisible();

await page.getByRole('link', { name: 'About', exact: true }).click();
await expect(page).toHaveURL(/about\.html/);

await page.locator('#go-contact').click();
await expect(page).toHaveURL(/contact\.html/);
```

---

## 4. Back / Forward

Browser history is a **stack**:

```text
  Visit:  Home → About → Contact

  history:  [ Home , About , Contact ]
                              ^ pointer (you are here)

  goBack()     → About
  goBack()     → Home
  goForward()  → About
```

### 4.1 Back

```js
await page.goto('index.html');
await page.getByRole('link', { name: 'About', exact: true }).click();
await expect(page).toHaveURL(/about\.html/);

await page.goBack();   // browser ← Back button

await expect(page).toHaveURL(/index\.html/);
await expect(page.locator('[data-page="home"]')).toBeVisible();
```

**Human check:** *"Press Back — are we home again?"*

### 4.2 Forward

```js
await page.goBack();
await page.goForward();  // browser → Forward button

await expect(page).toHaveURL(/about\.html/);
```

### 4.3 Three pages: back, back, forward

```js
// Home → About → Contact
await page.goto('index.html');
await page.getByRole('link', { name: 'About', exact: true }).click();
await page.locator('#go-contact').click();
await expect(page).toHaveURL(/contact\.html/);

await page.goBack();  // → About
await expect(page.locator('[data-page="about"]')).toBeVisible();

await page.goBack();  // → Home
await expect(page.locator('[data-page="home"]')).toBeVisible();

await page.goForward();  // → About
await expect(page).toHaveURL(/about\.html/);
```

**Human check:** *"Walk history like a real user with the Back/Forward buttons."*

`goBack()` / `goForward()` also **auto-wait** until navigation finishes.

---

## 5. Multiple tabs

### 5.1 Model

```text
  context  (browser profile — cookies, localStorage)
      |
      +-- page   = tab 1   (your default fixture)
      +-- tab2   = tab 2   (context.newPage())
```

### 5.2 Open a second tab

```js
await page.goto('index.html');

const tab2 = await context.newPage();   // new tab
await tab2.goto('products.html');

await expect(tab2).toHaveURL(/products\.html/);
await expect(tab2.locator('[data-page="products"]')).toBeVisible();

// tab 1 still on home — unchanged
await expect(page).toHaveURL(/index\.html/);

await tab2.close();   // close tab 2 only
```

**Human check:** *"Open Products in tab 2. Is tab 1 still Home?"*

### 5.3 Two brand-new tabs

```js
const tab1 = await context.newPage();
const tab2 = await context.newPage();

await tab1.goto('about.html');
await tab2.goto('contact.html');

await expect(tab1).toHaveTitle('About — Shopping App');
await expect(tab2).toHaveTitle('Contact — Shopping App');

await tab1.close();
await tab2.close();
```

### 5.4 Navigate only in tab2

```js
await tab2.getByRole('link', { name: 'About', exact: true }).click();
await expect(tab2).toHaveURL(/about\.html/);
await tab2.goBack();
await expect(tab2).toHaveURL(/products\.html/);

// tab1 never moved
await expect(tab1).toHaveURL(/index\.html/);
```

### 5.5 Tabs share storage (same context)

```js
await tab1.goto('index.html');
await tab1.evaluate(() => localStorage.setItem('cart', 'apple'));

await tab2.goto('about.html');
const cart = await tab2.evaluate(() => localStorage.getItem('cart'));

expect(cart).toBe('apple');   // same origin + same context = same storage
```

| API | Meaning |
|-----|---------|
| `context.newPage()` | open a new tab |
| `tab.close()` | close that tab |
| `tab.bringToFront()` | focus tab (optional in tests) |
| same `context` | shared cookies + localStorage |

---

## 6. Popups

A **popup** = new window/tab opened by the page:

```text
  target="_blank" link  →  new tab  →  'popup' event
  window.open(...)      →  new tab/window  →  'popup' event
```

### 6.1 Golden order (same as network waits)

```text
  1. const p = page.waitForEvent('popup')   // arm
  2. await click / window.open trigger      // open
  3. const popup = await p                  // get new tab object
  4. await popup.waitForLoadState()
  5. await expect(popup)...
```

### 6.2 Button that calls `window.open`

```js
await page.goto('index.html');

const popupPromise = page.waitForEvent('popup');
await page.getByRole('button', { name: 'Open order summary' }).click();
const popup = await popupPromise;

await popup.waitForLoadState();
await expect(popup).toHaveURL(/help\.html/);
await expect(popup).toHaveTitle('Help / Order summary — Shopping App');
await expect(popup.getByRole('heading', { level: 1 })).toHaveText('Order summary');

// parent still home
await expect(page).toHaveURL(/index\.html/);

await popup.close();
```

**Human check:** *"Click Open order summary. Did the summary window open with total $5?"*

### 6.3 `Promise.all` (arm + click together)

```js
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('button', { name: 'Open order summary' }).click(),
]);

await popup.waitForLoadState();
await expect(popup.locator('.box')).toContainText('$5');
await popup.close();
```

### 6.4 `target="_blank"` link is also a popup

```js
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Help (new tab)' }).click();
const popup = await popupPromise;

await popup.waitForLoadState();
await expect(popup).toHaveURL(/help\.html/);
await popup.close();
```

### 6.5 Work inside the popup, then return to parent

```js
// popup has its OWN locators — treat it like any page
await expect(popup.locator('#close-me')).toBeVisible();
await expect(popup.locator('.box')).toContainText('Banana ×2');
await popup.close();

// parent still usable
await page.getByRole('link', { name: 'Products', exact: true }).click();
await expect(page).toHaveURL(/products\.html/);
```

```text
  popup = another Page object (like tab2)
  parent `page` does NOT automatically show popup content
```

---

## 7. Navigation cheat sheet

| I want to... | Code |
|--------------|------|
| Open URL | `await page.goto('about.html')` |
| Refresh | `await page.reload()` |
| Current URL | `page.url()` |
| Current title | `await page.title()` |
| Wait for address | `await expect(page).toHaveURL(/about/)` |
| Arm URL wait | `page.waitForURL(/about/)` |
| Wait load finished | `page.waitForLoadState('load')` |
| Back | `await page.goBack()` |
| Forward | `await page.goForward()` |
| New tab | `const tab2 = await context.newPage()` |
| Close tab | `await tab2.close()` |
| Catch popup | `page.waitForEvent('popup')` **before** click |
| Popup + click together | `Promise.all([waitForEvent, click])` |

**Remember:**

```text
  one page object = one tab
  popup content lives on the NEW page object, not the parent
  arm events BEFORE the click (popup, URL, response)
```

---

## 8. Real failure we captured

Wrong way: open popup, then look for popup content **on the parent page**.

```text
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-page="help"]')
Expected: visible
Timeout: 500ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('[data-page="help"]') with timeout 500ms
  - waiting for locator('[data-page="help"]')
```

**Why:** `[data-page="help"]` exists only in **help.html** (the popup tab).  
Parent `page` is still Home — element not found.

**Fix:**

```js
const popupPromise = page.waitForEvent('popup');
await page.getByRole('button', { name: 'Open order summary' }).click();
const popup = await popupPromise;

await expect(popup.locator('[data-page="help"]')).toBeVisible();  // ✅ on popup
```

---

## 9. Command cheat sheet

| I want to... | Command |
|--------------|---------|
| Install libraries | `npm install` |
| Install browser | `npx playwright install chromium` |
| Run all tests | `npx playwright test` |
| Run one file | `npx playwright test tests/04-popups.spec.js` |
| Run by name | `npx playwright test -g "goBack"` |
| Watch browser | `npm run test:headed` |
| Open report | `npm run test:report` |

---

## 10. Real full output

Captured on this machine (ES6 + local multi-page site).

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
./site/about.html
./site/contact.html
./site/products.html
./site/help.html
./tests/01-page-navigation.spec.js
./tests/02-back-forward.spec.js
./tests/03-multiple-tabs.spec.js
./tests/04-popups.spec.js
```

### One file — `npx playwright test tests/04-popups.spec.js`

```text
Running 5 tests using 5 workers

  ✓  1 [chromium] › tests/04-popups.spec.js:43:1 › popup via Promise.all — arm + click together (1.4s)
  ✓  3 [chromium] › tests/04-popups.spec.js:73:1 › interact inside the popup (1.3s)
  ✓  4 [chromium] › tests/04-popups.spec.js:18:1 › button window.open — capture popup (1.4s)
  ✓  2 [chromium] › tests/04-popups.spec.js:59:1 › target=_blank link is also a popup event (1.4s)
  ✓  5 [chromium] › tests/04-popups.spec.js:94:1 › no popup leaks — parent page stays usable (1.3s)

  5 passed (4.9s)
```

### All tests — `npx playwright test`

```text
Running 21 tests using 6 workers

  ✓   1 [chromium] › tests/01-page-navigation.spec.js:53:1 › page.url() and page.title() — plain values (889ms)
  ✓   3 [chromium] › tests/01-page-navigation.spec.js:29:1 › goto another page by clicking link (1.4s)
  ✓   6 [chromium] › tests/01-page-navigation.spec.js:21:1 › goto home page (1.2s)
  ✓   5 [chromium] › tests/01-page-navigation.spec.js:64:1 › waitForURL — wait until address changes (1.3s)
  ✓   2 [chromium] › tests/01-page-navigation.spec.js:75:1 › waitForLoadState — page finished loading (1.5s)
  ✓   4 [chromium] › tests/01-page-navigation.spec.js:41:1 › reload — page still works (1.6s)
  ✓   9 [chromium] › tests/02-back-forward.spec.js:20:1 › goBack — return to previous page (922ms)
  ✓   7 [chromium] › tests/01-page-navigation.spec.js:87:1 › multi-step journey: home → about → contact (1.5s)
  ✓  11 [chromium] › tests/02-back-forward.spec.js:70:1 › goBack after clicking link on same tab (900ms)
  ✓   8 [chromium] › tests/02-back-forward.spec.js:32:1 › goForward — go again to next page (1.2s)
  ✓  12 [chromium] › tests/03-multiple-tabs.spec.js:24:1 › context.newPage — open a second tab (891ms)
  ✓  16 [chromium] › tests/03-multiple-tabs.spec.js:99:1 › tabs share the same browser context (storage) (516ms)
  ✓  13 [chromium] › tests/03-multiple-tabs.spec.js:43:1 › two tabs side by side — different pages (821ms)
  ✓  14 [chromium] › tests/03-multiple-tabs.spec.js:61:1 › link with target=_blank opens a new tab (popup) (723ms)
  ✓  10 [chromium] › tests/02-back-forward.spec.js:46:1 › back and forth through 3 pages (1.8s)
  ✓  17 [chromium] › tests/04-popups.spec.js:18:1 › button window.open — capture popup (686ms)
  ✓  15 [chromium] › tests/03-multiple-tabs.spec.js:79:1 › navigate in tab2 without breaking tab1 (1.0s)
  ✓  18 [chromium] › tests/04-popups.spec.js:43:1 › popup via Promise.all — arm + click together (511ms)
  ✓  20 [chromium] › tests/04-popups.spec.js:73:1 › interact inside the popup (470ms)
  ✓  19 [chromium] › tests/04-popups.spec.js:59:1 › target=_blank link is also a popup event (530ms)
  ✓  21 [chromium] › tests/04-popups.spec.js:94:1 › no popup leaks — parent page stays usable (496ms)

  21 passed (5.9s)
```

---

## Quick self-check

1. One `page` object =? → **one tab**
2. Open new empty tab? → `context.newPage()`
3. Browser Back? → `page.goBack()`
4. Browser Forward? → `page.goForward()`
5. Catch a popup — order? → **waitForEvent → click → await popup**
6. Where is popup HTML? → on the **new** page object, not parent
7. `target="_blank"` fires which event? → **popup**

All 7 → Topic 5 done ✅

---

## Next topic

**Topic 6 — Page Object Model (POM)** — clean structure for locators & actions — coming soon.

---

*Topic 5 · Navigation · ES6 · Real output: 21 passed (5.9s) · Playwright 1.63.0*

# Topic 6 — Assertions

> **Goal:** deeply learn **how to prove the page is correct** — text, URL, visibility, and element state.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Website:** local Shopping App  
**Real result from my machine:** `36 passed (12.1s)` ✅

> You met basic `expect` in Topic 1. This topic goes **deeper** on the 4 skills you use every day at work.

---

## Table of Contents

1. [Assertions = the pass/fail line](#1-assertions--the-passfail-line)
2. [Our pages](#2-our-pages)
3. [Text validation](#3-text-validation)
4. [URL validation](#4-url-validation)
5. [Visibility checks](#5-visibility-checks)
6. [Element state checks](#6-element-state-checks)
7. [Which assertion should I use?](#7-which-assertion-should-i-use)
8. [Real failures we captured](#8-real-failures-we-captured)
9. [Assertion cheat sheet](#9-assertion-cheat-sheet)
10. [Command cheat sheet](#10-command-cheat-sheet)
11. [Real full output](#11-real-full-output)

---

## 1. Assertions = the pass/fail line

```text
  goto / locator / click  →  preparation
                |
                v
  expect(...)             →  ONLY place that can PASS or FAIL
```

**Two flavors (same as Topic 1):**

| Kind | Example | Retry? |
|------|---------|--------|
| **Web-first** (page) | `expect(locator).toHaveText(...)` | ✅ ~5s |
| **Generic** (JS value) | `expect(url).toBe('...')` | ❌ once |

Almost everything in this topic is **web-first** → always `await`.

---

## 2. Our pages

```text
site/
├── index.html       # text boxes, visibility demos, form states
├── products.html    # ?sort=price query + # hash URL demos
└── checkout.html    # button enable/disable + message appears
```

**Markers on index.html:**

| Element | Purpose |
|---------|---------|
| `#success-msg` → `Order confirmed!` | exact text |
| `#order-id` → `Order ID: ORD-10024` | contains text / regex |
| `#price` → `$42.00` | regex |
| `#cart-list li` × 3 | count + item text |
| `#visible-box` / `#hidden-box` | visibility |
| `#save-btn` / `#delete-btn` (disabled) | enabled/disabled |
| `#agree` (checked) / `#newsletter` | checkbox state |
| `#email` / `#locked` (readonly) | focus + editable |
| nav links | URL path / query / hash |

---

## 3. Text validation

**Human check:** *"Do I see these exact words? Or do these words exist somewhere?"*

### 3.1 `toHaveText` — exact full string

```js
await page.goto('index.html');

await expect(page.locator('#success-msg')).toHaveText('Order confirmed!');
await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome Amit');
```

| | |
|--|--|
| Page says | `Order confirmed!` |
| Test wants | `Order confirmed` (no `!`) |
| Result | ❌ FAIL |

### 3.2 `toContainText` — piece inside bigger text

```js
// full: "Order ID: ORD-10024"
await expect(page.locator('#order-id')).toContainText('ORD-10024');
await expect(page.locator('#order-id')).toContainText('Order ID');
```

```text
  toHaveText      =  entire string must match 100%
  toContainText   =  find this piece inside  =  enough
```

### 3.3 RegExp (patterns)

```js
// $42.00 → money format
await expect(page.locator('#price')).toHaveText(/^\$\d+\.\d{2}$/);

// ORD-#####
await expect(page.locator('#order-id')).toContainText(/ORD-\d+/);
```

### 3.4 Case-insensitive

```js
// page: "...placed successfully."
await expect(page.locator('[data-testid="tagline"]')).toContainText(/successfully/i);
```

### 3.5 Lists — count + each row

```js
const items = page.locator('#cart-list li');

await expect(items).toHaveCount(3);
await expect(items.nth(0)).toHaveText('Apple ×2');
await expect(items.nth(1)).toHaveText('Banana ×1');
await expect(items.nth(2)).toHaveText('Mango ×3');
```

### 3.6 Text changes after click (auto-retry)

```js
await page.goto('checkout.html');
await expect(page.locator('#step')).toHaveText('Step 1 of 2 — enter details');

await page.locator('#pay-btn').click();

await expect(page.locator('#step')).toHaveText('Step 2 of 2 — complete');
await expect(page.locator('#done')).toHaveText('Payment successful! Thank you.');
```

**Human check:** *"After Pay, does the success message show the right words?"*

### 3.7 Negative text

```js
await expect(page.locator('#status')).not.toHaveText('error');
await expect(page.locator('#success-msg')).not.toContainText('failed');
```

---

## 4. URL validation

**Human check:** *"What address is in the address bar?"*

### 4.1 Path (RegExp — best for local files)

```js
await page.goto('index.html');
await expect(page).toHaveURL(/index\.html/);

await page.getByRole('link', { name: 'Products', exact: true }).click();
await expect(page).toHaveURL(/products\.html/);
```

> Local `file://` URLs contain your computer path — **prefer RegExp** over the full string.

### 4.2 Query string `?sort=price`

```js
await page.goto('products.html?sort=price');

await expect(page).toHaveURL(/products\.html\?sort=price/);
await expect(page.locator('#sort-info')).toHaveText('Sort: price');
```

Via link:

```js
await page.getByRole('link', { name: 'Products (sorted)' }).click();
await expect(page).toHaveURL(/sort=price/);
```

### 4.3 Hash `#footer`

```js
await page.goto('index.html#footer');
await expect(page).toHaveURL(/#footer$/);

// or by link
await page.getByRole('link', { name: 'Home #footer' }).click();
await expect(page).toHaveURL(/#footer/);
```

### 4.4 `page.url()` — plain value

```js
await page.goto('checkout.html');
const url = page.url();
expect(url).toContain('checkout.html');  // generic, no await
```

### 4.5 Journey with back

```js
await page.goto('index.html');
await page.getByRole('link', { name: 'Checkout' }).click();
await expect(page).toHaveURL(/checkout\.html/);

await page.goBack();
await expect(page).toHaveURL(/index\.html/);
```

### 4.6 Must NOT be on wrong page

```js
await page.goto('products.html');
await expect(page).not.toHaveURL(/checkout\.html/);
```

| Need | Use |
|------|-----|
| path / query / hash | `toHaveURL(/pattern/)` |
| stable absolute http URL | `toHaveURL('https://app.com/x')` |
| use the value in code | `page.url()` |

---

## 5. Visibility checks

**Human check:** *"Can a user see this on screen?"*

### 5.1 What “visible” means

```text
  VISIBLE  =  in DOM  +  has size (w>0, h>0)  +  not display:none
              +  not visibility:hidden

  HIDDEN   =  display:none  OR  visibility:hidden  OR  removed from DOM
```

### 5.2 Examples

```js
await page.goto('index.html');

// shown normally
await expect(page.locator('#visible-box')).toBeVisible();

// class="hidden-box" → display:none
await expect(page.locator('#hidden-box')).toBeHidden();
await expect(page.locator('#hidden-box')).not.toBeVisible();

// style="visibility: hidden" → also NOT visible
await expect(page.locator('#empty-box')).not.toBeVisible();
```

### 5.3 Appears after action

```js
await expect(page.locator('#flash-msg')).toBeHidden();

await page.locator('#show-btn').click();

await expect(page.locator('#flash-msg')).toBeVisible();
await expect(page.locator('#status')).toHaveText('status: shown');
```

### 5.4 Hidden until step done (checkout)

```js
await page.goto('checkout.html');
await expect(page.locator('#done')).toBeHidden();  // before pay

await page.locator('#pay-btn').click();
await expect(page.locator('#done')).toBeVisible(); // after pay
```

### 5.5 `:visible` filter (advanced)

```js
await expect(page.locator('#cart-list li:visible')).toHaveCount(3);
```

| Matcher | Question |
|---------|----------|
| `toBeVisible()` | user can see it? |
| `toBeHidden()` | not shown (either CSS hidden **or** gone) |
| `not.toBeVisible()` | must not be shown |

---

## 6. Element state checks

**Human check:** *"Can I click it? Is it ticked? Does it have focus? What’s inside?"*

### 6.1 Enabled / Disabled

```js
await page.goto('index.html');

await expect(page.locator('#save-btn')).toBeEnabled();    // can click
await expect(page.locator('#delete-btn')).toBeDisabled(); // has disabled attr
```

After action:

```js
await page.goto('checkout.html');
await expect(page.locator('#pay-btn')).toBeEnabled();

await page.locator('#pay-btn').click();

await expect(page.locator('#pay-btn')).toBeDisabled();  // JS disabled it
```

### 6.2 Checkbox

```js
// HTML: agree checked, newsletter not
await expect(page.locator('#agree')).toBeChecked();
await expect(page.locator('#newsletter')).not.toBeChecked();

await page.locator('#newsletter').check();
await expect(page.locator('#newsletter')).toBeChecked();
```

### 6.3 Focus

```js
await page.locator('#email').focus();
await expect(page.locator('#email')).toBeFocused();

await page.keyboard.press('Tab');
await expect(page.locator('#locked')).toBeFocused();
await expect(page.locator('#email')).not.toBeFocused();
```

### 6.4 Value inside input

```js
await expect(page.locator('#qty')).toHaveValue('5');
await page.locator('#qty').fill('12');
await expect(page.locator('#qty')).toHaveValue('12');
```

### 6.5 Editable vs readonly

```js
await expect(page.locator('#email')).toBeEditable();

// readonly → visible but user cannot type
await expect(page.locator('#locked')).not.toBeEditable();
await expect(page.locator('#locked')).toHaveValue('read only value');
```

### 6.6 HTML attributes

```js
await expect(page.locator('#delete-btn')).toHaveAttribute('disabled', '');
await expect(page.locator('#agree')).toHaveAttribute('type', 'checkbox');
await expect(page.locator('#email')).toHaveAttribute('placeholder', 'you@example.com');
await expect(page.locator('[data-testid="tagline"]')).toHaveAttribute('data-testid', 'tagline');
```

### 6.7 Full story (state + text + URL together)

```js
await page.goto('checkout.html');

// before
await expect(page.locator('#pay-btn')).toBeEnabled();
await expect(page.locator('#done')).toBeHidden();
await expect(page.locator('#step')).toHaveText('Step 1 of 2 — enter details');

await page.locator('#pay-btn').click();

// after
await expect(page.locator('#pay-btn')).toBeDisabled();
await expect(page.locator('#done')).toBeVisible();
await expect(page.locator('#done')).toHaveText('Payment successful! Thank you.');
await expect(page).toHaveURL(/checkout\.html/);
```

| Matcher | Question |
|---------|----------|
| `toBeEnabled()` | can click? |
| `toBeDisabled()` | blocked? |
| `toBeChecked()` | checkbox/radio ON? |
| `toBeFocused()` | has keyboard focus? |
| `toBeEditable()` | can type? |
| `toHaveValue(v)` | what’s inside input? |
| `toHaveAttribute(n,v)` | HTML attribute? |

---

## 7. Which assertion should I use?

```text
  User reads words?          →  toHaveText / toContainText
  Address bar correct?       →  toHaveURL(/.../)
  On screen?                 →  toBeVisible / toBeHidden
  Can interact?              →  toBeEnabled / toBeEditable
  Choice made?               →  toBeChecked
  Input filled?              →  toHaveValue
  HTML property?             →  toHaveAttribute
```

**Most used at work (top 5):**

1. `toBeVisible()`
2. `toHaveText()` / `toContainText()`
3. `toHaveURL()`
4. `toBeEnabled()`
5. `toBeChecked()`

---

## 8. Real failures we captured

### Fail 1 — exact text missing the `!`

```text
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#success-msg')
Expected: "Order confirmed"
Received: "Order confirmed!"
Timeout:  5000ms

13 × locator resolved to <p ...>Order confirmed!</p>
```

| | |
|--|--|
| Expected | `Order confirmed` |
| Received | `Order confirmed!` |
| Fix | include `!` **or** use `toContainText('Order confirmed')` |

### Fail 2 — wrong state (expected disabled, actually enabled)

```text
Error: expect(locator).toBeDisabled() failed

Locator:  locator('#save-btn')
Expected: disabled
Received: enabled
Timeout:  200ms
```

| | |
|--|--|
| Expected | disabled |
| Received | enabled |
| Fix | `#save-btn` has no `disabled` — use `#delete-btn` or change assertion |

### Fail 3 — strict mode (two `.muted` elements)

```text
strict mode violation: locator('.muted') resolved to 2 elements:
  1) We ship apples and bananas every day.
  2) Tab order: email → locked → name → qty
```

**Fix:** `page.locator('p.muted').first()` or a more specific selector.

**Rule:** always read **Expected vs Received** first.

---

## 9. Assertion cheat sheet

| Category | Assertion | Notes |
|----------|-----------|-------|
| Text | `toHaveText('...')` | exact |
| Text | `toContainText('...')` | partial |
| Text | `toHaveText(/re/)` | pattern |
| Text | `toHaveCount(n)` | how many |
| URL | `toHaveURL(/path/)` | RegExp best |
| URL | `page.url()` | get value |
| Visible | `toBeVisible()` | on screen |
| Visible | `toBeHidden()` | not on screen / gone |
| State | `toBeEnabled()` / `toBeDisabled()` | clickable? |
| State | `toBeChecked()` | checkbox/radio |
| State | `toBeFocused()` | keyboard focus |
| State | `toBeEditable()` | not readonly |
| State | `toHaveValue('...')` | input value |
| Attr | `toHaveAttribute('type','checkbox')` | HTML attr |
| Title | `toHaveTitle('...')` | tab name |
| Negative | `not.toBeVisible()` etc. | must NOT be true |

---

## 10. Command cheat sheet

| I want to... | Command |
|--------------|---------|
| Install libraries | `npm install` |
| Install browser | `npx playwright install chromium` |
| Run all tests | `npx playwright test` |
| Run one file | `npx playwright test tests/03-visibility.spec.js` |
| Run by name | `npx playwright test -g "toBeFocused"` |
| Watch browser | `npm run test:headed` |
| Open report | `npm run test:report` |

---

## 11. Real full output

Captured on this machine (ES6 + local site).

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
./site/products.html
./site/checkout.html
./tests/01-text-validation.spec.js
./tests/02-url-validation.spec.js
./tests/03-visibility.spec.js
./tests/04-element-state.spec.js
```

### One file — `npx playwright test tests/04-element-state.spec.js`

```text
Running 11 tests using 6 workers

  ✓   1 [chromium] › tests/04-element-state.spec.js:22:1 › toBeEnabled — Save button can be clicked (1.2s)
  ✓   4 [chromium] › tests/04-element-state.spec.js:79:1 › Tab moves focus — then assert (1.9s)
  ✓   5 [chromium] › tests/04-element-state.spec.js:29:1 › state changes after action (2.1s)
  ✓   7 [chromium] › tests/04-element-state.spec.js:93:1 › toHaveValue — input content (2.4s)
  ✓   3 [chromium] › tests/04-element-state.spec.js:68:1 › toBeFocused — element has keyboard focus (1.9s)
  ✓   6 [chromium] › tests/04-element-state.spec.js:40:1 › click only works on enabled (implicit) (3.2s)
  ✓   2 [chromium] › tests/04-element-state.spec.js:51:1 › toBeChecked / not.toBeChecked (4.2s)
  ✓   9 [chromium] › tests/04-element-state.spec.js:114:1 › toHaveAttribute — HTML attribute itself (1.1s)
  ✓   8 [chromium] › tests/04-element-state.spec.js:102:1 › toBeEditable vs readonly (1.6s)
  ✓  10 [chromium] › tests/04-element-state.spec.js:123:1 › placeholder + input type via attributes (1.2s)
  ✓  11 [chromium] › tests/04-element-state.spec.js:133:1 › full state story on checkout (1.2s)

  11 passed (9.3s)
```

### All tests — `npx playwright test`

```text
Running 36 tests using 6 workers

  ✓   1 [chromium] › tests/01-text-validation.spec.js:44:1 › case-insensitive contains (1.2s)
  ✓   5 [chromium] › tests/01-text-validation.spec.js:34:1 › RegExp — pattern matching for text (1.4s)
  ✓   2 [chromium] › tests/01-text-validation.spec.js:25:1 › toContainText — substring only (1.7s)
  ✓   6 [chromium] › tests/01-text-validation.spec.js:66:1 › heading + paragraph combo (1.6s)
  ✓   3 [chromium] › tests/01-text-validation.spec.js:17:1 › toHaveText — exact full string (1.7s)
  ✓   4 [chromium] › tests/01-text-validation.spec.js:51:1 › list items — count + each item text (1.7s)
  ✓   7 [chromium] › tests/01-text-validation.spec.js:75:1 › text changes after action (auto-retry) (1.1s)
  ✓   9 [chromium] › tests/02-url-validation.spec.js:16:1 › toHaveURL with RegExp — current page path (1.1s)
  ✓  11 [chromium] › tests/02-url-validation.spec.js:28:1 › URL with query string ?sort=price (1.1s)
  ✓   8 [chromium] › tests/01-text-validation.spec.js:88:1 › NOT equal — ensure text is NOT wrong (1.8s)
  ✓  10 [chromium] › tests/02-url-validation.spec.js:21:1 › toHaveURL after clicking link (2.1s)
  ✓  14 [chromium] › tests/02-url-validation.spec.js:57:1 › page.url() plain value + generic expect (1.3s)
  ✓  12 [chromium] › tests/02-url-validation.spec.js:38:1 › query string via link click (2.3s)
  ✓  17 [chromium] › tests/02-url-validation.spec.js:87:1 › NOT on wrong page (728ms)
  ✓  13 [chromium] › tests/02-url-validation.spec.js:46:1 › hash / fragment URL #footer (2.6s)
  ✓  15 [chromium] › tests/02-url-validation.spec.js:65:1 › exact full URL string (works for http, rare for file://) (1.7s)
  ✓  20 [chromium] › tests/03-visibility.spec.js:38:1 › visibility:hidden is also NOT visible (771ms)
  ✓  18 [chromium] › tests/03-visibility.spec.js:20:1 › toBeVisible — normal element on screen (1.4s)
  ✓  19 [chromium] › tests/03-visibility.spec.js:30:1 › toBeHidden — display:none element (954ms)
  ✓  21 [chromium] › tests/03-visibility.spec.js:46:1 › action makes element visible (auto-retry) (1.1s)
  ✓  22 [chromium] › tests/03-visibility.spec.js:59:1 › hidden then re-hidden after flow (1.0s)
  ✓  16 [chromium] › tests/02-url-validation.spec.js:75:1 › redirect-style journey with URL checks (3.1s)
  ✓  25 [chromium] › tests/03-visibility.spec.js:88:1 › NOT visible must stay true when we do nothing (581ms)
  ✓  23 [chromium] › tests/03-visibility.spec.js:69:1 › locator with :visible filter (advanced) (1.2s)
  ✓  24 [chromium] › tests/03-visibility.spec.js:79:1 › multiple elements — first visible (1.2s)
  ✓  27 [chromium] › tests/04-element-state.spec.js:29:1 › state changes after action (713ms)
  ✓  26 [chromium] › tests/04-element-state.spec.js:22:1 › toBeEnabled — Save button can be clicked (969ms)
  ✓  29 [chromium] › tests/04-element-state.spec.js:51:1 › toBeChecked / not.toBeChecked (930ms)
  ✓  28 [chromium] › tests/04-element-state.spec.js:40:1 › click only works on enabled (implicit) (1.1s)
  ✓  31 [chromium] › tests/04-element-state.spec.js:79:1 › Tab moves focus — then assert (793ms)
  ✓  30 [chromium] › tests/04-element-state.spec.js:68:1 › toBeFocused — element has keyboard focus (908ms)
  ✓  33 [chromium] › tests/04-element-state.spec.js:102:1 › toBeEditable vs readonly (614ms)
  ✓  32 [chromium] › tests/04-element-state.spec.js:93:1 › toHaveValue — input content (749ms)
  ✓  34 [chromium] › tests/04-element-state.spec.js:114:1 › toHaveAttribute — HTML attribute itself (529ms)
  ✓  35 [chromium] › tests/04-element-state.spec.js:123:1 › placeholder + input type via attributes (612ms)
  ✓  36 [chromium] › tests/04-element-state.spec.js:133:1 › full state story on checkout (872ms)

  36 passed (12.1s)
```

*(Terminal order varies because 6 workers run in parallel — all 36 passed.)*

---

## Quick self-check

1. Exact full sentence? → `toHaveText`
2. Piece of words inside? → `toContainText`
3. Address bar? → `toHaveURL(/.../)`
4. `display:none`? → `toBeHidden` / `not.toBeVisible`
5. Button can be clicked? → `toBeEnabled`
6. Checkbox ticked? → `toBeChecked`
7. Input has focus? → `toBeFocused`
8. Typing allowed? → `toBeEditable`
9. Why Fail “Order confirmed” vs “Order confirmed!”? → **exact match requires `!`**

All 9 → Topic 6 done ✅

---

## Next topic

**Topic 7 — Page Object Model (POM)** — organize locators & actions cleanly — coming soon.

---

*Topic 6 · Assertions · ES6 · Real output: 36 passed (12.1s) · Playwright 1.63.0*

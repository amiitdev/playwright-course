# Topic 2 — Locators (Very Important)

> **Goal:** learn **how to FIND elements** on a page. Locators are the most important skill in Playwright — every test starts with one.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Website:** our local Shopping App (same style as Topic 1)  
**Real result from my machine:** `30 passed (6.5s)` ✅

---

## Table of Contents

1. [What is a locator?](#1-what-is-a-locator)
2. [Our pages for this topic](#2-our-pages-for-this-topic)
3. [Which locator should I use? (order)](#3-which-locator-should-i-use-order)
4. [getByRole()](#4-getbyrole)
5. [getByText()](#5-getbytext)
6. [getByLabel()](#6-getbylabel)
7. [getByPlaceholder()](#7-getbyplaceholder)
8. [CSS selectors](#8-css-selectors)
9. [XPath (basic only)](#9-xpath-basic-only)
10. [Strict mode — when 2 elements match](#10-strict-mode--when-2-elements-match)
11. [Locator cheat sheet](#11-locator-cheat-sheet)
12. [Command cheat sheet](#12-command-cheat-sheet)
13. [Real full output](#13-real-full-output)

---

## 1. What is a locator?

```text
  page.locator(...)  =  "FIND this element for me later"
              |
              v
  expect(...).toBeVisible()  =  now CHECK something about it
  element.click()            =  now DO something with it
```

**Analogy:**

| Real life | Playwright |
|-----------|------------|
| "Find the blue button on the form" | `getByRole('button', { name: 'Place order' })` |
| "Find the box where I type email" | `getByLabel('Email address')` |
| "Find the price under Apple" | `#product-apple .price` |

**Mental model (same as Topic 1):**

```text
   LOCATOR  -->  WHERE is it?
      |
      v
 ASSERTION / ACTION  -->  CHECK or CLICK
```

---

## 2. Our pages for this topic

### Home — `site/index.html`

```html
<title>Shopping App</title>

<h1>Welcome Amit</h1>

<nav>
  <a href="index.html">Home</a>
  <a href="products.html">Products</a>
  <a href="form.html">Checkout</a>
</nav>

<h2>Products</h2>
<p class="muted">Choose something you like.</p>

<div class="product-card" id="product-apple">
  <h3>Apple</h3>
  <span class="price">$1</span>
  <button type="button">Add to cart</button>
</div>

<div class="product-card" id="product-banana">
  <h3>Banana</h3>
  <span class="price">$2</span>
  <button type="button">Add to cart</button>
</div>

<ul id="cart-items">
  <li>Mango</li>
  <li>Papaya</li>
</ul>

<button class="primary" type="button">Place order</button>
```

### Checkout form — `site/form.html`

```html
<label for="email">Email address</label>
<input id="email" placeholder="you@example.com" />

<label for="password">Password</label>
<input id="password" placeholder="Enter password" />

<label for="promo">Promo code (optional)</label>
<input id="promo" placeholder="SUMMER10" />

<label for="qty">Quantity</label>
<input id="qty" placeholder="How many?" />

<button type="submit">Place order</button>
```

**Notice:** every element is here **on purpose** — one locator type needs each of them.

---

## 3. Which locator should I use? (order)

Playwright recommends this order — **learn top to bottom**:

```text
  1. getByRole()        ← BEST — semantic, readable, stable
  2. getByText()        ← when you see words on screen
  3. getByLabel()       ← form inputs that have a label
  4. getByPlaceholder() ← form inputs with gray hint text
  5. CSS selectors      ← classic #id .class tag
  6. XPath              ← basic only — for old tests / interviews
```

```text
  Why role first?

  <h1>Welcome Amit</h1>
       |
       +--> role = "heading"   (screen reader also calls it this)
       +--> survives CSS class renames
       +--> reads like English in your test
```

---

## 4. `getByRole()`

**Finds an element by its accessibility role** (how browsers/screen readers describe it).

| HTML | Role |
|------|------|
| `<h1>`, `<h2>`, `<h3>` | `heading` |
| `<button>` | `button` |
| `<a>` | `link` |
| `<p>` | `paragraph` (or use text) |
| `<input>` (textbox) | `textbox` |

### 4.1 Heading by level

Page has **one** `<h1>Welcome Amit</h1>`:

```js
const h1 = page.getByRole('heading', { level: 1 });

await expect(h1).toBeVisible();           // can I see it?
await expect(h1).toHaveText('Welcome Amit'); // exact text?
```

**Human check:** *"Find the level-1 heading."* → the big title ✅

### 4.2 Heading by name (text)

```js
const products = page.getByRole('heading', {
  level: 2,
  name: 'Products',     // the words inside the heading
});

await expect(products).toHaveText('Products');
```

### 4.3 Links

```js
await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
await expect(page.getByRole('link', { name: 'Checkout' })).toBeVisible();
```

**Human check:** *"Find the link that says Home."*

### 4.4 Buttons

**Unique name — easy:**

```js
// Only ONE button says "Place order"
const placeOrder = page.getByRole('button', { name: 'Place order' });
await expect(placeOrder).toBeVisible();
```

**Same name twice — need `.first()`:**

```js
// TWO buttons say "Add to cart" (Apple card + Banana card)
const addButtons = page.getByRole('button', { name: 'Add to cart' });

await expect(addButtons).toHaveCount(2);        // count both
await expect(addButtons.first()).toBeVisible();  // check the first one
```

### 4.5 Click by role (real action)

```js
await page.goto('form.html');
await page.getByRole('button', { name: 'Place order' }).click();
await expect(page.locator('#msg')).toHaveText('Order placed! Thank you.');
```

---

## 5. `getByText()`

**Finds an element by the text you can see.**

### 5.1 Exact simple text

```js
// <p>Choose something you like.</p>
const tagline = page.getByText('Choose something you like.');
await expect(tagline).toBeVisible();
await expect(tagline).toHaveText('Choose something you like.');
```

### 5.2 Product name

```js
// <h3>Apple</h3>
const apple = page.getByText('Apple');
await expect(apple).toHaveText('Apple');
```

### 5.3 RegExp — partial / ignore case

```js
// contains "something", case does not matter
const line = page.getByText(/something/i);
await expect(line).toBeVisible();
```

### 5.4 List items

```js
await expect(page.getByText('Mango')).toBeVisible();
await expect(page.getByText('Papaya')).toBeVisible();
```

### 5.5 `exact: true`

```js
// Without exact, short text may match too much.
// With exact, the full text must match.
const apple = page.getByText('Apple', { exact: true });
await expect(apple).toHaveText('Apple');
```

**Human check:** *"Find whatever shows these words."*

| | |
|--|--|
| Good for | labels, messages, list items, headings |
| Risky when | many elements share partial words → use `{ exact: true }` or a role |

---

## 6. `getByLabel()`

**Finds a form input from its visible label.**

HTML:

```html
<label for="email">Email address</label>
<input id="email" type="email" placeholder="you@example.com" />
```

Test:

```js
const email = page.getByLabel('Email address');

await email.fill('amit@gmail.com');
await expect(email).toHaveValue('amit@gmail.com');
```

**Human check:** *"Click on the box that says Email address."*

More fields:

```js
await page.getByLabel('Password').fill('123456');
await page.getByLabel('Quantity').fill('3');

await expect(page.getByLabel('Quantity')).toHaveValue('3');
```

**New matcher used here:**

| Matcher | Checks |
|---------|--------|
| `toHaveValue('...')` | what is typed **inside** an input right now |

**When to use:** almost every real form field has a label → use this first for forms.

---

## 7. `getByPlaceholder()`

**Finds an input from the gray hint text inside it.**

HTML:

```html
<input id="promo" placeholder="SUMMER10" />
```

Test:

```js
const promo = page.getByPlaceholder('SUMMER10');
await promo.fill('WINTER20');
await expect(promo).toHaveValue('WINTER20');
```

More:

```js
await page.getByPlaceholder('you@example.com').fill('hello@test.com');
await page.getByPlaceholder('Enter password').fill('secret');
```

**Human check:** *"Find the box whose hint says SUMMER10."*

**When to use:** when there is **no label**, only placeholder.

```text
  has label?   →  getByLabel()
  only hint?   →  getByPlaceholder()
```

---

## 8. CSS selectors

**The classic way** — same as you use in web development.

### 8.1 Cheat sheet

| Pattern | Meaning | Example on our page |
|---------|---------|---------------------|
| `#id` | element with this id | `#product-apple` |
| `.class` | element with this class | `.product-card` |
| `tag` | by tag name | `button` |
| `tag.class` | tag that has class | `button.primary` |
| `a b` | b inside a | `#product-apple .price` |
| `[attr="val"]` | attribute equals | `button[type="submit"]` |
| `li:nth-child(1)` | 1st child | first `<li>` |

### 8.2 By id

```js
// <div class="product-card" id="product-apple">
const appleCard = page.locator('#product-apple');

await expect(appleCard).toBeVisible();
await expect(appleCard).toContainText('Apple');
await expect(appleCard).toContainText('$1');
```

**Human check:** *"Find the element with id product-apple."*

### 8.3 By class

```js
// two product cards
const cards = page.locator('.product-card');
await expect(cards).toHaveCount(2);
```

### 8.4 Tag + class

```js
// only Place order has class primary
const placeOrder = page.locator('button.primary');
await expect(placeOrder).toHaveText('Place order');
```

### 8.5 Descendant (parent → child)

```js
// price inside Apple card only → $1
await expect(page.locator('#product-apple .price')).toHaveText('$1');
await expect(page.locator('#product-banana .price')).toHaveText('$2');
```

### 8.6 Attribute selector

```js
// <button type="submit">Place order</button>
await expect(page.locator('button[type="submit"]')).toHaveText('Place order');
```

### 8.7 nth-child

```js
await expect(page.locator('#cart-items li:nth-child(1)')).toHaveText('Mango');
await expect(page.locator('#cart-items li:nth-child(2)')).toHaveText('Papaya');
```

### 8.8 Action with CSS

```js
await page.locator('#email').fill('css@test.com');
await page.locator('button[type="submit"]').click();
await expect(page.locator('#msg')).toHaveText('Order placed! Thank you.');
```

---

## 9. XPath (basic only)

XPath = another query language. **Basic is enough** for this course.  
**Prefer `getByRole` / CSS in real projects.** Learn XPath to read old code and interviews.

### 9.1 Building blocks

```text
  //                    search ANYWHERE on the page
  //h2                  every <h2>
  //*                   every element
  //*[@id="x"]          any element with id="x"
  //button[text()="Place order"]   button with exact text
  //li[contains(text(),"Mango")]   li whose text CONTAINS Mango
  //ul[@id="cart-items"]/li        li children of that ul
  (//button)[1]         the FIRST button   ← index starts at 1!
```

### 9.2 Examples (all in `05-xpath-basic.spec.js`)

**By tag:**

```js
const headings = page.locator('//h2');
await expect(headings).toHaveCount(2);           // Products + Your list
await expect(headings.first()).toHaveText('Products');
```

**By attribute:**

```js
const apple = page.locator('//*[@id="product-apple"]');
await expect(apple).toContainText('Apple');
```

**By exact text:**

```js
const placeOrder = page.locator('//button[text()="Place order"]');
await expect(placeOrder).toHaveText('Place order');
```

**By contains:**

```js
const mango = page.locator('//li[contains(text(),"Mango")]');
await expect(mango).toBeVisible();
```

**Child path:**

```js
const items = page.locator('//ul[@id="cart-items"]/li');
await expect(items).toHaveCount(2);
await expect(items.nth(0)).toHaveText('Mango');
```

**Index (1-based!):**

```js
// page buttons order:
//   1) Add to cart  2) Add to cart  3) Place order
await expect(page.locator('(//button)[1]')).toHaveText('Add to cart');
```

### 9.3 CSS vs XPath (same idea, different syntax)

| Find | CSS | XPath |
|------|-----|-------|
| by id | `#product-apple` | `//*[@id="product-apple"]` |
| by text | use `getByText` | `//button[text()="Place order"]` |
| contains text | use `getByText(/.../)` | `//li[contains(text(),"Mango")]` |
| first button | `button >> nth=0` | `(//button)[1]` |
| index starts at | **0** (`.nth(0)`) | **1** `([1])` |

---

## 10. Strict mode — when 2 elements match

Playwright wants **one** element for an action (click, fill).  
If your locator matches **2+**, you get **strict mode violation**.

### Real failure from my machine

```text
Error: locator.click: Error: strict mode violation:
getByRole('button', { name: 'Add to cart' }) resolved to 2 elements:
    1) <button type="button">Add to cart</button>  aka locator('#product-apple')...
    2) <button type="button">Add to cart</button>  aka locator('#product-banana')...
```

**Human check:** *"Two buttons say the same thing — which one do you want?"*

### 4 ways to fix it

```js
// 1) Pick one
page.getByRole('button', { name: 'Add to cart' }).first().click();
page.getByRole('button', { name: 'Add to cart' }).nth(1).click(); // 2nd (0-based)

// 2) Make the locator more specific
page.locator('#product-apple').getByRole('button', { name: 'Add to cart' }).click();

// 3) Use a unique name instead
page.getByRole('button', { name: 'Place order' }).click();

// 4) When you EXPECT many — assert count (no click)
await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(2);
```

```text
  many matches + want COUNT   →  expect(...).toHaveCount(n)   OK
  many matches + want CLICK   →  need .first() / .nth() / tighter locator
```

---

## 11. Locator cheat sheet

| Locator | Human question | Example |
|---------|----------------|---------|
| `getByRole('heading', { level: 1 })` | Which big title? | h1 |
| `getByRole('button', { name: 'Place order' })` | Which button? | by visible button text |
| `getByRole('link', { name: 'Home' })` | Which link? | nav |
| `getByText('Apple')` | Which thing shows Apple? | by words on screen |
| `getByText(/something/i)` | Which thing has this word (any case)? | partial |
| `getByLabel('Email address')` | Which box has this label? | form field |
| `getByPlaceholder('SUMMER10')` | Which box has this hint? | form field |
| `page.locator('#id')` | By id | `#product-apple` |
| `page.locator('.class')` | By class | `.product-card` |
| `page.locator('button.primary')` | Tag + class | unique button |
| `page.locator('#a .b')` | b inside a | price under card |
| `page.locator('//*[@id="x"]')` | XPath by id | basic |
| `page.locator('//button[text()="Place order"]')` | XPath by text | basic |

**Remember the order:**

```text
  getByRole  >  getByText  >  getByLabel  >  getByPlaceholder  >  CSS  >  XPath
```

---

## 12. Command cheat sheet

| I want to... | Command |
|--------------|---------|
| Install libraries | `npm install` |
| Install browser | `npx playwright install chromium` |
| Run all tests | `npx playwright test` |
| Run one file | `npx playwright test tests/01-get-by-role.spec.js` |
| Run by name | `npx playwright test -g "XPath"` |
| Watch browser | `npm run test:headed` |
| Open report | `npm run test:report` |

---

## 13. Real full output

Captured on this machine (ES6 + local Shopping App).

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
./package.json
./playwright.config.js
./site/index.html
./site/form.html
./tests/01-get-by-role.spec.js
./tests/02-get-by-text.spec.js
./tests/03-form-locators.spec.js
./tests/04-css-selectors.spec.js
./tests/05-xpath-basic.spec.js
```

### One file — `npx playwright test tests/01-get-by-role.spec.js`

```text
Running 6 tests using 6 workers

  ✓  6 [chromium] › tests/01-get-by-role.spec.js:40:1 › getByRole link — navigation menu (699ms)
  ✓  5 [chromium] › tests/01-get-by-role.spec.js:17:1 › getByRole heading — find h1 (879ms)
  ✓  1 [chromium] › tests/01-get-by-role.spec.js:60:1 › getByRole button — many matches need .first() (1.2s)
  ✓  3 [chromium] › tests/01-get-by-role.spec.js:51:1 › getByRole button — unique button text (1.2s)
  ✓  2 [chromium] › tests/01-get-by-role.spec.js:27:1 › getByRole heading — find h2 by exact name (1.3s)
  ✓  4 [chromium] › tests/01-get-by-role.spec.js:70:1 › click by role — real interaction (2.0s)

  6 passed (5.0s)
```

### All tests — `npx playwright test`

```text
Running 30 tests using 6 workers

  ✓   5 [chromium] › tests/01-get-by-role.spec.js:17:1 › getByRole heading — find h1 (1.2s)
  ✓   6 [chromium] › tests/01-get-by-role.spec.js:51:1 › getByRole button — unique button text (1.1s)
  ✓   3 [chromium] › tests/01-get-by-role.spec.js:40:1 › getByRole link — navigation menu (1.2s)
  ✓   4 [chromium] › tests/01-get-by-role.spec.js:60:1 › getByRole button — many matches need .first() (1.2s)
  ✓   2 [chromium] › tests/01-get-by-role.spec.js:27:1 › getByRole heading — find h2 by exact name (1.3s)
  ✓   7 [chromium] › tests/02-get-by-text.spec.js:13:1 › getByText exact — simple words on the page (368ms)
  ✓   8 [chromium] › tests/02-get-by-text.spec.js:22:1 › getByText — product name inside h3 (381ms)
  ✓   9 [chromium] › tests/02-get-by-text.spec.js:31:1 › getByText RegExp — partial + ignore case (324ms)
  ✓  10 [chromium] › tests/02-get-by-text.spec.js:39:1 › getByText on list item (288ms)
  ✓  11 [chromium] › tests/02-get-by-text.spec.js:47:1 › getByText is risky when text is partial — use exact option (270ms)
  ✓   1 [chromium] › tests/01-get-by-role.spec.js:70:1 › click by role — real interaction (2.0s)
  ✓  13 [chromium] › tests/03-form-locators.spec.js:38:1 › getByPlaceholder — find input from gray hint text (445ms)
  ✓  12 [chromium] › tests/03-form-locators.spec.js:17:1 › getByLabel — find input from its label (499ms)
  ✓  14 [chromium] › tests/03-form-locators.spec.js:28:1 › getByLabel — password + quantity (603ms)
  ✓  15 [chromium] › tests/03-form-locators.spec.js:48:1 › getByPlaceholder — login style fields (746ms)
  ✓  17 [chromium] › tests/04-css-selectors.spec.js:17:1 › CSS by id — #id (466ms)
  ✓  18 [chromium] › tests/04-css-selectors.spec.js:28:1 › CSS by class — .class (348ms)
  ✓  20 [chromium] › tests/04-css-selectors.spec.js:47:1 › CSS descendant — parent child (312ms)
  ✓  16 [chromium] › tests/03-form-locators.spec.js:62:1 › full form flow — label + placeholder + button (889ms)
  ✓  19 [chromium] › tests/04-css-selectors.spec.js:38:1 › CSS tag + class — button.primary (340ms)
  ✓  22 [chromium] › tests/04-css-selectors.spec.js:67:1 › CSS nth — li:nth-child() (327ms)
  ✓  24 [chromium] › tests/05-xpath-basic.spec.js:21:1 › XPath by tag — //h2 (293ms)
  ✓  25 [chromium] › tests/05-xpath-basic.spec.js:30:1 › XPath by attribute — //*[@id="product-apple"] (280ms)
  ✓  26 [chromium] › tests/05-xpath-basic.spec.js:38:1 › XPath by text — //button[text()="Place order"] (304ms)
  ✓  21 [chromium] › tests/04-css-selectors.spec.js:58:1 › CSS attribute selector — [type="submit"] (447ms)
  ✓  27 [chromium] › tests/05-xpath-basic.spec.js:47:1 › XPath contains — //li[contains(text(),"Mango")] (188ms)
  ✓  28 [chromium] › tests/05-xpath-basic.spec.js:56:1 › XPath child path — //ul[@id="cart-items"]/li (208ms)
  ✓  29 [chromium] › tests/05-xpath-basic.spec.js:66:1 › XPath index — (//button)[1] first button (202ms)
  ✓  23 [chromium] › tests/04-css-selectors.spec.js:76:1 › CSS + action — fill and click (609ms)
  ✓  30 [chromium] › tests/05-xpath-basic.spec.js:78:1 › XPath on form — fill input by id (364ms)

  30 passed (6.5s)
```

---

## Quick self-check

1. Which locator is #1 in the recommended order? → `getByRole()`
2. Form field with a label → which locator? → `getByLabel()`
3. Form field with only a gray hint → which locator? → `getByPlaceholder()`
4. CSS for id `product-apple`? → `#product-apple`
5. XPath that starts with? → `//`
6. Two elements match and you click → error name? → **strict mode violation**
7. How to fix click when 2 matches? → `.first()` / `.nth()` / tighter locator

All 7 → Topic 2 done ✅

---

## Next topic

**Topic 3 — Waiting & Auto-wait** (timeouts, `waitFor`, when Playwright waits for you) — coming soon.

---

*Topic 2 · Locators · Shopping App · ES6 · Real output: 30 passed (6.5s) · Playwright 1.63.0*

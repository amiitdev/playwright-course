# Topic 3 — User Actions

> **Goal:** learn how a real user **interacts** with a page — click, type, choose, check, upload, press keys.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Website:** our local Shopping App (same style as Topics 1–2)  
**Real result from my machine:** `35 passed (6.4s)` ✅

---

## Table of Contents

1. [What are user actions?](#1-what-are-user-actions)
2. [Our pages for this topic](#2-our-pages-for-this-topic)
3. [Click](#3-click)
4. [Fill vs Type](#4-fill-vs-type)
5. [Select dropdowns](#5-select-dropdowns)
6. [Checkbox / Radio buttons](#6-checkbox--radio-buttons)
7. [File uploads](#7-file-uploads)
8. [Keyboard actions](#8-keyboard-actions)
9. [Action cheat sheet](#9-action-cheat-sheet)
10. [Real failures we hit (and fixed)](#10-real-failures-we-hit-and-fixed)
11. [Command cheat sheet](#11-command-cheat-sheet)
12. [Real full output](#12-real-full-output)

---

## 1. What are user actions?

Locators (Topic 2) = **WHERE**.  
Actions (this topic) = **WHAT you do** there.

```text
  locator = find the button
      |
      v
  action  = click / fill / check / select / press
      |
      v
  assertion = expect the page reacted correctly
```

**Example flow:**

```js
await page.goto('form.html');                          // open page
await page.getByLabel('Full name').fill('Amit');       // action
await page.locator('#fruit').selectOption('mango');    // action
await page.getByRole('button', { name: 'Place order' }).click(); // action
await expect(page.locator('#result')).toHaveText('...'); // assertion
```

---

## 2. Our pages for this topic

### Home — `site/index.html`

| Section | What we practice |
|---------|------------------|
| **Buy now** button | `click` + page reacts |
| **Double click me** | `dblclick` |
| **Search box** | `fill` + `press('Enter')` / `Escape` |
| **Nav links** | `click` link → navigate |

### Checkout form — `site/form.html`

| Control | Action we practice |
|---------|-------------------|
| Full name / Email inputs | `fill` / `type` |
| Fruit `<select>` | `selectOption` |
| Extra cream / nuts / sugar | `check` / `uncheck` / `toBeChecked` |
| Standard / Express radio | `check` (switch choice) |
| Upload receipt | `setInputFiles` |
| Place order button | `click` / Enter submit |

### Sample file for upload

```text
fixtures/sample-upload.txt
Hello Amit!
This is a sample file for Playwright file upload tests.
```

---

## 3. Click

**`click()`** = move mouse + press + release.  
Playwright **auto-waits** until the element is visible and enabled.

### 3.1 Click button → page reacts

```js
await page.goto('index.html');

const msg = page.locator('#buy-msg');
await expect(msg).toBeHidden();          // BEFORE: hidden

await page.getByRole('button', { name: 'Buy now' }).click();

await expect(msg).toBeVisible();         // AFTER: visible
await expect(msg).toHaveText('Thanks! Your order was placed.');
await expect(page.locator('#status-text')).toHaveText('ordered');
```

**Human check:** *"Press Buy now. Did the thank-you message appear?"*

### 3.2 Click by CSS

```js
await page.locator('#buy-btn').click();
```

### 3.3 Click link → navigate

```js
// exact: true — page also has "Go to Checkout Form →"
await page.getByRole('link', { name: 'Checkout Form', exact: true }).click();

await expect(page).toHaveURL(/form\.html/);
```

### 3.4 Double click

```js
await page.locator('#double-btn').dblclick();
await expect(page.locator('#double-count')).toHaveText('Double clicks: 1');
```

### 3.5 `force: true` (rare)

```js
await page.locator('#buy-btn').click({ force: true });
```

Skips “is it really visible/enabled?” checks.  
**Prefer fixing your locator** over using force.

| Action | Method | When |
|--------|--------|------|
| single click | `.click()` | almost always |
| double click | `.dblclick()` | rare UI patterns |
| right click | `.click({ button: 'right' })` | context menus |

---

## 4. Fill vs Type

```text
  fill('Amit')  →  sets text INSTANTLY     ✅ use this 99% of the time
  type('Amit')  →  presses A, m, i, t one by one (like a human)
```

### 4.1 `fill` — instant (preferred)

```js
await page.goto('form.html');

await page.getByLabel('Full name').fill('Amit Kumar');
await expect(page.getByLabel('Full name')).toHaveValue('Amit Kumar');
```

**Human check:** *"Put Amit Kumar in the name box."*

### 4.2 `fill` replaces old text

```js
await email.fill('first@test.com');
await expect(email).toHaveValue('first@test.com');

await email.fill('second@test.com');   // replaces, no need to clear
await expect(email).toHaveValue('second@test.com');
```

### 4.3 `fill('')` — clear

```js
await name.fill('Something');
await name.fill('');                    // empty = clear
await expect(name).toHaveValue('');
```

### 4.4 `type` — key by key

```js
// fires keydown/keypress/keyup for each letter
await page.getByLabel('Full name').type('Amit');
await expect(page.getByLabel('Full name')).toHaveValue('Amit');
```

### 4.5 `type` with delay (slow human)

```js
await page.locator('#fullname').type('Hi', { delay: 50 }); // 50ms between keys
```

| Use | When |
|-----|------|
| **`fill()`** | normal forms — fast + reliable |
| **`type()`** | page reacts to **each keystroke** (live search, autocomplete) |

---

## 5. Select dropdowns

HTML:

```html
<select id="fruit">
  <option value="">-- select --</option>
  <option value="apple">Apple</option>
  <option value="banana">Banana</option>
  <option value="mango">Mango</option>
  <option value="papaya">Papaya</option>
</select>
```

### 5.1 Three ways to pick

```js
// 1) by value attribute
await page.locator('#fruit').selectOption('mango');
await expect(page.locator('#fruit')).toHaveValue('mango');

// 2) by visible label text
await page.locator('#fruit').selectOption({ label: 'Banana' });
await expect(page.locator('#fruit')).toHaveValue('banana');

// 3) by index (0-based)
//    0: -- select --   1: Apple   2: Banana
await page.locator('#fruit').selectOption({ index: 2 });
await expect(page.locator('#fruit')).toHaveValue('banana');
```

**Human check:** *"Open the dropdown and choose Banana."*

### 5.2 Default state

```js
// first option value is "" until user selects
await expect(page.locator('#fruit')).toHaveValue('');
```

### 5.3 Full flow with dropdown

```js
await page.getByLabel('Full name').fill('Amit');
await page.locator('#fruit').selectOption({ label: 'Papaya' });
await page.getByRole('button', { name: 'Place order' }).click();

await expect(page.locator('#result')).toHaveText('Order OK for Amit (papaya)');
```

| Method | Picks by |
|--------|----------|
| `selectOption('apple')` | `value="apple"` |
| `selectOption({ label: 'Apple' })` | visible text |
| `selectOption({ index: 2 })` | position (0-based) |

---

## 6. Checkbox / Radio buttons

### 6.1 Checkbox (multi-select — independent)

Our HTML defaults:

```html
<input type="checkbox" id="extra-cream" />   <!-- OFF -->
<input type="checkbox" id="extra-nuts" />    <!-- OFF -->
<input type="checkbox" id="extra-sugar" checked />  <!-- ON -->
```

**Read state:**

```js
await expect(page.locator('#extra-cream')).not.toBeChecked();
await expect(page.locator('#extra-sugar')).toBeChecked();
```

**Turn ON:**

```js
const cream = page.locator('#extra-cream');
await cream.check();
await expect(cream).toBeChecked();
```

**Turn OFF:**

```js
const sugar = page.locator('#extra-sugar');  // starts ON
await sugar.uncheck();
await expect(sugar).not.toBeChecked();
```

**Human check:** *"Is this box ticked? Make cream ticked. Untick sugar."*

### 6.2 Radio (single choice — same `name` group)

```html
<input type="radio" id="ship-standard" name="shipping" checked />
<input type="radio" id="ship-express"  name="shipping" />
```

**Default:**

```js
await expect(page.locator('#ship-standard')).toBeChecked();
await expect(page.locator('#ship-express')).not.toBeChecked();
```

**Switch choice:**

```js
await page.locator('#ship-express').check();

// browser auto-unchecks the other radio in the same group
await expect(page.locator('#ship-express')).toBeChecked();
await expect(page.locator('#ship-standard')).not.toBeChecked();
```

**By label:**

```js
await page.getByLabel('Express (1 day)').check();
```

```text
  checkbox → many can be ON at once
  radio    → only ONE in the group can be ON
```

| Action | Checkbox | Radio |
|--------|----------|-------|
| select | `.check()` | `.check()` the one you want |
| deselect | `.uncheck()` | (pick the other radio instead) |
| assert on | `toBeChecked()` / `not.toBeChecked()` | same |

---

## 7. File uploads

Playwright **does not open** the OS file picker.  
You **give it a file path** (or a fake buffer).

```text
  setInputFiles('path/file.txt')   → one file
  setInputFiles(['a','b'])         → multiple files
  setInputFiles([])                → CLEAR the input
```

### 7.1 Upload one file

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.join(__dirname, '..', 'fixtures', 'sample-upload.txt');

await page.goto('form.html');
await page.locator('#receipt').setInputFiles(SAMPLE);

const count = await page.locator('#receipt').evaluate((el) => el.files.length);
expect(count).toBe(1);

const fileName = await page.locator('#receipt').evaluate((el) => el.files[0].name);
expect(fileName).toBe('sample-upload.txt');
```

**Human check:** *"Put sample-upload.txt into the upload box."*

### 7.2 Upload + submit

```js
await page.getByLabel('Full name').fill('Amit');
await page.locator('#receipt').setInputFiles(SAMPLE);
await page.getByRole('button', { name: 'Place order' }).click();

await expect(page.locator('#result')).toHaveText(
  'Order OK for Amit + file: sample-upload.txt'
);
```

### 7.3 Clear the input

```js
await page.locator('#receipt').setInputFiles(SAMPLE);  // has 1 file
await page.locator('#receipt').setInputFiles([]);      // clear → 0 files
```

### 7.4 Fake file in memory (great for CI)

```js
await page.locator('#receipt').setInputFiles({
  name: 'invoice.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4 fake content'),
});
```

No real PDF needed — Playwright creates a virtual file.

---

## 8. Keyboard actions

```text
  locator.press('Enter')      → key goes TO that element
  page.keyboard.press(...)    → key goes to whatever has FOCUS
  page.keyboard.type('hi')    → types into focused element
```

### 8.1 `press('Enter')` — run search

```js
await page.goto('index.html');

await page.locator('#search').fill('mango');
await page.locator('#search').press('Enter');

await expect(page.locator('#search-result')).toHaveText('Found: mango');
await expect(page.locator('#last-key')).toHaveText('Last key: Enter');
```

**Human check:** *"Type mango, hit Enter. Did it search?"*

### 8.2 `press('Escape')` — clear

```js
await page.locator('#search').press('Enter');   // show result
await page.locator('#search').press('Escape');  // clear it
await expect(page.locator('#search-result')).toHaveText('');
```

### 8.3 `press('Tab')` — next field

```js
await page.getByLabel('Full name').focus();
await page.keyboard.press('Tab');

await expect(page.getByLabel('Email')).toBeFocused();
```

### 8.4 `keyboard.type` — into focused element

```js
await page.getByLabel('Full name').focus();
await page.keyboard.type('Amit');
await expect(page.getByLabel('Full name')).toHaveValue('Amit');
```

### 8.5 Enter submits the form

```js
await page.getByLabel('Full name').fill('Amit');
await page.locator('#fruit').selectOption('apple');
await page.getByLabel('Full name').press('Enter');

await expect(page.locator('#result')).toHaveText('Order OK for Amit (apple)');
```

### 8.6 Backspace deletes

```js
await name.fill('ABC');
await name.press('Backspace');  // AB
await name.press('Backspace');  // A
await name.press('Backspace');  // ""
await expect(name).toHaveValue('');
```

| Key string | Meaning |
|------------|---------|
| `'Enter'` | submit / search |
| `'Tab'` | next focusable control |
| `'Escape'` | close / clear |
| `'Backspace'` | delete previous char |
| `'ArrowDown'` | move down (menus, etc.) |
| `'Space'` | space bar |

---

## 9. Action cheat sheet

| I want to... | Code |
|--------------|------|
| Click a button | `locator.click()` |
| Double click | `locator.dblclick()` |
| Click a link | `getByRole('link', { name: '...' }).click()` |
| Type fast (preferred) | `locator.fill('text')` |
| Type like a human | `locator.type('text')` |
| Clear an input | `locator.fill('')` |
| Choose dropdown by value | `selectOption('apple')` |
| Choose dropdown by label | `selectOption({ label: 'Apple' })` |
| Tick checkbox | `locator.check()` |
| Untick checkbox | `locator.uncheck()` |
| Is it ticked? | `expect(locator).toBeChecked()` |
| Is it not ticked? | `expect(locator).not.toBeChecked()` |
| Upload a file | `setInputFiles('/path/file.txt')` |
| Clear upload | `setInputFiles([])` |
| Press Enter | `locator.press('Enter')` |
| Press Tab | `page.keyboard.press('Tab')` |
| Type into focus | `page.keyboard.type('hi')` |

**Remember the flow:**

```text
  goto → locator → ACTION → expect
```

---

## 10. Real failures we hit (and fixed)

### Fail A — link name not unique (strict mode)

```text
strict mode violation: getByRole('link', { name: 'Checkout Form' })
resolved to 2 elements:
    1) <a href="form.html">Checkout Form</a>
    2) <a href="form.html">Go to Checkout Form →</a>
```

**Fix:**

```js
getByRole('link', { name: 'Checkout Form', exact: true })
```

### Fail B — wrong way to clear files

```text
TypeError: Cannot read properties of null (reading 'buffer')
setInputFiles(null)   ❌
```

**Fix:**

```js
setInputFiles([])     ✅  empty array clears the input
```

**Rule:** when a test fails, read the error once — Playwright usually names the exact problem.

---

## 11. Command cheat sheet

| I want to... | Command |
|--------------|---------|
| Install libraries | `npm install` |
| Install browser | `npx playwright install chromium` |
| Run all tests | `npx playwright test` |
| Run one file | `npx playwright test tests/01-click.spec.js` |
| Run by name | `npx playwright test -g "dropdown"` |
| Watch browser | `npm run test:headed` |
| Open report | `npm run test:report` |

---

## 12. Real full output

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
./fixtures/sample-upload.txt
./package.json
./playwright.config.js
./site/index.html
./site/form.html
./tests/01-click.spec.js
./tests/02-fill-type.spec.js
./tests/03-select-dropdown.spec.js
./tests/04-checkbox-radio.spec.js
./tests/05-file-upload.spec.js
./tests/06-keyboard.spec.js
```

### One file — `npx playwright test tests/01-click.spec.js`

```text
Running 5 tests using 5 workers

  ✓  1 [chromium] › tests/01-click.spec.js:28:1 › click by CSS id (1.0s)
  ✓  4 [chromium] › tests/01-click.spec.js:56:1 › click with force (rare — covered for awareness) (819ms)
  ✓  2 [chromium] › tests/01-click.spec.js:46:1 › dblclick — double click (1.1s)
  ✓  3 [chromium] › tests/01-click.spec.js:34:1 › click link — navigate (1.0s)
  ✓  5 [chromium] › tests/01-click.spec.js:12:1 › click button — page reacts (1.1s)

  5 passed (4.3s)
```

### All tests — `npx playwright test`

```text
Running 35 tests using 6 workers

  ✓   2 [chromium] › tests/02-fill-type.spec.js:16:1 › fill — set value instantly (1.0s)
  ✓   3 [chromium] › tests/01-click.spec.js:56:1 › click with force (rare — covered for awareness) (953ms)
  ✓   4 [chromium] › tests/01-click.spec.js:46:1 › dblclick — double click (1.2s)
  ✓   1 [chromium] › tests/01-click.spec.js:12:1 › click button — page reacts (1.2s)
  ✓   6 [chromium] › tests/01-click.spec.js:34:1 › click link — navigate (1.2s)
  ✓   5 [chromium] › tests/01-click.spec.js:28:1 › click by CSS id (1.3s)
  ✓   7 [chromium] › tests/02-fill-type.spec.js:25:1 › fill — clear then write (fill always replaces) (873ms)
  ✓   9 [chromium] › tests/02-fill-type.spec.js:46:1 › type — keys one by one like a human (686ms)
  ✓   8 [chromium] › tests/02-fill-type.spec.js:37:1 › fill with empty string — clears the input (906ms)
  ✓  10 [chromium] › tests/02-fill-type.spec.js:55:1 › type with delay — slow human typing (872ms)
  ✓  14 [chromium] › tests/03-select-dropdown.spec.js:39:1 › select by index (0-based) (571ms)
  ✓  12 [chromium] › tests/03-select-dropdown.spec.js:21:1 › select by value (977ms)
  ✓  13 [chromium] › tests/03-select-dropdown.spec.js:30:1 › select by visible label text (637ms)
  ✓  15 [chromium] › tests/03-select-dropdown.spec.js:51:1 › default is empty until we select (603ms)
  ✓  11 [chromium] › tests/02-fill-type.spec.js:64:1 › fill two fields + submit (1.2s)
  ✓  16 [chromium] › tests/03-select-dropdown.spec.js:58:1 › full order flow with dropdown (798ms)
  ✓  17 [chromium] › tests/04-checkbox-radio.spec.js:21:1 › checkbox default state (398ms)
  ✓  18 [chromium] › tests/04-checkbox-radio.spec.js:30:1 › check — tick a box (406ms)
  ✓  19 [chromium] › tests/04-checkbox-radio.spec.js:43:1 › uncheck — untick a box (409ms)
  ✓  21 [chromium] › tests/04-checkbox-radio.spec.js:69:1 › radio default — standard is selected (361ms)
  ✓  20 [chromium] › tests/04-checkbox-radio.spec.js:54:1 › check multiple checkboxes (523ms)
  ✓  22 [chromium] › tests/04-checkbox-radio.spec.js:76:1 › radio — switch to express (436ms)
  ✓  23 [chromium] › tests/04-checkbox-radio.spec.js:86:1 › radio — pick with getByLabel (363ms)
  ✓  25 [chromium] › tests/05-file-upload.spec.js:23:1 › upload one file by absolute path (458ms)
  ✓  26 [chromium] › tests/05-file-upload.spec.js:37:1 › upload then submit — form sees the file (465ms)
  ✓  24 [chromium] › tests/04-checkbox-radio.spec.js:93:1 › complete form: text + select + checkbox + radio (599ms)
  ✓  27 [chromium] › tests/05-file-upload.spec.js:50:1 › clear file input — setInputFiles([]) (497ms)
  ✓  28 [chromium] › tests/05-file-upload.spec.js:62:1 › upload with setInputFiles and buffer (no real file needed) (439ms)
  ✓  29 [chromium] › tests/06-keyboard.spec.js:18:1 › press Enter on input — runs search (370ms)
  ✓  30 [chromium] › tests/06-keyboard.spec.js:29:1 › click button instead of Enter (396ms)
  ✓  31 [chromium] › tests/06-keyboard.spec.js:38:1 › press Escape — clears message (432ms)
  ✓  32 [chromium] › tests/06-keyboard.spec.js:52:1 › press Tab — move to next field (377ms)
  ✓  33 [chromium] › tests/06-keyboard.spec.js:61:1 › keyboard.type — type into focused element (365ms)
  ✓  35 [chromium] › tests/06-keyboard.spec.js:71:1 › press Enter to submit form (329ms)
  ✓  34 [chromium] › tests/06-keyboard.spec.js:83:1 › chained keys — type then Arrow/Clear with Backspace (376ms)

  35 passed (6.4s)
```

---

## Quick self-check

1. Preferred way to put text in an input? → `fill()`
2. When to use `type()`? → when the page reacts to **each keystroke**
3. Dropdown pick by visible text? → `selectOption({ label: 'Apple' })`
4. Tick a checkbox? → `check()`
5. Only one radio can be ON in a group? → **yes**
6. How to upload without OS dialog? → `setInputFiles(path)`
7. How to clear file input? → `setInputFiles([])`
8. Press Enter on the search box? → `locator.press('Enter')`

All 8 → Topic 3 done ✅

---

## Next topic

**Topic 4 — Page Object Model (POM)** — organize locators/actions into clean classes — coming soon.

---

*Topic 3 · User Actions · Shopping App · ES6 · Real output: 35 passed (6.4s) · Playwright 1.63.0*

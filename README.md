# Playwright Course — Learn Step by Step

Hello! This is my Playwright course.  
One topic at a time. Each topic has:

- A folder with **working code** — **modern ES6 JavaScript** (`import` / `export`)
- A tiny **local website** to test (simple, practical — not random internet sites)
- A **README.md** with theory, line-by-line explanations, ASCII diagrams, and **real terminal output**

---

## Table of Contents

| # | Topic | Folder | Status |
|---|-------|--------|--------|
| 1 | [Playwright Basics](./topic-01-playwright-basics/README.md) | `topic-01-playwright-basics/` | ✅ Done |
| 2 | [Locators](./topic-02-locators/README.md) | `topic-02-locators/` | ✅ Done |
| 3 | [User Actions](./topic-03-user-actions/README.md) | `topic-03-user-actions/` | ✅ Done |
| 4 | [Waiting & Synchronization](./topic-04-waiting/README.md) | `topic-04-waiting/` | ✅ Done |
| 5 | [Navigation](./topic-05-navigation/README.md) | `topic-05-navigation/` | ✅ Done |
| 6 | [Assertions](./topic-06-assertions/README.md) | `topic-06-assertions/` | ✅ Done |
| 7 | [Test Organization](./topic-07-organization/README.md) | `topic-07-organization/` | ✅ Done |
| 8 | [Page Object Model](./topic-08-pom/README.md) | `topic-08-pom/` | ✅ Done |
| 9 | CI/CD with GitHub Actions (coming soon) | `topic-09-cicd/` | ⏳ |

---

## Code Style Rule (all topics)

```js
// ✅ ES6 — always this
import { test, expect } from '@playwright/test';
export default defineConfig({ /* ... */ });

// ❌ CommonJS — never this
const { test } = require('@playwright/test');
module.exports = { /* ... */ };
```

Enabled by `"type": "module"` in every topic's `package.json`.

---

## How To Use This Course

```text
1. Open a topic folder
2. Read its README.md top to bottom
3. Run the code yourself
4. Compare your output with the "Real Output" section
5. Move to the next topic
```

---

## Prerequisites (one-time setup)

| Tool | Check command | My version |
|------|---------------|------------|
| Node.js | `node --version` | `v24.19.0` |
| npm | `npm --version` | `11.17.0` |
| Git | `git --version` | — |

---

## Quick Start (Topic 1)

```bash
cd topic-01-playwright-basics
npm install
npx playwright install chromium
npx playwright test
```

```bash
cd topic-02-locators
npm install
npx playwright install chromium
npx playwright test
```

```bash
cd topic-03-user-actions
npm install
npx playwright install chromium
npx playwright test
```

```bash
cd topic-04-waiting
npm install
npx playwright install chromium
npx playwright test
```

```bash
cd topic-05-navigation
npm install
npx playwright install chromium
npx playwright test
```

```bash
cd topic-06-assertions
npm install
npx playwright install chromium
npx playwright test
```

```bash
cd topic-07-organization
npm install
npx playwright install chromium
npx playwright test
npx playwright test --grep @smoke
```

```bash
cd topic-08-pom
npm install
npx playwright install chromium
npx playwright test
```

---

*Last updated: Topic 8 — Page Object Model (16 passed · 3 smoke)*

# Topic 11 — CI/CD Integration

> **Goal:** run Playwright automatically on **every push** with **GitHub Actions**, **Jenkins**, or **Docker** — and collect **HTML + JUnit test reports**.

**Language:** modern **ES6 JavaScript** (`import` / `export`)  
**Real results from my machine:**

| Command | Result |
|---------|--------|
| `npx playwright test --reporter=list,html,junit` | `8 passed (2.4s)` ✅ |
| `npx playwright test --grep @smoke` | `3 passed (1.9s)` ✅ |
| `CI=true npx playwright test` | `8 passed (1.7s)` + GitHub notices ✅ |
| `docker build -t playwright-cicd:local .` | image built ✅ |
| `docker run --rm playwright-cicd:local` | `8 passed (3.3s)` ✅ |
| HTML report | `playwright-report/index.html` (~523 KB) ✅ |
| JUnit XML | `test-results/junit.xml` (1.2 KB) ✅ |

---

## Table of Contents

1. [What is CI/CD for tests?](#1-what-is-cicd-for-tests)
2. [Project layout](#2-project-layout)
3. [Test reports](#3-test-reports)
4. [CI-aware config](#4-ci-aware-config)
5. [GitHub Actions](#5-github-actions)
6. [Jenkins](#6-jenkins)
7. [Docker](#7-docker)
8. [How to enable CI on this repo](#8-how-to-enable-ci-on-this-repo)
9. [Cheat sheet](#9-cheat-sheet)
10. [Real full output](#10-real-full-output)

---

## 1. What is CI/CD for tests?

```text
  Developer pushes code
           │
           ▼
  ┌─────────────────────┐
  │  CI server starts   │   GitHub Actions / Jenkins / Docker
  │  npm ci             │
  │  install browsers   │
  │  npx playwright test│
  └──────────┬──────────┘
             │
     pass ───┴─── fail
      │            │
      ▼            ▼
   merge OK    block merge + show report
```

| Term | Meaning |
|------|---------|
| **CI** | run tests automatically when code changes |
| **CD** | (related) auto-deploy after green tests |
| **Artifact** | saved file (HTML report, JUnit XML, traces) |
| **Smoke** | tiny must-pass set (`@smoke`) for fast feedback |

---

## 2. Project layout

```text
topic-11-cicd/
├── package.json                 # scripts: test, test:smoke, test:ci
├── playwright.config.js         # list + html + junit (+ github on CI)
├── Dockerfile                   # container image for tests
├── docker-compose.yml           # mount reports to host
├── Jenkinsfile                  # Jenkins pipeline
├── .github/workflows/playwright.yml   # GitHub Actions
├── site/                        # app under test
│   ├── index.html
│   ├── login.html
│   └── about.html
└── tests/
    ├── 01-smoke.spec.js         # @smoke tagged
    └── 02-full.spec.js          # broader checks
```

Repo root also has:

```text
.github/workflows/playwright.yml   ← so Actions runs on every push to main
```

---

## 3. Test reports

Playwright can print **several reporters at once**:

```js
// playwright.config.js
reporter: [
  ['list'],                                              // terminal ✓ marks
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ...(isCI ? [['github']] : []),                         // PR annotations on GitHub
],
```

| Reporter | File / place | Who reads it |
|----------|--------------|--------------|
| **list** | terminal | you, CI logs |
| **html** | `playwright-report/index.html` | humans (screenshots, traces) |
| **junit** | `test-results/junit.xml` | Jenkins, Azure, many CI tools |
| **github** | checks on the PR | GitHub Actions annotations |

### Run with all three (same as CI)

```bash
npx playwright test --reporter=list,html,junit
```

**Real files after run:**

```text
playwright-report/index.html    523331 bytes
test-results/junit.xml            1212 bytes
```

### Open the HTML report locally

```bash
npx playwright show-report
# or open playwright-report/index.html in a browser
```

### JUnit XML (machine-readable)

```xml
<testsuites tests="8" failures="0" skipped="0" errors="0" time="1.70">
  <testsuite name="01-smoke.spec.js" tests="3" failures="0" ...>
    <testcase name="@smoke home loads with products" classname="01-smoke.spec.js" time="0.272"/>
    ...
  </testsuite>
  <testsuite name="02-full.spec.js" tests="5" failures="0" ...>
    ...
  </testsuite>
</testsuites>
```

**Human check:** *"`failures=0` means green CI. HTML report is for debugging."*

---

## 4. CI-aware config

```js
const isCI = !!process.env.CI; // GitHub / Jenkins set CI=true

export default defineConfig({
  forbidOnly: isCI,     // fail if test.only left in code
  retries: isCI ? 2 : 0, // retry twice on CI only
  workers: isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(isCI ? [['github']] : []),
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

| Setting | Local | CI |
|---------|-------|-----|
| `retries` | 0 (fail fast) | 2 (absorb flakes) |
| `forbidOnly` | false | **true** (no accidental `.only`) |
| `github` reporter | off | **on** |
| screenshots/video | on failure | on failure (uploaded artifact) |

**Prove CI mode works:**

```bash
CI=true npx playwright test
# → ::notice title=🎭 Playwright Run Summary::  8 passed (1.7s)
```

---

## 5. GitHub Actions

**File:** `.github/workflows/playwright.yml`  
(also inside `topic-11-cicd/.github/workflows/` for learning)

### When it runs

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:   # manual button
```

### Two jobs (real design)

```text
  push / PR
      ├── job: smoke   →  npm ci → install chromium → --grep @smoke  (fast)
      └── job: full    →  npm ci → install chromium → full suite + reports
```

### Essential steps (same every CI)

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
- run: npm ci
- run: npx playwright install --with-deps chromium
- run: npx playwright test --reporter=list,html,junit
  env:
    CI: "true"
```

### Save reports as artifacts

```yaml
- uses: actions/upload-artifact@v4
  if: always()    # upload even when tests fail
  with:
    name: playwright-report-full
    path: topic-11-cicd/playwright-report
    retention-days: 14
```

**After a run:** GitHub → **Actions** tab → click run → **Artifacts** → download `playwright-report-full` → open `index.html`.

### Key Actions concepts

| Word | Meaning |
|------|---------|
| **workflow** | one YAML file = one automation |
| **job** | separate machine run (smoke vs full can run in parallel) |
| **step** | one line: checkout, npm, test, upload |
| **artifact** | zip of files kept after the run |
| **`if: always()`** | run step even if previous step failed (important for reports) |

---

## 6. Jenkins

**File:** `Jenkinsfile` (declarative pipeline)

### Stages

```text
  Checkout → npm ci → install browsers → Run tests → Publish results
```

### Important bits

```groovy
environment {
  CI = "true"
}

stage('Run tests') {
  steps {
    dir('topic-11-cicd') {
      sh 'npx playwright test --reporter=list,html,junit'
    }
  }
  post {
    always {
      // JUnit plugin reads XML → red/green on build page
      junit testResults: 'test-results/junit.xml'

      // HTML plugin serves the report from Jenkins
      publishHTML([
        reportDir: 'playwright-report',
        reportFiles: 'index.html',
        reportName: 'Playwright HTML Report'
      ])
    }
  }
}
```

### Jenkins needs

| Plugin / setup | Why |
|----------------|-----|
| **JUnit plugin** | parse `junit.xml` |
| **HTML Publisher plugin** | serve `playwright-report` |
| Node.js tool `Node20` | match `tools { nodejs 'Node20' }` |
| Or **Docker agent** | use our Dockerfile instead of host Node |

### Jenkins vs GitHub Actions

| | GitHub Actions | Jenkins |
|--|----------------|---------|
| Hosted by | GitHub | your server |
| Config file | `.github/workflows/*.yml` | `Jenkinsfile` |
| Plugins | built-in artifacts | JUnit + HTML plugins |
| Best for | public/GitHub repos | private/enterprise networks |

---

## 7. Docker

**Why Docker?** Same OS + same browsers on laptop and CI → fewer “works on my machine” bugs.

### Dockerfile (real file in this folder)

```dockerfile
FROM mcr.microsoft.com/playwright:v1.63.0-noble  # browsers preinstalled
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY playwright.config.js ./
COPY site ./site
COPY tests ./tests
ENV CI=true
CMD ["npx", "playwright", "test", "--reporter=list,html,junit"]
```

### Build & run (done on this machine)

```bash
docker build -t playwright-cicd:local .
docker run --rm playwright-cicd:local
```

**Real output:**

```text
Running 8 tests using 2 workers
  ✓  … smoke + full tests …
  8 passed (3.3s)
<testsuites tests="8" failures="0" …>
```

### Keep HTML report on your laptop (compose)

```bash
docker compose run --rm tests
# then open ./playwright-report/index.html
```

`docker-compose.yml` mounts:

```yaml
volumes:
  - ./playwright-report:/app/playwright-report
  - ./test-results:/app/test-results
```

### Official image tags

```text
mcr.microsoft.com/playwright:v1.63.0-noble
                         ^^^^^^^^
                         match your @playwright/test version!
```

Version mismatch = browsers missing or wrong revision.

---

## 8. How to enable CI on this repo

### GitHub Actions (already prepared)

1. Repo file exists: `.github/workflows/playwright.yml` (copied for this course)
2. Push to `main` → **Actions** tab runs **Smoke** + **Full** jobs
3. Open a **Pull Request** → checks appear on the PR
4. Download **Artifacts** → open HTML report

### Jenkins

1. New Pipeline job → Pipeline script from SCM
2. Point at this repo, script path `Jenkinsfile`
3. Install JUnit + HTML Publisher plugins
4. Ensure Node tool name matches `Node20` (or switch to Docker agent)

### Docker only (no cloud)

```bash
cd topic-11-cicd
docker build -t playwright-cicd .
docker run --rm playwright-cicd
```

---

## 9. Cheat sheet

| I want to... | Command / file |
|--------------|----------------|
| Local full run + reports | `npx playwright test --reporter=list,html,junit` |
| Smoke only | `npx playwright test --grep @smoke` |
| CI-like local run | `CI=true npx playwright test` |
| Open HTML report | `npx playwright show-report` |
| JUnit file | `test-results/junit.xml` |
| GitHub workflow | `.github/workflows/playwright.yml` |
| Jenkins pipeline | `Jenkinsfile` |
| Docker build | `docker build -t playwright-cicd .` |
| Docker run tests | `docker run --rm playwright-cicd` |
| Compose + save report | `docker compose run --rm tests` |

### Minimal CI recipe (memorize)

```text
  checkout → node → npm ci → playwright install chromium
           → playwright test → upload report (if: always())
```

---

## 10. Real full output

### Environment

```text
$ node --version
v24.19.0

$ npx playwright --version
Version 1.63.0

$ docker --version
Docker version 29.2.0, build 0b9d198
```

### Local full suite with all reporters

```text
$ npx playwright test --reporter=list,html,junit

Running 8 tests using 6 workers

  ✓   6 [chromium] › tests/02-full.spec.js:29:1 › about page shows version (595ms)
  ✓   4 [chromium] › tests/01-smoke.spec.js:9:1 › @smoke home loads with products (795ms)
  ✓   1 [chromium] › tests/01-smoke.spec.js:15:1 › @smoke login page opens (845ms)
  ✓   3 [chromium] › tests/01-smoke.spec.js:22:1 › @smoke add to cart works (917ms)
  ✓   2 [chromium] › tests/02-full.spec.js:19:1 › login wrong password shows error (1.0s)
  ✓   5 [chromium] › tests/02-full.spec.js:9:1 › login with valid credentials (1.0s)
  ✓   8 [chromium] › tests/02-full.spec.js:44:1 › cart starts at zero (370ms)
  ✓   7 [chromium] › tests/02-full.spec.js:35:1 › nav links work (570ms)

  8 passed (2.4s)
```

### Smoke only

```text
$ npx playwright test --grep @smoke

Running 3 tests using 3 workers

  ✓  1 [chromium] › tests/01-smoke.spec.js:9:1 › @smoke home loads with products (898ms)
  ✓  2 [chromium] › tests/01-smoke.spec.js:15:1 › @smoke login page opens (825ms)
  ✓  3 [chromium] › tests/01-smoke.spec.js:22:1 › @smoke add to cart works (882ms)

  3 passed (1.9s)
```

### CI mode (`CI=true`)

```text
$ CI=true npx playwright test

Running 8 tests using 2 workers
  ✓ … all 8 …
  8 passed (1.7s)
::notice title=🎭 Playwright Run Summary::  8 passed (1.7s)
```

### Report files

```text
playwright-report/index.html    523331 bytes
test-results/junit.xml            1212 bytes
```

JUnit excerpt:

```xml
<testsuites tests="8" failures="0" skipped="0" errors="0" time="1.708…">
  <testsuite name="01-smoke.spec.js" tests="3" failures="0" …>
    <testcase name="@smoke home loads with products" … time="0.272"/>
  </testsuite>
  <testsuite name="02-full.spec.js" tests="5" failures="0" …>
    …
  </testsuite>
</testsuites>
```

### Docker build + run

```text
$ docker build -t playwright-cicd:local .
…
added 3 packages, and audited 4 packages in 3s
naming to docker.io/library/playwright-cicd:local done

$ docker run --rm playwright-cicd:local

Running 8 tests using 2 workers
  ✓ … all 8 …
  8 passed (3.3s)
<testsuites tests="8" failures="0" …>
```

---

## Quick self-check

1. Fast must-pass subset tag? → **`@smoke`**
2. Three local reporters? → **list + html + junit**
3. Where does Jenkins read results? → **`test-results/junit.xml`**
4. Where do humans click? → **`playwright-report/index.html`**
5. Upload reports even on failure? → **`if: always()`**
6. Browser install command in CI? → **`npx playwright install --with-deps chromium`**
7. Docker base image? → **`mcr.microsoft.com/playwright:v1.63.0-noble`**
8. What does `CI=true` change? → retries, forbidOnly, github reporter

All 8 → Topic 11 done ✅

---

## Course complete (Topics 1–11)

| # | Topic | Status |
|---|-------|--------|
| 1 | Playwright Basics | ✅ |
| 2 | Locators | ✅ |
| 3 | User Actions | ✅ |
| 4 | Waiting & Synchronization | ✅ |
| 5 | Navigation | ✅ |
| 6 | Assertions | ✅ |
| 7 | Test Organization | ✅ |
| 8 | Page Object Model | ✅ |
| 9 | API Testing | ✅ |
| 10 | Authentication | ✅ |
| 11 | CI/CD Integration | ✅ |

---

*Topic 11 · CI/CD · ES6 · Real output: 8 passed local · 8 passed Docker · HTML+JUnit reports · Playwright 1.63.0*

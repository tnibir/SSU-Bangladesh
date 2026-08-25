# SSU Bangladesh GitHub Pages Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `tnibir/SSU-Bangladesh` with the current local project and publish the compatible `NSIS-Current State & Projection` static website through GitHub Pages.

**Architecture:** Keep the website in its existing subdirectory and deploy that directory as a Pages artifact with a GitHub Actions workflow. Commit a fixed local D3 distribution, use a shared system-font stack, harden theme storage, and verify the source locally and in Chromium before destructively replacing the unrelated remote history.

**Tech Stack:** Static HTML/CSS/JavaScript, D3 7.9.0, Node.js 24, Node test runner, Playwright 1.62.1, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-26-github-pages-replacement-design.md`

## Global Constraints

- Preserve the existing local folder layout; do not move or duplicate `NSIS-Current State & Projection` at repository root.
- Publish the website at `https://tnibir.github.io/SSU-Bangladesh/` using the `github-pages` environment.
- Replace remote `main` with unrelated history; do not retain the old remote history.
- Exclude Microsoft Office lock files beginning with `~$` and all `.DS_Store` files.
- Do not use remote fonts or require the undeclared Inter font.
- D3 must load from a committed, fixed local asset rather than a runtime CDN.
- All internal website assets must resolve with relative project-Page URLs.
- Preserve calculator, navigation, themes, lifecycle controls, chart rendering, and downloads.
- Do not force-push until all local static and browser tests pass.

---

### Task 1: Static Pages Compatibility and Vendored D3

**Files:**

- Create: `.gitignore`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tests/site-compatibility.test.mjs`
- Create: `NSIS-Current State & Projection/.nojekyll`
- Create: `NSIS-Current State & Projection/vendor/d3/d3.min.js`
- Create: `NSIS-Current State & Projection/vendor/d3/LICENSE`
- Modify: `NSIS-Current State & Projection/styles.css`
- Modify: `NSIS-Current State & Projection/site-theme.css`
- Modify: `NSIS-Current State & Projection/lifecycle-chart.html`

**Interfaces:**

- Consumes: the existing static website and the npm `d3@7.9.0` distribution.
- Produces: a self-contained website directory whose local assets and fonts can be validated with `npm run test:static`.

- [ ] **Step 1: Add repository hygiene and the test toolchain configuration**

Create `.gitignore`:

```gitignore
.DS_Store
**/.DS_Store
~$*
node_modules/
playwright-report/
test-results/
_site/
```

Create `package.json`:

```json
{
  "name": "ssu-bangladesh-pages",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "node scripts/build-pages.mjs",
    "test:static": "node --test tests/*.test.mjs",
    "test:browser": "playwright test",
    "test": "npm run test:static && npm run test:browser"
  },
  "dependencies": {
    "d3": "7.9.0"
  },
  "devDependencies": {
    "@playwright/test": "1.62.1"
  }
}
```

Run `npm install` to create the lockfile and install the exact dependencies.

- [ ] **Step 2: Write the failing static compatibility tests**

Create `tests/site-compatibility.test.mjs`:

```js
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "NSIS-Current State & Projection");
const readSite = relative => readFile(path.join(site, relative), "utf8");

test("site uses local D3 and portable fonts", async () => {
  const [lifecycle, styles, theme] = await Promise.all([
    readSite("lifecycle-chart.html"),
    readSite("styles.css"),
    readSite("site-theme.css")
  ]);

  assert.doesNotMatch(lifecycle, /cdn\.jsdelivr\.net|fonts\.(?:googleapis|gstatic)\.com/);
  assert.match(lifecycle, /src="vendor\/d3\/d3\.min\.js"/);
  assert.doesNotMatch(`${lifecycle}\n${styles}\n${theme}`, /\bInter\b/);
  assert.match(theme, /--font-sans:/);
  assert.match(styles, /font-family:var\(--font-sans\)/);
  assert.match(lifecycle, /font-family:var\(--font-sans\)/);

  await access(path.join(site, "vendor/d3/d3.min.js"));
  await access(path.join(site, "vendor/d3/LICENSE"));
  await access(path.join(site, ".nojekyll"));
});

test("HTML local assets resolve inside the website directory", async () => {
  for (const pageName of ["index.html", "lifecycle-chart.html"]) {
    const html = await readSite(pageName);
    const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);

    for (const reference of references) {
      if (/^(?:https?:|mailto:|tel:|#)/.test(reference)) continue;
      const localPath = reference.split(/[?#]/, 1)[0];
      await access(path.resolve(site, localPath));
    }
  }
});

test("lifecycle JavaScript fallback matches the JSON dataset", async () => {
  const [adapter, jsonText] = await Promise.all([
    readSite("data/lifecycle-data.js"),
    readSite("data/lifecycle-data.json")
  ]);
  const adapterJson = adapter
    .replace(/^window\.LIFECYCLE_DATA\s*=\s*/, "")
    .replace(/;\s*$/, "");
  assert.deepEqual(JSON.parse(adapterJson), JSON.parse(jsonText));
});
```

- [ ] **Step 3: Run the static test and verify the intended failure**

Run: `npm run test:static`

Expected: FAIL in `site uses local D3 and portable fonts` because the page still references jsDelivr, still names Inter, and has no vendored D3 or `.nojekyll`.

- [ ] **Step 4: Vendor the fixed D3 distribution**

Create `NSIS-Current State & Projection/vendor/d3`, then mechanically copy:

```bash
cp node_modules/d3/dist/d3.min.js "NSIS-Current State & Projection/vendor/d3/d3.min.js"
cp node_modules/d3/LICENSE "NSIS-Current State & Projection/vendor/d3/LICENSE"
```

Create `NSIS-Current State & Projection/.nojekyll` containing:

```text
Static files are deployed as authored; Jekyll processing is disabled.
```

- [ ] **Step 5: Apply the universal font stack and local D3 path**

Add this rule at the start of `site-theme.css`:

```css
:root{
  --font-sans:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;
}
```

In `styles.css`, replace the body font declaration with:

```css
font-family:var(--font-sans);
```

In `lifecycle-chart.html`, replace the D3 script with:

```html
<script src="vendor/d3/d3.min.js"></script>
```

Replace the lifecycle body font with `font-family:var(--font-sans);`, update its missing-D3 message to point to `vendor/d3/d3.min.js`, and use this portable declaration for exported PNG SVG text:

```js
style.textContent = 'text{font-family:Arial,"Noto Sans",sans-serif}.stageArc{stroke:#fff}.policyArc{stroke:none}';
```

- [ ] **Step 6: Run static checks and syntax checks**

Run:

```bash
npm run test:static
node --check "NSIS-Current State & Projection/script.js"
node --check "NSIS-Current State & Projection/site-menu.js"
```

Expected: all three commands exit 0; the Node test runner reports 3 passing tests.

- [ ] **Step 7: Commit the compatibility foundation**

```bash
git add .gitignore package.json package-lock.json tests/site-compatibility.test.mjs "NSIS-Current State & Projection"
git commit -m "feat: make NSIS site self-contained for Pages"
```

---

### Task 2: Browser Functional Coverage and Storage Hardening

**Files:**

- Create: `playwright.config.mjs`
- Create: `tests/site-smoke.spec.mjs`
- Modify: `NSIS-Current State & Projection/site-menu.js`

**Interfaces:**

- Consumes: the self-contained site from Task 1 and Chromium installed by Playwright.
- Produces: `npm run test:browser`, capable of testing either the local HTTP server or `PLAYWRIGHT_BASE_URL`.

- [ ] **Step 1: Add Playwright configuration**

Create `playwright.config.mjs`:

```js
import { defineConfig } from "@playwright/test";

const remoteBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: remoteBaseUrl || "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: remoteBaseUrl ? undefined : {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory "NSIS-Current State & Projection"',
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }]
});
```

Install the browser once locally:

```bash
npx playwright install chromium
```

- [ ] **Step 2: Write browser smoke tests, including the failing storage test**

Create `tests/site-smoke.spec.mjs`:

```js
import { expect, test } from "@playwright/test";

function capturePageErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  return errors;
}

test("Knowledge Hub calculator, tabs, themes, and mobile navigation work", async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/Knowledge Hub/);
  await expect(page.locator("#statusOut")).toHaveText("Calculated");

  const originalPayroll = await page.locator("#payrollOut").textContent();
  await page.locator("#workers").fill("2000000");
  await expect(page.locator("#payrollOut")).not.toHaveText(originalPayroll);
  await expect(page.locator("#eisResults .projection-table tbody tr")).toHaveCount(5);

  await page.getByRole("tab", { name: /Social insurance/ }).click();
  await expect(page.locator("#insurance")).toBeVisible();
  await expect(page.locator("#assistance")).toBeHidden();

  await page.locator("#themeSelect").selectOption("midnight");
  await expect(page.locator("body")).toHaveAttribute("data-theme", "midnight");
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-theme", "midnight");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator(".site-nav")).toHaveClass(/menu-open/);
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "true");
  expect(errors).toEqual([]);
});

test("theme and menu still initialize when localStorage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { throw new DOMException("Storage blocked", "SecurityError"); }
    });
  });
  const errors = capturePageErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator(".site-nav")).toHaveClass(/menu-open/);
  await page.locator("#themeSelect").selectOption("ocean");
  await expect(page.locator("body")).toHaveAttribute("data-theme", "ocean");
  expect(errors).toEqual([]);
});

test("Lifecycle chart renders, filters, searches, selects, and downloads", async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.route("**/data/lifecycle-data.json*", route => route.abort());
  await page.goto("/lifecycle-chart.html");
  await expect(page).toHaveTitle(/Lifecycle Chart/);
  await expect(page.locator("#chart .policyArc").first()).toBeVisible();
  const initialRings = await page.locator("#chart .policyArc").count();
  expect(initialRings).toBeGreaterThan(10);

  await page.locator("#filters button", { hasText: "Contributory / NSIS" }).click();
  await expect(page.locator("#countLabel")).toContainText(/shown|selected/);
  await page.locator("#searchInput").fill("maternity");
  await expect(page.locator("#schemeList .schemeCard")).toHaveCount(1);
  await page.locator("#resetBtn").click();

  await page.locator("#chart .policyArc").first().click();
  await expect(page.locator("#detailTitle")).not.toHaveText("Hover or click a policy ring");

  const svgDownload = page.waitForEvent("download");
  await page.locator("#svgBtn").click();
  expect((await svgDownload).suggestedFilename()).toMatch(/\.svg$/);

  const pngDownload = page.waitForEvent("download");
  await page.locator("#pngBtn").click();
  expect((await pngDownload).suggestedFilename()).toMatch(/\.png$/);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 3: Run the browser tests and verify the storage failure**

Run: `npm run test:browser`

Expected: the blocked-storage test fails because `site-menu.js` reads `localStorage` without a guard. Record any unrelated existing functional failure and fix its selector only if the UI behavior itself is correct.

- [ ] **Step 4: Harden theme storage without changing public behavior**

In `site-menu.js`, add this adapter immediately after `THEMES`:

```js
  const themeStorage = {
    get(){
      try { return window.localStorage.getItem("nsisSiteTheme"); }
      catch { return null; }
    },
    set(theme){
      try { window.localStorage.setItem("nsisSiteTheme", theme); }
      catch { /* Keep the in-page theme when storage is unavailable. */ }
    }
  };
```

Replace `localStorage.getItem("nsisSiteTheme")` with `themeStorage.get()` and replace `localStorage.setItem("nsisSiteTheme", safeTheme)` with `themeStorage.set(safeTheme)`.

- [ ] **Step 5: Run the full local test suite**

Run: `npm test`

Expected: the static suite reports 3 passes; Playwright reports 3 passes and no page errors.

- [ ] **Step 6: Commit browser coverage and storage hardening**

```bash
git add playwright.config.mjs tests/site-smoke.spec.mjs "NSIS-Current State & Projection/site-menu.js"
git commit -m "test: cover Pages interactions in Chromium"
```

---

### Task 3: Tested Pages Artifact and GitHub Pages Workflow

**Files:**

- Create: `tests/pages-artifact.test.mjs`
- Create: `scripts/build-pages.mjs`
- Create: `.github/workflows/pages.yml`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**

- Consumes: `npm test` from Tasks 1–2 and the website directory.
- Produces: a tested `_site` artifact containing only the publishable website, plus deployment from pushes to `main`.

- [ ] **Step 1: Write the failing Pages artifact behavior test**

Create `tests/pages-artifact.test.mjs`:

```js
import assert from "node:assert/strict";
import { access, mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("Pages build publishes the complete website without repository-only documents", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "ssu-pages-test-"));
  const output = path.join(tempRoot, "artifact");
  const result = spawnSync(process.execPath, ["scripts/build-pages.mjs", "--output", output], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  await Promise.all([
    access(path.join(output, "index.html")),
    access(path.join(output, "lifecycle-chart.html")),
    access(path.join(output, "vendor/d3/d3.min.js")),
    access(path.join(output, "data/lifecycle-data.json")),
    access(path.join(output, ".nojekyll"))
  ]);
  const html = await readFile(path.join(output, "lifecycle-chart.html"), "utf8");
  assert.match(html, /src="vendor\/d3\/d3\.min\.js"/);
  await assert.rejects(access(path.join(output, "Math Functions.pdf")));
  await assert.rejects(access(path.join(output, "docs")));
});
```

- [ ] **Step 2: Run the artifact test and verify it fails**

Run: `npm run test:static`

Expected: FAIL because `scripts/build-pages.mjs` does not exist and the spawned Node process exits nonzero.

- [ ] **Step 3: Implement the minimal Pages artifact builder**

Create `scripts/build-pages.mjs`:

```js
import { cp, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "NSIS-Current State & Projection");
const outputFlag = process.argv.indexOf("--output");
const output = path.resolve(outputFlag >= 0 ? process.argv[outputFlag + 1] : path.join(root, "_site"));

if (!output || output === root || output === path.parse(output).root) {
  throw new Error(`Refusing unsafe Pages output path: ${output}`);
}

await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });
```

Add `_site/` to `.gitignore` and add this script to `package.json`:

```json
"build": "node scripts/build-pages.mjs"
```

- [ ] **Step 4: Run the artifact test and build the real artifact**

Run:

```bash
npm run test:static
npm run build
```

Expected: the Node suite reports 4 passing tests and `_site/index.html`, `_site/lifecycle-chart.html`, `_site/vendor/d3/d3.min.js`, and `_site/.nojekyll` exist.

- [ ] **Step 5: Add the Pages workflow using the tested artifact**

Create `.github/workflows/pages.yml`:

```yaml
name: Test and deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v6
      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Install Chromium
        run: npx playwright install --with-deps chromium
      - name: Verify static site
        run: npm test
      - name: Build Pages artifact
        run: npm run build
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: '_site'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy Pages artifact
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 6: Re-run the full suite and validate the workflow diff**

Run:

```bash
npm test
git diff --check
```

Expected: Node reports 4 passing static tests, Playwright reports 3 passes, and `git diff --check` exits 0.

- [ ] **Step 7: Commit the Pages builder and workflow**

```bash
git add .github/workflows/pages.yml scripts/build-pages.mjs tests/pages-artifact.test.mjs .gitignore package.json
git commit -m "ci: deploy NSIS website to GitHub Pages"
```

---

### Task 4: Repository Documentation and Replacement Inventory

**Files:**

- Create: `README.md`
- Modify: `NSIS-Current State & Projection/README.md`
- Track: `Math Equations/**`
- Track: `Math Functions.docx`
- Track: `Math Functions.pdf`
- Track: `NSIS-Current State & Projection.zip`

**Interfaces:**

- Consumes: the verified website and existing local supporting documents.
- Produces: the complete replacement Git tree that will become remote `main`.

- [ ] **Step 1: Document the repository and website commands**

Create root `README.md`:

````markdown
# SSU Bangladesh Tools

This repository contains National Social Insurance Scheme materials for Bangladesh, including the current-state and projection website, mathematical documentation, and supporting source files.

## Published website

The website in `NSIS-Current State & Projection` is published through GitHub Pages:

<https://tnibir.github.io/SSU-Bangladesh/>

## Local verification

Node.js 20 or newer is required.

```bash
npm ci
npx playwright install chromium
npm test
```

The website can also be served directly:

```bash
python3 -m http.server 8000 --directory "NSIS-Current State & Projection"
```

Then open <http://127.0.0.1:8000/>.
````

Append to the website README:

```markdown
## GitHub Pages compatibility

The site uses only relative asset paths, a local D3 7.9.0 distribution, and a cross-platform system-font stack. Run the root-level `npm test` command before publishing changes.
```

- [ ] **Step 2: Verify ignored transient files and repository contents**

Run:

```bash
git check-ignore .DS_Store '~$IS_Policy_Projection_Mathematical_Functions.docx'
git status --short
```

Expected: both transient files are printed by `git check-ignore`; all intended documents and source directories appear as untracked or modified, with no old remote-only HTML files.

- [ ] **Step 3: Run fresh verification before staging all intended content**

Run:

```bash
npm test
git diff --check
```

Expected: 4 static tests and 3 Playwright tests pass; the diff check exits 0.

- [ ] **Step 4: Stage the complete local replacement and inspect it**

```bash
git add .
git status --short
git diff --cached --check
git diff --cached --stat
```

Expected: `.DS_Store`, `node_modules`, Playwright artifacts, and the `~$` Office lock file are absent. PDFs, DOCX, ZIP, LaTeX, website, tests, workflow, README, spec, and plan are present.

- [ ] **Step 5: Commit the replacement inventory**

```bash
git commit -m "docs: add SSU Bangladesh project materials"
```

---

### Task 5: Destructive Remote Replacement and Live Pages Verification

**Files:**

- No new source files.
- Mutates: `https://github.com/tnibir/SSU-Bangladesh.git` branch history and GitHub Pages settings.

**Interfaces:**

- Consumes: locally verified `main`, authenticated `tnibir` GitHub access, and the Pages workflow.
- Produces: unrelated remote `main` plus the live replacement Pages deployment.

- [ ] **Step 1: Capture local and old-remote identities before mutation**

Run:

```bash
git status --short
git log --oneline --decorate --max-count=10
git ls-remote https://github.com/tnibir/SSU-Bangladesh.git refs/heads/main
gh auth status
```

Expected: local status is clean; local history begins at the new design root commit; the old remote head is `f1b534e06415f6cdc8d0b9525f7a8b3bb522bf8a`; authentication may still report the known expired token.

- [ ] **Step 2: Reauthenticate the GitHub CLI if required**

Run `gh auth login -h github.com -w` and complete the browser/device authorization as `tnibir`. Then run:

```bash
gh auth status
gh api user --jq .login
```

Expected: both commands identify an authenticated `tnibir` account with sufficient repository/workflow access.

- [ ] **Step 3: Configure and validate the remote target**

```bash
git remote add origin https://github.com/tnibir/SSU-Bangladesh.git
git remote -v
git ls-remote origin refs/heads/main
```

If `origin` already exists, use `git remote set-url origin https://github.com/tnibir/SSU-Bangladesh.git`. Confirm the URL and old head exactly before continuing.

- [ ] **Step 4: Run the final local verification gate**

```bash
npm test
git status --short
git rev-parse HEAD
```

Expected: 4 static tests and 3 Playwright tests pass; status is clean; record the replacement commit ID.

- [ ] **Step 5: Force-push the approved unrelated history**

Run:

```bash
git push --force --set-upstream origin main
```

Expected: remote `main` changes from old head `f1b534e06415f6cdc8d0b9525f7a8b3bb522bf8a` to the recorded local replacement commit.

- [ ] **Step 6: Switch Pages to workflow publication**

Run:

```bash
gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  repos/tnibir/SSU-Bangladesh/pages \
  -f build_type=workflow
```

Expected: HTTP 204 with no response body. Then confirm:

```bash
gh api repos/tnibir/SSU-Bangladesh/pages --jq '{build_type,html_url,status}'
```

Expected: `build_type` is `workflow` and `html_url` is `https://tnibir.github.io/SSU-Bangladesh/`.

- [ ] **Step 7: Monitor the Pages run to completion**

```bash
gh run list --repo tnibir/SSU-Bangladesh --workflow pages.yml --limit 1
```

Copy the displayed run ID and run `gh run watch RUN_ID --repo tnibir/SSU-Bangladesh --exit-status` with that numeric ID. Expected: both `build` and `deploy` jobs complete successfully. If the run fails, inspect the same ID with `gh run view RUN_ID --repo tnibir/SSU-Bangladesh --log-failed`, correct the reported cause through a tested commit, push, and monitor the replacement run.

- [ ] **Step 8: Verify remote history, tree, and live assets**

```bash
git fetch origin main
git rev-parse HEAD
git rev-parse origin/main
git merge-base --is-ancestor f1b534e06415f6cdc8d0b9525f7a8b3bb522bf8a origin/main
gh api 'repos/tnibir/SSU-Bangladesh/git/trees/main?recursive=1' --jq '.tree[].path'
curl -sS -I https://tnibir.github.io/SSU-Bangladesh/
curl -sS -I https://tnibir.github.io/SSU-Bangladesh/lifecycle-chart.html
curl -sS -I https://tnibir.github.io/SSU-Bangladesh/vendor/d3/d3.min.js
curl -sS -I https://tnibir.github.io/SSU-Bangladesh/data/lifecycle-data.json
```

Expected: local and remote commit IDs match; the ancestry command exits 1, proving the old head is not an ancestor; the intended replacement files are listed; every live URL returns HTTP 200.

- [ ] **Step 9: Run live browser smoke tests**

```bash
PLAYWRIGHT_BASE_URL=https://tnibir.github.io/SSU-Bangladesh npm run test:browser
```

Expected: all 3 Chromium smoke tests pass against the deployed site with no JavaScript page errors.

- [ ] **Step 10: Record final deployment evidence**

Run:

```bash
git status --short
gh run list --repo tnibir/SSU-Bangladesh --workflow pages.yml --limit 1
gh api repos/tnibir/SSU-Bangladesh/pages --jq '{build_type,html_url,status}'
```

Expected: the local tree is clean, the latest workflow is successful, and GitHub reports the workflow-backed public Pages URL.

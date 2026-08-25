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
      if (/^(?:https?:|mailto:|tel:|#)/.test(reference) || reference.includes("${")) continue;
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

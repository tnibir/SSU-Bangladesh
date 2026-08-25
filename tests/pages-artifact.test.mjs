import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("Pages build publishes the complete website without repository-only documents", async t => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "ssu-pages-test-"));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
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
  await assert.rejects(access(path.join(output, ".DS_Store")));
  await assert.rejects(access(path.join(output, "Math Functions.pdf")));
  await assert.rejects(access(path.join(output, "docs")));
});

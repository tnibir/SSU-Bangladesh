import { expect, test } from "@playwright/test";

function capturePageErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  return errors;
}

test("Knowledge Hub calculator, tabs, themes, and mobile navigation work", async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.goto("./");
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
  await page.goto("./");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator(".site-nav")).toHaveClass(/menu-open/);
  await page.locator("#themeSelect").selectOption("ocean");
  await expect(page.locator("body")).toHaveAttribute("data-theme", "ocean");
  expect(errors).toEqual([]);
});

test("Lifecycle chart renders, filters, searches, selects, and downloads", async ({ page }) => {
  const errors = capturePageErrors(page);
  await page.route("**/data/lifecycle-data.json*", route => route.abort());
  await page.goto("lifecycle-chart.html");
  await expect(page).toHaveTitle(/Lifecycle Chart/);
  await expect(page.locator("#chart .policyArc").first()).toBeVisible();
  const initialRings = await page.locator("#chart .policyArc").count();
  expect(initialRings).toBeGreaterThan(10);

  await page.locator("#filters button", { hasText: "Contributory / NSIS" }).click();
  await expect(page.locator("#countLabel")).toContainText(/shown|selected/);
  await page.locator("#searchInput").fill("maternity");
  const searchMatches = await page.locator("#schemeList .schemeCard").count();
  expect(searchMatches).toBeGreaterThan(0);
  expect(searchMatches).toBeLessThan(initialRings);
  await page.locator("#resetBtn").click();

  const firstRing = page.locator("#chart .policyArc").first();
  await firstRing.scrollIntoViewIfNeeded();
  const ringPoint = await firstRing.evaluate(path => {
    const point = path.getPointAtLength(path.getTotalLength() * 0.25);
    const screenPoint = point.matrixTransform(path.getScreenCTM());
    return { x: screenPoint.x, y: screenPoint.y };
  });
  const hitClass = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.getAttribute("class") || "",
    ringPoint
  );
  expect(hitClass).toContain("policyArc");
  await page.mouse.click(ringPoint.x, ringPoint.y);
  await expect(page.locator("#detailTitle")).not.toHaveText("Hover or click a policy ring");

  const svgDownload = page.waitForEvent("download");
  await page.locator("#svgBtn").click();
  expect((await svgDownload).suggestedFilename()).toMatch(/\.svg$/);

  const pngDownload = page.waitForEvent("download");
  await page.locator("#pngBtn").click();
  expect((await pngDownload).suggestedFilename()).toMatch(/\.png$/);
  expect(errors).toEqual([]);
});

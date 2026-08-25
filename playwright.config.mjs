import { defineConfig } from "@playwright/test";

const remoteBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = remoteBaseUrl
  ? `${remoteBaseUrl.replace(/\/$/, "")}/`
  : "http://127.0.0.1:4173/";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL,
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

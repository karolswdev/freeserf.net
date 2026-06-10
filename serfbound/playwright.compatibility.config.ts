import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "compatibility.spec.ts",
  outputDir: "./test-results/browser-compatibility",
  reporter: [["list"]],
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --port 4174",
    reuseExistingServer: !process.env["CI"],
    timeout: 30_000,
    url: "http://127.0.0.1:4174",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" },
    },
    {
      name: "desktop-firefox",
      use: { ...devices["Desktop Firefox"], browserName: "firefox" },
    },
    {
      name: "desktop-webkit",
      use: { ...devices["Desktop Safari"], browserName: "webkit" },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], browserName: "chromium" },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 15"], browserName: "webkit" },
    },
  ],
});

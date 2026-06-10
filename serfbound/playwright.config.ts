import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testIgnore: "**/compatibility.spec.ts",
  outputDir: "./test-results/browser",
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    reuseExistingServer: !process.env["CI"],
    timeout: 30_000,
    url: "http://127.0.0.1:4173",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

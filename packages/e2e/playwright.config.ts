import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./src/ports.ts";

// One server with two boards for all tests: they share its stations, so they run one at a time.
export default defineConfig({
  testDir: "tests",
  // The visual suite has its own config (playwright.visual.config.ts) and only runs on demand.
  testIgnore: /visual\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "node --experimental-strip-types src/start.ts",
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

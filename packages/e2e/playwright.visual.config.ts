import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./src/ports.ts";

// The visual suite (tailwind ticket 01): every page and state as a screenshot, compared against
// a committed baseline. Run on demand (`pnpm --filter @n4/e2e visual`), never in CI: fonts render
// differently on Linux. Its own server, with players whose ids (and so avatar colours) never change.
export default defineConfig({
  testDir: "tests",
  testMatch: /visual\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 180_000,
  expect: {
    toHaveScreenshot: { maxDiffPixels: 0, animations: "disabled", caret: "hide", scale: "css" },
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    locale: "en-GB",
    timezoneId: "Europe/Zurich",
    trace: "retain-on-failure",
  },
  projects: [{ name: "visual" }],
  webServer: {
    command: "node --experimental-strip-types src/start.ts",
    env: { N4_E2E_PLAYERS: "Ann,Bob,Cid,Dee,Eve,Fay" },
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

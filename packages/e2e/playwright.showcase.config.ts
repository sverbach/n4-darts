import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./src/ports.ts";

process.env.N4_E2E_DATA_DIR = join(tmpdir(), "n4-showcase");

export default defineConfig({
  testDir: "tests",
  testMatch: /showcase\.spec\.ts/,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 1_800_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    locale: "en-GB",
    reducedMotion: "reduce",
    timezoneId: "Europe/Zurich",
  },
  webServer: {
    command: "node --experimental-strip-types src/start.ts",
    env: {
      N4_E2E_PLAYERS: "Ann,Bob,Cid,Dee,Eve,Fay,Gus,Hal",
      N4_E2E_DATA_DIR: process.env.N4_E2E_DATA_DIR,
    },
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

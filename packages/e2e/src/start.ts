// Playwright's web server: two simulated boards and the built app on a fresh database, like
// `pnpm dev:sim` but from the production build. Ports are fixed so the tests can reach the boards.

import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createBoardSim } from "@n4/board-sim";
import { BOARD_PORTS, PIN, SERVER_PORT } from "./ports.ts";

const sims = await Promise.all(BOARD_PORTS.map((port) => createBoardSim({ port })));
const dataDir = mkdtempSync(join(tmpdir(), "n4-e2e-"));
const main = fileURLToPath(new URL("../../server/dist/main.js", import.meta.url));

const server = spawn(process.execPath, [main], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(SERVER_PORT),
    DATA_DIR: dataDir,
    ADMIN_PIN: PIN,
    STATIONS: BOARD_PORTS.map((port, i) => `${i + 1}=http://localhost:${port}`).join(","),
  },
});
console.log(`e2e: boards on ${BOARD_PORTS.join(", ")}, data in ${dataDir}`);

const stop = async () => {
  server.kill("SIGTERM");
  await Promise.all(sims.map((sim) => sim.close()));
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => {
  if (code) process.exit(code);
});

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

// The visual suite needs the same players with the same ids every run (an avatar's colour comes
// from its player's id): `N4_E2E_PLAYERS=Ann,Bob` creates them as p-ann, p-bob before the server
// starts.
const seeded = process.env.N4_E2E_PLAYERS?.split(",").filter(Boolean) ?? [];
if (seeded.length > 0) {
  const { openDb } = await import(new URL("../../server/dist/db.js", import.meta.url).href);
  const db = openDb(join(dataDir, "n4-darts.db"));
  for (const name of seeded) db.addPlayer({ id: `p-${name.toLowerCase()}`, name, archived: false });
  db.close();
}

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

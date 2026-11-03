import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp, buildPublicApp } from "./app.ts";
import { openDb } from "./db.ts";
import { startBackups } from "./operations/backups.ts";
import { createStationRegistry } from "./stations/stations.ts";

const port = Number(process.env.PORT ?? 3000);
const webDir = process.env.WEB_DIR ?? fileURLToPath(new URL("../../web/dist", import.meta.url));
const dataDir = process.env.DATA_DIR ?? "data";
// Seeds the stations once, on a fresh database; after that they're managed in /admin.
const seed = process.env.STATIONS ?? "1=http://localhost:3180";

const adminPin = process.env.ADMIN_PIN || undefined;

if (process.env.N4_PUBLIC === "1") {
  const pin = process.env.N4_PUBLIC_PIN;
  if (!pin) {
    console.error("N4_PUBLIC_PIN is not set: the public site needs a password");
    process.exit(1);
  }
  const db = openDb(join(dataDir, "n4-darts.db"), { readOnly: true });
  const app = buildPublicApp({ db, pin, webDir });
  await app.listen({ host: "0.0.0.0", port });
  console.log(`n4-darts public site (read-only) listening on http://0.0.0.0:${port}`);
  const shutdown = async () => {
    await app.close();
    db.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} else {
  await startRoom();
}

async function startRoom() {
  mkdirSync(dataDir, { recursive: true });
  const db = openDb(join(dataDir, "n4-darts.db"));
  const backups = startBackups(db, join(dataDir, "backups"));
  const stations = createStationRegistry(db, { seed });

  const calloutsDir = join(dataDir, "callouts");
  const app = buildApp({ webDir, stations, db, adminPin, scheduler: {}, calloutsDir });
  await app.listen({ host: "0.0.0.0", port });
  console.log(`n4-darts listening on http://0.0.0.0:${port}`);
  if (!adminPin) console.warn("ADMIN_PIN is not set: /admin is open to everyone on the network");
  if (stations.seeded)
    console.log("stations seeded from STATIONS; manage them in /admin from now on");
  else if (process.env.STATIONS) console.log("STATIONS ignored: stations are managed in /admin");
  for (const config of stations.configs()) {
    console.log(`station ${config.id} (${config.name}) → board ${config.boardUrl}`);
  }

  const shutdown = async () => {
    backups.stop();
    stations.close();
    await app.close();
    db.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

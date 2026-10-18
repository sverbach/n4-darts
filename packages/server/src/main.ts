import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.ts";
import { openDb } from "./db.ts";
import { parseStationsConfig, startStation } from "./stations.ts";

const port = Number(process.env.PORT ?? 3000);
const webDir = process.env.WEB_DIR ?? fileURLToPath(new URL("../../web/dist", import.meta.url));
const dataDir = process.env.DATA_DIR ?? "data";
// Until stations are configurable in /admin: STATIONS=1=http://192.168.1.139:3180,2=http://...
const stationsConfig = parseStationsConfig(process.env.STATIONS ?? "1=http://localhost:3180");

const adminPin = process.env.ADMIN_PIN || undefined;

mkdirSync(dataDir, { recursive: true });
const db = openDb(join(dataDir, "n4-darts.db"));
const stations = stationsConfig.map((config) => startStation(config, db));

const app = buildApp({ webDir, stations: stations.map((s) => s.station), db, adminPin });
await app.listen({ host: "0.0.0.0", port });
console.log(`n4-darts listening on http://0.0.0.0:${port}`);
if (!adminPin) console.warn("ADMIN_PIN is not set: /admin is open to everyone on the network");
for (const config of stationsConfig) console.log(`station ${config.id} → board ${config.boardUrl}`);

const shutdown = async () => {
  for (const s of stations) s.close();
  await app.close();
  db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

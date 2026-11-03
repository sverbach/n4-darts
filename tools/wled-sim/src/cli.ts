// Usage: pnpm --filter @n4/wled-sim sim [--port 3190] [--host 0.0.0.0] [--name "Room lights"]
import { parseArgs } from "node:util";
import { createWledSim } from "./sim.ts";

const { values } = parseArgs({
  args: process.argv.slice(2).filter((arg) => arg !== "--"),
  options: {
    port: { type: "string", default: "3190" },
    host: { type: "string", default: "0.0.0.0" },
    name: { type: "string", default: "WLED sim" },
  },
});

const sim = await createWledSim({
  port: Number(values.port),
  host: values.host,
  name: values.name,
});
console.log(
  `wled-sim "${values.name}" on http://localhost:${sim.port}/ (shows the preset that's on)`,
);

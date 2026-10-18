// Usage: pnpm sim [--port 3180] [--boards 2] [--host 0.0.0.0] [--replay <file>] [--speed 10]
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { parseRecording, replay } from "./replay.ts";
import { createBoardSim } from "./sim.ts";

const { values } = parseArgs({
  // Tolerate `pnpm sim -- --port 3180`, where pnpm passes the separator through.
  args: process.argv.slice(2).filter((arg) => arg !== "--"),
  options: {
    port: { type: "string", default: "3180" },
    /** Several boards on consecutive ports, starting at --port. */
    boards: { type: "string", default: "1" },
    host: { type: "string", default: "0.0.0.0" },
    replay: { type: "string" },
    speed: { type: "string", default: "1" },
  },
});

const count = Number(values.boards);
if (values.replay && count > 1) throw new Error("--replay drives a single board");
const sims = [];
for (let i = 0; i < count; i++) {
  const sim = await createBoardSim({ port: Number(values.port) + i, host: values.host });
  console.log(`board-sim (Board Manager 2.0.2) on http://localhost:${sim.port}/ (click to throw)`);
  sims.push(sim);
}
const sim = sims[0] as (typeof sims)[number];

if (values.replay) {
  // pnpm runs this from tools/board-sim; resolve the path from where the command was typed.
  const file = resolve(process.env.INIT_CWD ?? process.cwd(), values.replay);
  const entries = parseRecording(readFileSync(file, "utf8"));
  console.log(`replaying ${entries.length} states from ${values.replay} at ${values.speed}x`);
  await replay(sim, entries, Number(values.speed));
  console.log("replay finished; still serving the last state");
} else {
  console.log(`throw darts with: curl -X POST localhost:${sim.port}/sim/dart -d '{"name":"T20"}'`);
  console.log(`              and: curl -X POST localhost:${sim.port}/sim/takeout`);
}

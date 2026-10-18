import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type BoardSim,
  type BoardState,
  createBoardSim,
  parseRecording,
  throwFor,
} from "./index.ts";

const recording = readFileSync(
  new URL("../../../prototypes/recordings/2026-10-18-board1.txt", import.meta.url),
  "utf8",
);

let sim: BoardSim;
afterEach(async () => {
  await sim?.close();
});

/** Connects like a real client and collects every state message. */
async function listen(board: BoardSim) {
  const states: BoardState[] = [];
  const ws = new WebSocket(`${board.url.replace("http", "ws")}/api/events`);
  ws.addEventListener("message", (e) => states.push(JSON.parse(String(e.data)).data));
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  return { states, ws };
}

describe("board simulator", () => {
  it("serves state and version like Board Manager 2.0.2", async () => {
    sim = await createBoardSim();

    expect(await (await fetch(`${sim.url}/api/version`)).text()).toBe("2.0.2");
    expect(await (await fetch(`${sim.url}/api/state`)).json()).toMatchObject({
      connected: true,
      running: true,
      status: "Throw",
      numThrows: 0,
    });
  });

  it("pushes a full snapshot per dart and stops detecting after three", async () => {
    sim = await createBoardSim();
    const { states } = await listen(sim);

    for (const dart of ["T20", "S5", "D1", "S20"]) sim.throwDart(dart);

    await vi.waitFor(() => expect(states).toHaveLength(3));
    expect(states.map((s) => [s.event, s.status, s.numThrows])).toEqual([
      ["Throw detected", "Throw", 1],
      ["Throw detected", "Throw", 2],
      ["Throw detected", "Takeout", 3],
    ]);
    expect(states[2]?.throws?.map((t) => t.segment.name)).toEqual(["T20", "S5", "D1"]);
  });

  it("goes through takeout started and finished, clearing the darts", async () => {
    sim = await createBoardSim();
    const { states } = await listen(sim);

    sim.throwDart("S20");
    sim.takeout();

    await vi.waitFor(() => expect(states).toHaveLength(3));
    expect(states[1]).toMatchObject({ event: "Takeout started", numThrows: 1 });
    expect(states[2]).toMatchObject({ event: "Takeout finished", numThrows: 0, status: "Throw" });
    expect(states[2]?.throws).toBeUndefined();
  });

  it("accepts start, stop and reset over the Board Manager API", async () => {
    sim = await createBoardSim();
    const { states } = await listen(sim);

    await fetch(`${sim.url}/api/stop`, { method: "PUT" });
    sim.throwDart("S20"); // ignored while stopped
    await fetch(`${sim.url}/api/start`, { method: "PUT" });
    await fetch(`${sim.url}/api/reset`, { method: "POST" });

    await vi.waitFor(() => expect(states).toHaveLength(5));
    expect(states.map((s) => s.event)).toEqual([
      "Stopping",
      "Stopped",
      "Starting",
      "Started",
      "Manual reset",
    ]);
  });

  it("refuses connections while offline and keeps detecting meanwhile", async () => {
    sim = await createBoardSim();
    sim.setOnline(false);
    sim.throwDart("T20");

    expect((await fetch(`${sim.url}/api/state`)).status).toBe(503);
    await expect(listen(sim)).rejects.toBeDefined();

    sim.setOnline(true);
    expect(await (await fetch(`${sim.url}/api/state`)).json()).toMatchObject({ numThrows: 1 });
  });
});

describe("simulated darts", () => {
  const recorded = parseRecording(recording)
    .flatMap((entry) => entry.state.throws ?? [])
    .filter((t) => !t.bouncer);

  it("match the segments of a real recording", () => {
    for (const real of recorded) {
      const simulated = throwFor(real.segment.name);
      expect(simulated.segment).toMatchObject({
        name: real.segment.name,
        number: real.segment.number,
        multiplier: real.segment.multiplier,
      });
    }
  });

  it("land in the same area of the board as real darts", () => {
    // Real T13 from the recording: (0.593, 0.178).
    const t13 = throwFor("T13").coords;
    expect(t13.x).toBeCloseTo(0.59, 1);
    expect(t13.y).toBeCloseTo(0.19, 1);
  });

  it("parses every state of the recording", () => {
    expect(parseRecording(recording).length).toBeGreaterThan(40);
  });
});

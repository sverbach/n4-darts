import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type BoardSim,
  type BoardState,
  createBoardSim,
  parseRecording,
  type SimView,
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

  it("reports nothing for a missed dart, but still sees it pulled", async () => {
    sim = await createBoardSim();
    const { states } = await listen(sim);

    sim.missDart();
    expect(states).toHaveLength(0);
    sim.takeout();

    await vi.waitFor(() => expect(states).toHaveLength(2));
    expect(states[1]).toMatchObject({ event: "Takeout finished", numThrows: 0 });
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

describe("control page", () => {
  const post = (path: string, body: unknown = {}) =>
    fetch(`${sim.url}${path}`, { method: "POST", body: JSON.stringify(body) });

  /** Connects like the control page and collects every view it's pushed. */
  async function watch(board: BoardSim) {
    const views: SimView[] = [];
    const ws = new WebSocket(`${board.url.replace("http", "ws")}/sim/events`);
    ws.addEventListener("message", (e) => views.push(JSON.parse(String(e.data))));
    await vi.waitFor(() => expect(views.length).toBeGreaterThan(0));
    return { views, ws, last: () => views.at(-1) as SimView };
  }

  it("is served at / with the port in the title", async () => {
    sim = await createBoardSim();
    const res = await fetch(`${sim.url}/`);

    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain(`<title>Board sim :${sim.port}</title>`);
    expect(html).toContain('data-name="T20"');
  });

  it("throws and revises darts at clicked coordinates", async () => {
    sim = await createBoardSim();

    await post("/sim/dart", { coords: { x: 0.01, y: 0.6 } });
    await post("/sim/dart", { name: "D16" });
    await post("/sim/revise", { index: 0, coords: { x: 0, y: 0 } });

    expect(sim.state.throws?.map((t) => t.segment.name)).toEqual(["Bull", "D16"]);
    expect(sim.state.throws?.[0]?.coords).toEqual({ x: 0, y: 0 });
  });

  it("resets, stops and starts like the buttons on the laptop", async () => {
    sim = await createBoardSim();
    sim.throwDart("T20");

    await post("/sim/reset");
    expect(sim.state).toMatchObject({ event: "Manual reset", numThrows: 0 });
    await post("/sim/stop");
    expect(sim.state).toMatchObject({ event: "Stopped", running: false });
    await post("/sim/start");
    expect(sim.state).toMatchObject({ event: "Started", running: true });
  });

  it("pushes state, online status and connected clients to the page, also while offline", async () => {
    sim = await createBoardSim();
    const page = await watch(sim);
    expect(page.last()).toMatchObject({ online: true, boardClients: 0 });

    const { ws } = await listen(sim);
    await vi.waitFor(() => expect(page.last().boardClients).toBe(1));

    sim.throwDart("T20");
    await vi.waitFor(() => expect(page.last().state.throws?.[0]?.segment.name).toBe("T20"));

    await post("/sim/offline");
    await vi.waitFor(() => expect(page.last()).toMatchObject({ online: false, boardClients: 0 }));
    expect((await fetch(`${sim.url}/`)).ok).toBe(true);
    expect(await (await fetch(`${sim.url}/sim/state`)).json()).toMatchObject({ online: false });

    ws.close();
    page.ws.close();
  });
});

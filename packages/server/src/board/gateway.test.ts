import { type BoardSim, createBoardSim } from "@n4/board-sim";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type BoardEvent, type BoardGateway, createBoardGateway } from "./gateway.ts";

let sim: BoardSim;
let gateway: BoardGateway;
afterEach(async () => {
  gateway?.close();
  await sim?.close();
});

/** Connects a gateway to `board`, or to a fresh simulator. */
async function connect(board?: BoardSim) {
  sim = board ?? (await createBoardSim());
  const events: BoardEvent[] = [];
  gateway = createBoardGateway({
    url: sim.url,
    onEvent: (e) => events.push(e),
    reconnectDelayMs: 10,
    maxReconnectDelayMs: 20,
  });
  await vi.waitFor(() => expect(gateway.online).toBe(true));
  events.length = 0;
  return events;
}

/** Event types, with the dart name for dart events: `DartDetected T20`. */
const summary = (events: BoardEvent[]) =>
  events.map((e) => ("name" in e ? `${e.type} ${e.name}@${e.index}` : e.type));

describe("board gateway", () => {
  it("reports each dart of a visit and the takeout", async () => {
    const events = await connect();

    sim.throwDart("T20");
    sim.throwDart("S5");
    sim.throwDart("D1");
    sim.takeout();

    await vi.waitFor(() =>
      expect(summary(events)).toEqual([
        "DartDetected T20@0",
        "DartDetected S5@1",
        "DartDetected D1@2",
        "TakeoutStarted",
        "TakeoutFinished",
      ]),
    );
    expect(events[0]).toMatchObject({ segment: { number: 20, multiplier: 3 }, bouncer: false });
  });

  it("reports misses and bounce-outs as darts scoring nothing", async () => {
    const events = await connect();

    sim.throwDart("M17");
    sim.throwDart("BOUNCE");

    await vi.waitFor(() => expect(events).toHaveLength(2));
    expect(events[0]).toMatchObject({ segment: { number: 17, multiplier: 0 } });
    expect(events[1]).toMatchObject({ segment: { number: 0, multiplier: 0 }, bouncer: true });
  });

  it("reports a dart the board changed its mind about", async () => {
    const events = await connect();

    sim.throwDart("S20");
    sim.throwDart("S1");
    sim.reviseDart(1, "T1");

    await vi.waitFor(() =>
      expect(summary(events)).toEqual([
        "DartDetected S20@0",
        "DartDetected S1@1",
        "DartRevised T1@1",
      ]),
    );
  });

  it("reports a takeout after fewer than three darts", async () => {
    const events = await connect();

    sim.throwDart("S20");
    sim.throwDart("S20");
    sim.takeout();

    await vi.waitFor(() =>
      expect(summary(events).slice(2)).toEqual(["TakeoutStarted", "TakeoutFinished"]),
    );
  });

  it("reports a takeout of darts detection missed altogether", async () => {
    const events = await connect();

    sim.missDart();
    sim.takeout();

    await vi.waitFor(() => expect(summary(events)).toEqual(["TakeoutStarted", "TakeoutFinished"]));
  });

  it("controls the board: reset, stop and start", async () => {
    const events = await connect();

    sim.throwDart("S20");
    await gateway.reset();
    await gateway.stop();
    await gateway.start();

    await vi.waitFor(() =>
      expect(summary(events)).toEqual([
        "DartDetected S20@0",
        "BoardReset",
        "BoardStopped",
        "BoardStarted",
      ]),
    );
  });

  it("reports a reset of an empty board too", async () => {
    const events = await connect();

    await gateway.reset();

    await vi.waitFor(() => expect(summary(events)).toEqual(["BoardReset"]));
  });

  it("doesn't report darts that were already on the board when it connected", async () => {
    const board = await createBoardSim();
    board.throwDart("T20");
    const events = await connect(board);

    sim.throwDart("S1");

    await vi.waitFor(() => expect(summary(events)).toEqual(["DartDetected S1@1"]));
  });

  it("catches up exactly once on a dart thrown while disconnected", async () => {
    const events = await connect();
    sim.throwDart("S20");
    await vi.waitFor(() => expect(events).toHaveLength(1));

    sim.setOnline(false);
    await vi.waitFor(() => expect(gateway.online).toBe(false));
    sim.throwDart("T19");
    sim.setOnline(true);
    await vi.waitFor(() => expect(gateway.online).toBe(true));
    sim.throwDart("D3");

    await vi.waitFor(() =>
      expect(summary(events)).toEqual([
        "DartDetected S20@0",
        "BoardOffline",
        "BoardOnline",
        "DartDetected T19@1",
        "DartDetected D3@2",
      ]),
    );
  });

  it("catches up on a takeout and a new visit while disconnected", async () => {
    const events = await connect();
    sim.throwDart("S20");
    await vi.waitFor(() => expect(events).toHaveLength(1));

    sim.setOnline(false);
    await vi.waitFor(() => expect(gateway.online).toBe(false));
    sim.takeout();
    sim.throwDart("S20");
    sim.setOnline(true);

    await vi.waitFor(() =>
      expect(summary(events)).toEqual([
        "DartDetected S20@0",
        "BoardOffline",
        "BoardOnline",
        "TakeoutFinished",
        "DartDetected S20@0",
      ]),
    );
  });
});

describe("what the board sends that doesn't fit", () => {
  const state = (data: unknown) => JSON.stringify({ type: "state", data });
  const t20 = {
    bouncer: false,
    coords: { x: 0, y: 0.6 },
    segment: { bed: "Triple", multiplier: 3, name: "T20", number: 20 },
  };

  it.each([
    ["a message that isn't JSON", () => "{nope", /^a message that isn't JSON$/],
    ["a message without a type", () => JSON.stringify({ data: {} }), /^type: /],
    ["a state without a status", () => state({ ...sim.state, status: 3 }), /^status: /],
    [
      "a dart with a multiplier of 4",
      () =>
        state({ ...sim.state, throws: [{ ...t20, segment: { ...t20.segment, multiplier: 4 } }] }),
      /^throws\.0\.segment\.multiplier: /,
    ],
    [
      "a dart without coordinates",
      () => state({ ...sim.state, throws: [{ ...t20, coords: null }] }),
      /^throws\.0\.coords: /,
    ],
  ])("drops %s and counts it; the next good one brings the dart in", async (_, message, reason) => {
    const events = await connect();

    sim.sendRaw(message());
    await vi.waitFor(() => expect(gateway.stats().rejected.count).toBe(1));
    expect(gateway.stats().rejected.last?.reason).toMatch(reason);
    expect(events).toEqual([]);

    sim.throwDart("T20");
    await vi.waitFor(() => expect(summary(events)).toEqual(["DartDetected T20@0"]));
    expect(gateway.online).toBe(true);
  });

  it("takes a snapshot with fields the board added, and drops them", async () => {
    const events = await connect();

    sim.sendRaw(
      state({
        ...sim.state,
        event: "Throw detected",
        firmware: "3.0",
        throws: [{ ...t20, confidence: 0.9 }],
      }),
    );
    await vi.waitFor(() => expect(summary(events)).toEqual(["DartDetected T20@0"]));
    expect(gateway.stats().rejected.count).toBe(0);
  });

  it("stays offline while a resync's state doesn't fit, and comes back once it does", async () => {
    await connect();
    const good = sim.state;
    sim.setOnline(false);
    await vi.waitFor(() => expect(gateway.online).toBe(false));

    sim.publish({ ...good, running: "yes" } as never);
    sim.setOnline(true);
    await vi.waitFor(() => expect(gateway.stats().rejected.count).toBeGreaterThan(1));
    expect(gateway.stats().rejected.last?.reason).toMatch(/^GET \/api\/state: running: /);
    expect(gateway.online).toBe(false);

    sim.publish(good);
    await vi.waitFor(() => expect(gateway.online).toBe(true));
  });
});

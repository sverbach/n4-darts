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

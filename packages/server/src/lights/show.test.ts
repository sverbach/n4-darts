import { type BoardSim, createBoardSim } from "@n4/board-sim";
import {
  defaultAroundTheClockSettings,
  defaultHighScoreSettings,
  defaultX01Settings,
  type MatchEvent,
  matchState,
  type X01State,
  x01Only,
} from "@n4/engine";
import { createWledSim, type WledSim } from "@n4/wled-sim";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DiagnosticsView, StationView } from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";
import { type RunningStation, startStation } from "../stations/stations.ts";
import { eventsBetween, seenOf } from "./show.ts";
import { createWledClient } from "./wled.ts";

/** Presets on the fake device, in DEFAULT_PRESETS' order. */
const IDLE = 1;
const PLAYING = 2;
const MATCH_START = 3;
const LEG_WON = 4;
const GAME_SHOT = 5;
const S180 = 6;
const BUST = 7;
const HIGH_CHECKOUT = 8;

let board: BoardSim | undefined;
let wled: WledSim | undefined;
let running: RunningStation | undefined;
let db: Db | undefined;
let close: (() => Promise<void>) | undefined;
afterEach(async () => {
  await close?.();
  running?.close();
  db?.close();
  await board?.close();
  await wled?.close();
  close = undefined;
  running = undefined;
  db = undefined;
  board = undefined;
  wled = undefined;
});

/** Station 1 on a simulated board, its lights on a fake WLED with every event set up. */
async function setup(events: Record<string, number> = {}) {
  board = await createBoardSim();
  wled = await createWledSim();
  db = openDb(":memory:");
  for (const id of ["ann", "bob"]) db.addPlayer({ id, name: id, archived: false });
  db.saveStation({ id: 1, name: "Station 1", boardUrl: board.url });
  running = startStation({ id: 1, boardUrl: board.url }, db, {
    reconnectDelayMs: 10,
    maxReconnectDelayMs: 20,
  });
  const app = buildApp({
    db,
    stations: [running.station],
    wled: createWledClient({ timeoutMs: 300 }),
  });
  close = () => app.close();
  const call = (method: string, url: string, payload?: object) =>
    app.inject({ method: method as "GET", url, ...(payload ? { payload } : {}) });
  const view = async () => (await call("GET", "/api/stations/1")).json() as StationView;
  await vi.waitFor(async () => expect((await view()).boardOnline).toBe(true));

  await call("POST", "/api/admin/lights/devices", { name: "Wall", url: wled.url });
  const seconds = (preset: number) => ({ preset, seconds: 1 });
  await call("PUT", "/api/admin/lights/stations/1", {
    deviceId: 1,
    idlePreset: IDLE,
    playingPreset: PLAYING,
    events: Object.fromEntries(Object.entries(events).map(([e, p]) => [e, seconds(p)])),
  });

  const command = (body: object) => call("POST", "/api/stations/1/commands", body);
  /** Darts, `/` for a takeout; waits for each to be counted. */
  const play = async (darts: string) => {
    for (const dart of darts.split(" ")) {
      const before = JSON.stringify((await view()).match?.state);
      if (dart === "/") (board as BoardSim).takeout();
      else (board as BoardSim).throwDart(dart);
      await vi.waitFor(async () =>
        expect(JSON.stringify((await view()).match?.state)).not.toBe(before),
      );
    }
  };
  const match = async (settings: object) => {
    await command({ type: "quickMatch", playerIds: ["ann", "bob"], settings });
    await command({ type: "startMatch" });
  };
  const last = () => (wled as WledSim).started.at(-1);
  return { call, command, play, match, last, wled: wled as WledSim };
}

describe("lights follow the match", () => {
  it("shows the idle preset, then playing once a match starts", async () => {
    const t = await setup();
    await vi.waitFor(() => expect(t.last()).toBe(IDLE));
    await t.match({ startScore: 101 });
    await vi.waitFor(() => expect(t.last()).toBe(PLAYING));
    await t.command({ type: "abandonMatch" });
    await vi.waitFor(() => expect(t.last()).toBe(IDLE));
  });

  it("starts the match start, bust, leg won and game shot presets, each back to playing", {
    timeout: 20_000,
  }, async () => {
    const t = await setup({
      matchStart: MATCH_START,
      bust: BUST,
      legWon: LEG_WON,
      gameShot: GAME_SHOT,
    });
    await t.match({ startScore: 101, legsToWin: 2 });
    await vi.waitFor(() => expect(t.last()).toBe(MATCH_START));
    await vi.waitFor(() => expect(t.last()).toBe(PLAYING), { timeout: 3000 });

    await t.play("T20 T20 /"); // Ann: 120 on 101, bust
    await vi.waitFor(() => expect(t.last()).toBe(BUST));
    await t.play("T20 S20 S1 /"); // Bob: 20 left
    await t.play("T20 S1 /"); // Ann: 40 left
    await t.play("S20"); // Bob checks out 20: leg 1
    await vi.waitFor(() => expect(t.last()).toBe(LEG_WON));
    await vi.waitFor(() => expect(t.last()).toBe(PLAYING), { timeout: 3000 });
    await t.play("/");

    await t.play("S20 S20 S20 /"); // Bob starts leg 2: 41 left
    await t.play("S1 /"); // Ann
    await t.play("S20 S20 S1"); // Bob checks out 41: the match
    await vi.waitFor(() => expect(t.last()).toBe(GAME_SHOT));
    expect(t.wled.started.filter((p) => p === MATCH_START)).toHaveLength(1);
    expect(t.wled.started.filter((p) => p === BUST)).toHaveLength(1);
  });

  it("starts the 180 preset on the third dart, and a high checkout before a leg won", {
    timeout: 20_000,
  }, async () => {
    const t = await setup({ s180: S180, legWon: LEG_WON, highCheckout: HIGH_CHECKOUT });
    await t.match({ startScore: 301, legsToWin: 2 });
    await vi.waitFor(() => expect(t.last()).toBe(PLAYING));

    await t.play("T20 T20");
    expect(t.wled.started).not.toContain(S180);
    await t.play("T20"); // Ann: 180, 121 left
    await vi.waitFor(() => expect(t.last()).toBe(S180));
    await t.play("/ S1 S1 S1 /"); // Bob
    await t.play("T20 T20 S1"); // Ann checks out 121: a high checkout and a leg
    await vi.waitFor(() => expect(t.last()).toBe(HIGH_CHECKOUT));
    expect(t.wled.started).not.toContain(LEG_WON);
  });

  it("tests an event from Admin → Lights and returns to the base", async () => {
    const t = await setup({ gameShot: GAME_SHOT });
    await vi.waitFor(() => expect(t.last()).toBe(IDLE));
    const res = await t.call("POST", "/api/admin/lights/stations/1/test", { event: "gameShot" });
    expect(res.statusCode).toBe(204);
    expect(t.last()).toBe(GAME_SHOT);
    await vi.waitFor(() => expect(t.last()).toBe(IDLE), { timeout: 3000 });
  });

  it("counts a device that's offline in diagnostics, and play goes on", async () => {
    const t = await setup({ matchStart: MATCH_START });
    await vi.waitFor(() => expect(t.last()).toBe(IDLE));
    t.wled.setOnline(false);
    await t.match({ startScore: 101 });
    await t.play("S20");

    await vi.waitFor(async () => {
      const view = (await t.call("GET", "/api/admin/diagnostics")).json() as DiagnosticsView;
      const device = view.lights.find((l) => l.device === t.wled.url);
      expect(device?.failed).toBeGreaterThan(0);
      expect(device?.lastError?.message).toMatch(/can't be reached/);
    });
    const station = (await t.call("GET", "/api/stations/1")).json() as StationView;
    expect(x01Only(station.match?.state as X01State).players[0]?.remaining).toBe(81);
  });
});

describe("a party match's light events", () => {
  const settings = defaultAroundTheClockSettings;
  const match = (events: MatchEvent[]): StationView["match"] =>
    ({
      id: "m",
      players: [],
      settings,
      state: matchState(settings, events),
      label: null,
    }) as StationView["match"];
  const start: MatchEvent = { type: "MatchStarted", playerCount: 2 };
  let id = 0;
  const dart = (number: number, multiplier: 1 | 2 | 3 = 1): MatchEvent => ({
    type: "DartThrown",
    dartId: `d${++id}`,
    segment: { number, multiplier },
  });
  const takeout: MatchEvent = { type: "TakeoutFinished" };

  it("starts with the match and fires the game shot on the win, nothing in between", () => {
    expect(eventsBetween(seenOf(match([])), match([start]))).toEqual(["matchStart"]);

    const before: MatchEvent[] = [start];
    for (let n = 1; n <= 20; n += 3) {
      before.push(...[n, n + 1, n + 2].filter((t) => t <= 20).map((t) => dart(t, 3)), takeout);
      before.push(dart(5), dart(5), dart(5), takeout);
    }
    expect(eventsBetween(seenOf(match([start])), match(before))).toEqual([]);

    expect(eventsBetween(seenOf(match(before)), match([...before, dart(25)]))).toEqual([
      "gameShot",
    ]);
  });
});

describe("a High Score match's light events", () => {
  const settings = { ...defaultHighScoreSettings, rounds: 1 };
  const match = (events: MatchEvent[]): StationView["match"] =>
    ({
      id: "m",
      players: [],
      settings,
      state: matchState(settings, events),
      label: null,
    }) as StationView["match"];
  let id = 0;
  const dart = (number: number, multiplier: 1 | 2 | 3 = 1): MatchEvent => ({
    type: "DartThrown",
    dartId: `d${++id}`,
    segment: { number, multiplier },
  });
  const start: MatchEvent = { type: "MatchStarted", playerCount: 2 };
  const takeout: MatchEvent = { type: "TakeoutFinished" };

  it("fires the 180, and the game shot on the deciding dart", () => {
    const first = [start, dart(20, 3), dart(20, 3)];
    expect(eventsBetween(seenOf(match(first)), match([...first, dart(20, 3)]))).toEqual([
      "s180",
      "s100",
    ]);

    const last = [...first, dart(20, 3), takeout, dart(1), dart(1)];
    expect(eventsBetween(seenOf(match(last)), match([...last, dart(1)]))).toEqual(["gameShot"]);
  });
});

describe("a 100+ visit's light event", () => {
  const settings = { ...defaultX01Settings, startScore: 501 };
  const match = (events: MatchEvent[], rules = settings): StationView["match"] =>
    ({
      id: "m",
      players: [],
      settings: rules,
      state: matchState(rules, events),
      label: null,
    }) as StationView["match"];
  let id = 0;
  const dart = (number: number, multiplier: 1 | 2 | 3 = 1): MatchEvent => ({
    type: "DartThrown",
    dartId: `d${++id}`,
    segment: { number, multiplier },
  });
  const start: MatchEvent = { type: "MatchStarted", playerCount: 2 };
  const takeout: MatchEvent = { type: "TakeoutFinished" };
  const after = (before: MatchEvent[], added: MatchEvent[]) =>
    eventsBetween(seenOf(match(before)), match([...before, ...added]));

  it("fires once the visit is over at 100 or more", () => {
    const two = [start, dart(20, 3), dart(20, 1)];
    expect(after([start, dart(20, 3)], [dart(20, 1)])).toEqual([]);
    expect(after(two, [dart(20, 1)])).toEqual(["s100"]);
    expect(after([start, dart(20, 3), dart(20, 3)], [dart(20, 1)])).toEqual(["s100"]);
  });

  it("fires for a visit ended early at 100 or more", () => {
    expect(after([start, dart(20, 3), dart(20, 2)], [takeout])).toEqual(["s100"]);
  });

  it("doesn't fire at 99 or on a bust", () => {
    expect(after([start, dart(19, 3), dart(19, 1)], [dart(4, 1)])).toEqual([]);
    const bust = { ...defaultX01Settings, startScore: 101 };
    const events = [start, dart(20, 3), dart(20, 2)];
    expect(eventsBetween(seenOf(match(events, bust)), match([...events, dart(5)], bust))).toEqual([
      "bust",
    ]);
  });

  it("lists the 180 before the 100+, so a 180 preset wins when there is one", () => {
    expect(after([start, dart(20, 3), dart(20, 3)], [dart(20, 3)])).toEqual(["s180", "s100"]);
  });

  it("fires again for the next 100+ visit in the same leg", () => {
    const first = [start, dart(20, 3), dart(20, 1), dart(20, 1), takeout];
    const second = [...first, dart(1), takeout, dart(20, 3), dart(20, 1)];
    expect(after(second, [dart(20, 1)])).toEqual(["s100"]);
  });
});

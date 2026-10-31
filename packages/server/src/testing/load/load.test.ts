// Load test (perf-tests ticket 01): a long match on the simulator mustn't get slow, dart by dart.
// Each dart folds the whole event log and every live stream recomputes its view on each change, so
// a mistake there shows up as growth over ~1,000 darts, or with a long history in the database
// (seeded). Fails when a dart takes more than 150 ms to reach the station, on growth, and on the
// work per dart (database writes, stream messages), which doesn't depend on machine speed.

import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { type BoardSim, createBoardSim } from "@n4/board-sim";
import { checkoutRoute, type Segment } from "@n4/engine";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { StationView } from "../../api.ts";
import { buildApp } from "../../app.ts";
import { type Db, openDb } from "../../db.ts";
import { startStation } from "../../stations/stations.ts";
import { seedHistory } from "../seed.ts";

/** Enough to show growth; more would take the test past 30 s. */
const DARTS = 600;
const BLOCK = 100;
/** Past matches in the database, as after a few months of evenings. */
const HISTORY = 200;
/** Every dart has to reach the station within this. */
const MAX_MS = 150;
/** The last block's median may be at most this many times the first block's. */
const GROWTH = 4;
/** Below this a median is noise: 0.5 ms against 1.5 ms isn't growth. */
const NOISE_MS = 2;

/** A database with the players and the seeded history, copied for each test. */
let template: string;
beforeAll(() => {
  template = join(mkdtempSync(join(tmpdir(), "n4-load-")), "template.db");
  // Seeded in memory and written out once: a write per event to a file is slow on CI disks.
  const db = openDb(":memory:");
  for (const name of ["Ann", "Bob", "Cid"]) {
    db.addPlayer({ id: name.toLowerCase(), name, archived: false });
  }
  seedHistory(db, { matches: HISTORY, playerIds: ["ann", "bob", "cid"], startScore: 701 });
  db.backupTo(template);
  db.close();
}, 30_000);

let sim: BoardSim | undefined;
const closers: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const close of closers.splice(0)) await close();
  await sim?.close();
  sim = undefined;
});

interface Stream<T> {
  messages: { at: number; view: T }[];
  /** Resolves with the first message from `from` on that passes `test`. */
  waitFor(test: (view: T) => boolean, from: number): Promise<{ at: number; view: T }>;
}

/** Opens a live stream and records every message with when it arrived. */
async function open<T>(url: string): Promise<Stream<T>> {
  const res = await fetch(url);
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  closers.unshift(() => reader.cancel().catch(() => {}));
  const decoder = new TextDecoder();
  const messages: { at: number; view: T }[] = [];
  let wake = () => {};
  void (async () => {
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read().catch(() => ({ value: undefined, done: true }));
      if (done) return;
      buffer += decoder.decode(value);
      const at = performance.now();
      let end = buffer.indexOf("\n\n");
      while (end >= 0) {
        const message = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (message.startsWith("data: ")) messages.push({ at, view: JSON.parse(message.slice(6)) });
        end = buffer.indexOf("\n\n");
      }
      wake();
    }
  })();
  return {
    messages,
    async waitFor(test, from) {
      for (;;) {
        const found = messages.slice(from).find((m) => test(m.view));
        if (found) return found;
        await Promise.race([
          new Promise<void>((resolve) => {
            wake = resolve;
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("no message")), 5000)),
        ]);
      }
    },
  };
}

/** The server as main.ts wires it, listening, with station 1 on the simulator. */
async function startServer(board: BoardSim) {
  const path = join(mkdtempSync(join(tmpdir(), "n4-load-")), "load.db");
  copyFileSync(template, path);
  const db = openDb(path);
  const running = startStation({ id: 1, boardUrl: board.url }, db, {
    reconnectDelayMs: 10,
    maxReconnectDelayMs: 20,
  });
  const app = buildApp({ db, stations: [running.station], scheduler: { tickMs: 50 } });
  await app.listen({ port: 0, host: "127.0.0.1" });
  closers.push(async () => {
    running.close();
    await app.close();
    db.close();
  });
  const base = `http://127.0.0.1:${app.addresses()[0]?.port}`;
  const post = (url: string, payload: object) => app.inject({ method: "POST", url, payload });
  const station = async (): Promise<StationView> => (await app.inject("/api/stations/1")).json();
  await vi.waitFor(async () => expect((await station()).boardOnline).toBe(true));
  return { db, base, post, station };
}

/** The simulator's name for a field: S20, D20, T20, 25, BULL. */
function simName(s: Segment) {
  if (s.number === 25) return s.multiplier === 2 ? "BULL" : "25";
  return `${["M", "S", "D", "T"][s.multiplier]}${s.number}`;
}

/** A visit when no checkout is on: 66, so a 701 leg runs about 60 darts. */
const PATTERN = ["T20", "S5", "S1"];

/** The thrower goes for the checkout when there is one, otherwise scores from the pattern. */
function nextDart(view: StationView) {
  const match = view.match;
  if (!match) throw new Error("no match");
  const { state, settings } = match;
  const thrower = state.players[state.currentPlayer];
  const thrown = state.currentVisit?.darts.filter((d) => !d.ignored).length ?? 0;
  const route = thrower ? checkoutRoute(thrower.remaining, 3 - thrown, settings.outRule) : null;
  return route?.[0] ? simName(route[0]) : (PATTERN[thrown] as string);
}

const dartsIn = (view: StationView) => view.match?.state.currentVisit?.darts.length ?? 0;
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

/** Per 100-dart block: the median and the slowest darts, for the CI log. */
function report(times: number[]) {
  const lines = [];
  for (let i = 0; i < times.length; i += BLOCK) {
    const block = times.slice(i, i + BLOCK);
    const slowest = block
      .map((ms, j) => ({ ms, dart: i + j + 1 }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 3)
      .map((d) => `#${d.dart} ${d.ms.toFixed(1)}`)
      .join(", ");
    lines.push(
      `darts ${i + 1}–${i + block.length}: median ${median(block).toFixed(2)} ms; slowest ${slowest}`,
    );
  }
  return lines.join("\n");
}

/**
 * Throws `DARTS` darts with a takeout after every visit, timing each from the throw to the
 * station stream's message, and counts database writes and stream messages along the way.
 */
async function playLongMatch(db: Db, base: string) {
  const board = sim as BoardSim;
  const station = await open<StationView>(`${base}/api/stations/1/live`);
  const others = await Promise.all(
    ["/api/display/live", "/api/stations/live", "/api/admin/tournament/live"].map((path) =>
      open<unknown>(`${base}${path}`),
    ),
  );
  let current = (await station.waitFor((v) => v.match?.state.phase === "throwing", 0)).view;
  // Let the messages from setting up the match arrive, so they aren't counted as the darts'.
  await new Promise((resolve) => setTimeout(resolve, 100));

  let writes = 0;
  closers.unshift(async () => unsubscribe());
  const unsubscribe = db.onChange(() => {
    writes += 1;
  });
  const before = [station, ...others].map((s) => s.messages.length);

  const times: number[] = [];
  let changes = 0;
  for (let n = 0; n < DARTS && current.match?.state.phase !== "matchWon"; n++) {
    const from = station.messages.length;
    const darts = dartsIn(current);
    const thrownAt = performance.now();
    board.throwDart(nextDart(current));
    const got = await station.waitFor((v) => dartsIn(v) === darts + 1, from);
    times.push(got.at - thrownAt);
    current = got.view;
    changes += 1;
    // Already failed: stop here rather than throw hundreds more slow darts.
    if (got.at - thrownAt > MAX_MS) break;

    if (current.match?.state.phase === "awaitingTakeout") {
      const after = station.messages.length;
      board.takeout();
      current = (await station.waitFor((v) => v.match?.state.currentVisit == null, after)).view;
      changes += 1;
    }
  }
  // Let any late messages arrive before counting them.
  await new Promise((resolve) => setTimeout(resolve, 100));
  unsubscribe();
  const messages = [station, ...others].map((s, i) => s.messages.length - (before[i] ?? 0));
  const won = current.match?.state.phase === "matchWon";
  const legs = current.match?.state.players.map((p) => p.legsWon).join("–");
  const legsToWin = current.match?.settings.legsToWin;
  return {
    times,
    changes,
    writes,
    messages,
    won,
    legs: `${legs} of ${legsToWin}`,
    darts: times.length,
  };
}

function check(result: Awaited<ReturnType<typeof playLongMatch>>) {
  const { times, changes, writes, messages, won, darts } = result;
  const log = `\n${report(times)}\nlegs ${result.legs}, writes ${writes}, changes ${changes}, messages per stream ${messages.join(" / ")}`;

  // Work per dart: one write per dart or takeout (plus the winner, if the match ended), and at
  // most one message per stream for each.
  expect(writes, log).toBe(changes + (won ? 1 : 0));
  for (const count of messages) expect(count, log).toBeLessThanOrEqual(changes);
  expect(messages[0], log).toBe(changes);

  const first = median(times.slice(0, BLOCK));
  const last = median(times.slice(-BLOCK));
  expect(Math.max(...times), log).toBeLessThan(MAX_MS);
  expect(last, log).toBeLessThanOrEqual(GROWTH * Math.max(first, NOISE_MS));
  expect(darts, log).toBeGreaterThanOrEqual(DARTS * 0.9);
}

describe("load", () => {
  it("a long quick match doesn't get slower", { timeout: 60_000 }, async () => {
    sim = await createBoardSim();
    const server = await startServer(sim);
    const settings = { startScore: 701, outRule: "double", legsToWin: 12 };
    await server.post("/api/stations/1/commands", {
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings,
    });
    await server.post("/api/stations/1/commands", { type: "startMatch" });

    check(await playLongMatch(server.db, server.base));
  });

  it("a long tournament match doesn't get slower", { timeout: 60_000 }, async () => {
    sim = await createBoardSim();
    const server = await startServer(sim);
    const created = await server.post("/api/admin/tournament", {
      // A tournament needs 3 players; the first group match goes to station 1.
      playerIds: ["ann", "bob", "cid"],
      config: {
        format: { elimination: "single" },
        legs: { groups: 12, winners: 1, losers: 1, final: 1 },
        x01: { startScore: 701, outRule: "double" },
      },
    });
    expect(created.statusCode, created.body).toBe(201);
    await server.post("/api/admin/tournament/start", {});
    await vi.waitFor(async () => expect((await server.station()).match).not.toBeNull(), {
      timeout: 2000,
    });
    await server.post("/api/stations/1/commands", { type: "startMatch" });

    check(await playLongMatch(server.db, server.base));
  });
});

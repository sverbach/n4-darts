import { afterEach, describe, expect, it, vi } from "vitest";
import { type Db, openDb } from "./db.ts";
import { createScheduler, NO_MATCH_READY, PAUSED, type Scheduler } from "./scheduler.ts";
import { createStation, type Station } from "./station.ts";
import { fixedDirectory } from "./stations.ts";
import { createTournaments } from "./tournaments.ts";

let db: Db;
let scheduler: Scheduler | undefined;
afterEach(() => {
  scheduler?.stop();
  scheduler = undefined;
  db?.close();
});

/** A tournament of `players` (40, straight out, everything best of 1) with fake boards. */
function setup(players: number, stationCount = 2, autoCloseMs = 60_000) {
  db = openDb(":memory:");
  const ids = Array.from({ length: players }, (_, i) => `p${i + 1}`);
  for (const id of ids) db.addPlayer({ id, name: id.toUpperCase(), archived: false });
  const board = { reset: async () => {} };
  const stations = Array.from({ length: stationCount }, (_, i) =>
    createStation({ id: i + 1, db, board }),
  );
  const tournaments = createTournaments(db, fixedDirectory(stations));
  tournaments.create({
    playerIds: ids,
    config: {
      format: { elimination: "single" },
      legs: { groups: 1, winners: 1, losers: 1, final: 1 },
      x01: { startScore: 40 },
    },
  });
  // Seeds in id order, so tests can reason about who plays whom.
  tournaments.update({ seedOrder: ids });
  tournaments.start();
  scheduler = createScheduler(db, fixedDirectory(stations), tournaments, {
    tickMs: 1_000_000,
    autoCloseMs,
  });
  scheduler.run();
  return { stations, tournaments, scheduler };
}

/** Starts the station's match and lets its first player check out at once; optionally Done. */
async function win(station: Station, done = true) {
  await station.command({ type: "startMatch" });
  station.handleBoardEvent({
    type: "DartDetected",
    index: 0,
    segment: { number: 20, multiplier: 2 },
    name: "D20",
    coords: { x: 0, y: 0 },
    bouncer: false,
  });
  station.handleBoardEvent({ type: "TakeoutFinished" });
  if (done) await station.command({ type: "closeMatch" });
}

const playersOn = (station: Station) => station.view().match?.players.map((p) => p.id) ?? [];

describe("scheduler", () => {
  it("puts a match on every free station, never one player in two places", () => {
    const { stations } = setup(4);
    const [a, b] = stations.map(playersOn);
    expect(a).toHaveLength(2);
    expect(b).toHaveLength(2);
    expect(a?.some((p) => b?.includes(p))).toBe(false);
    expect(stations[0]?.view().match?.label).toMatch(/^Group match/);
  });

  it("tells a free station when nothing is ready", () => {
    const { stations } = setup(3);
    // Three players: one match at a time can be played; station 2 waits.
    expect(stations[0]?.view().match).not.toBeNull();
    expect(stations[1]?.view()).toMatchObject({ match: null, notice: NO_MATCH_READY });
  });

  it("gives the next match to a station as soon as it frees up", async () => {
    // Five players: after the first match, someone free is left for the next one.
    const { stations, scheduler } = setup(5);
    const before = playersOn(stations[0] as Station);
    await win(stations[0] as Station);
    scheduler.run();
    const after = playersOn(stations[0] as Station);
    expect(after).toHaveLength(2);
    expect(after).not.toEqual(before);
  });

  it("orders the queue by round, then by who has rested longest", async () => {
    const { stations, scheduler } = setup(6, 1);
    const station = stations[0] as Station;
    // Play the whole first round (3 matches), one after another.
    for (let i = 0; i < 3; i++) {
      await win(station);
      scheduler.run();
    }
    const lastClosed = db.lastClosedAt();
    const restedSince = (ids: string[]) =>
      Math.max(...ids.map((p) => Date.parse(lastClosed.get(p) ?? "1970")));
    const onStation = playersOn(station);
    const waiting = scheduler.queue().filter((q) => q.order === 1);
    const all = [{ ids: onStation }, ...waiting.map((q) => ({ ids: q.match.playerIds }))];
    // The match the scheduler chose rested longest among round 2.
    for (const other of all.slice(1))
      expect(restedSince(onStation)).toBeLessThanOrEqual(restedSince(other.ids));
  });

  it("builds the knockout when the groups are done and runs to a champion", async () => {
    const { stations, scheduler } = setup(4);
    for (let guard = 0; guard < 30 && db.activeTournament(); guard++) {
      for (const station of stations) if (station.view().match) await win(station);
      scheduler.run();
    }
    expect(db.activeTournament()).toBeUndefined();
    const finished = db.tournaments()[0];
    expect(finished?.status).toBe("finished");
    expect(finished?.placings).toHaveLength(4);
    expect(stations.map((s) => s.view().notice)).toEqual([null, null]);
  });

  it("skips paused stations and held matches, and honours pins", async () => {
    const { stations, scheduler } = setup(5);
    const [one, two] = stations as [Station, Station];
    db.setStationPaused(2, true);
    await two.command({ type: "abandonMatch" }); // back to the queue
    scheduler.run();
    expect(two.view()).toMatchObject({ match: null, notice: PAUSED });

    db.setStationPaused(2, false);
    const [head, second] = scheduler.queue().filter((q) => q.ready);
    db.setHeld(head?.match.id as string, true);
    db.setPinnedStation(second?.match.id as string, 2);
    scheduler.run();
    expect(two.view().match?.id).toBe(second?.match.id);
    expect(one.view().match?.id).not.toBe(head?.match.id);
  });

  it("closes a won tournament match by itself after a while, unless it's undone", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const { stations, scheduler } = setup(4, 2, 1000);
      const station = stations[0] as Station;
      await win(station, false);
      scheduler.run();
      await station.command({ type: "undo" });
      scheduler.run();
      vi.advanceTimersByTime(1500);
      expect(station.view().match?.state.phase).not.toBe("matchWon");

      station.handleBoardEvent({
        type: "DartDetected",
        index: 0,
        segment: { number: 20, multiplier: 2 },
        name: "D20",
        coords: { x: 0, y: 0 },
        bouncer: false,
      });
      const wonId = station.view().match?.id;
      scheduler.run();
      vi.advanceTimersByTime(1500);
      await vi.waitFor(() => expect(db.getMatch(wonId as string)?.closedAt).not.toBeNull());
    } finally {
      vi.useRealTimers();
    }
  });
});

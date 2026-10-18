import { afterEach, describe, expect, it } from "vitest";
import { type Db, openDb } from "./db.ts";
import { createScheduler, type Scheduler } from "./scheduler.ts";
import { createStation, type Station } from "./station.ts";
import { fixedDirectory } from "./stations.ts";
import { createTournaments, type Tournaments } from "./tournaments.ts";

let db: Db;
let scheduler: Scheduler | undefined;
afterEach(() => {
  scheduler?.stop();
  scheduler = undefined;
  db?.close();
});

/** Players p1…pN seeded in order (40, straight out, best of 1), two fake boards. */
function setup(players: number, elimination: "single" | "double" = "single", extra = 0) {
  db = openDb(":memory:");
  const ids = Array.from({ length: players + extra }, (_, i) => `p${i + 1}`);
  for (const id of ids) db.addPlayer({ id, name: id.toUpperCase(), archived: false });
  const board = { reset: async () => {} };
  const stations = [1, 2].map((id) => createStation({ id, db, board }));
  const tournaments = createTournaments(db, fixedDirectory(stations));
  const entered = ids.slice(0, players);
  tournaments.create({
    playerIds: entered,
    config: {
      format: { elimination },
      legs: { groups: 1, winners: 1, losers: 1, final: 1 },
      x01: { startScore: 40 },
    },
  });
  tournaments.update({ seedOrder: entered });
  tournaments.start();
  scheduler = createScheduler(db, fixedDirectory(stations), tournaments, { tickMs: 1_000_000 });
  scheduler.run();
  return { stations, tournaments, scheduler };
}

/** The lower-numbered player wins every match that's on a station; then the scheduler runs. */
async function playStations(stations: Station[], sched: Scheduler) {
  for (const station of stations) {
    const match = station.view().match;
    if (!match) continue;
    // Put the favourite (lower number) first so their opening D20 wins.
    const ids = match.players.map((p) => p.id);
    const favourite = [...ids].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    await station.command({ type: "setOrder", playerIds: favourite });
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
    await station.command({ type: "closeMatch" });
  }
  sched.run();
}

const table = (t: Tournaments) =>
  t.view().progress?.groups[0]?.table.map((r) => [r.playerId, r.points, r.played]);

describe("withdrawals", () => {
  it("in the group phase: every remaining match is a walkover for the opponent", () => {
    const { tournaments, stations } = setup(4);
    tournaments.withdraw("p4");

    const rows = new Map(
      table(tournaments)?.map(([id, points, played]) => [id, { points, played }]),
    );
    expect(rows.get("p4")).toEqual({ points: 0, played: 3 });
    for (const id of ["p1", "p2", "p3"]) expect(rows.get(id)?.points).toBe(2);
    // p4 is on no station any more.
    for (const s of stations)
      expect(s.view().match?.players.map((p) => p.id) ?? []).not.toContain("p4");
    const walkovers = db
      .tournamentMatches(tournaments.view().tournament?.id as string)
      .filter((m) => m.walkover);
    expect(walkovers).toHaveLength(3);
  });

  it("during a running match: it's abandoned and becomes a walkover", async () => {
    const { tournaments, stations, scheduler } = setup(4);
    const station = stations.find((s) =>
      s.view().match?.players.some((p) => p.id === "p1"),
    ) as Station;
    const opponent = station.view().match?.players.find((p) => p.id !== "p1")?.id;
    await station.command({ type: "startMatch" });
    const slot = db.getMatch(station.view().match?.id as string)?.slot;

    tournaments.withdraw("p1");
    scheduler.run();

    const tournamentId = tournaments.view().tournament?.id as string;
    const records = db.tournamentMatches(tournamentId).filter((m) => m.slot === slot);
    expect(records.map((m) => [m.abandoned, m.walkover, m.winner])).toEqual([
      [true, false, null],
      [false, true, opponent],
    ]);
  });

  it("in double elimination: they lose in the winners bracket and again in the losers bracket", async () => {
    const { tournaments, stations, scheduler } = setup(4, "double");
    // Groups: everyone plays everyone; p1 wins all.
    for (let i = 0; i < 10 && !tournaments.view().progress?.bracket.length; i++) {
      await playStations(stations, scheduler);
    }
    expect(tournaments.view().progress?.phase).toBe("knockout");

    tournaments.withdraw("p1");
    for (let i = 0; i < 20 && tournaments.view().tournament?.status === "running"; i++) {
      await playStations(stations, scheduler);
    }

    const tournamentId = tournaments.view().tournament?.id as string;
    const lostByWalkover = db
      .tournamentMatches(tournamentId)
      .filter((m) => m.walkover && m.playerIds.includes("p1") && m.winner !== "p1");
    expect(lostByWalkover.map((m) => m.slot?.[0])).toEqual(["w", "l"]);
    expect(tournaments.view().tournament?.status).toBe("finished");
  });

  it("can't withdraw twice or someone who isn't in", () => {
    const { tournaments } = setup(3);
    tournaments.withdraw("p3");
    expect(() => tournaments.withdraw("p3")).toThrow(/already/);
    expect(() => tournaments.withdraw("nobody")).toThrow(/isn't in/);
  });
});

describe("late arrivals", () => {
  it("join the smallest group during the group phase, with their matches queued", () => {
    const { tournaments } = setup(4, "single", 1);
    const tournamentId = tournaments.view().tournament?.id as string;
    expect(db.tournamentMatches(tournamentId)).toHaveLength(6);

    tournaments.addLate("p5");

    expect(db.tournamentMatches(tournamentId)).toHaveLength(10);
    expect(tournaments.view().entrants.map((e) => e.playerId)).toContain("p5");
    expect(() => tournaments.addLate("p5")).toThrow(/already/);
  });

  it("are refused once the knockout has started", async () => {
    const { tournaments, stations, scheduler } = setup(3, "single", 1);
    for (let i = 0; i < 10 && tournaments.view().progress?.phase === "groups"; i++) {
      await playStations(stations, scheduler);
    }
    expect(() => tournaments.addLate("p4")).toThrow(/knockout/);
  });
});

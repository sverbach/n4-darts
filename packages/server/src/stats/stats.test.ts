import { defaultX01Settings, type Segment, type X01Settings } from "@n4/engine";
import { afterEach, describe, expect, it } from "vitest";
import type { DisplayView, LeaderboardRow, PlayerProfile } from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";
import { createStats } from "./stats.ts";

let db: Db;
afterEach(() => db?.close());

const seg = (name: string): Segment => {
  if (name === "M") return { number: 0, multiplier: 0 };
  const multiplier = ({ S: 1, D: 2, T: 3 } as const)[name[0] as "S" | "D" | "T"];
  return { number: Number(name.slice(1)), multiplier };
};

let n = 0;
/** Plays a match from visits (dart names per visit, players taking turns) and closes it. */
function play(
  playerIds: string[],
  visits: string[][],
  options: { settings?: Partial<X01Settings>; at?: string; tournamentId?: string } = {},
) {
  const id = `m${++n}`;
  const settings = { ...defaultX01Settings, startScore: 101, ...options.settings };
  db.createMatch({
    id,
    station: null,
    settings,
    playerIds,
    ...(options.tournamentId ? { tournamentId: options.tournamentId } : {}),
  });
  db.append(id, { type: "MatchStarted", playerCount: playerIds.length }, options.at);
  visits.forEach((darts, v) => {
    darts.forEach((name, d) => {
      db.append(
        id,
        { type: "DartThrown", dartId: `${id}-${v}-${d}`, segment: seg(name) },
        options.at,
      );
    });
    db.append(id, { type: "TakeoutFinished" }, options.at);
  });
  // Visits alternate, so the last one belongs to the winner.
  db.setWinner(id, playerIds[(visits.length - 1) % playerIds.length] ?? null);
  db.closeMatch(id);
  return id;
}

function setup() {
  db = openDb(":memory:");
  for (const id of ["ann", "bob", "cid", "dee"]) {
    db.addPlayer({ id, name: id[0]?.toUpperCase() + id.slice(1), archived: false });
  }
  const app = buildApp({ db });
  const get = async <T>(url: string) => {
    const res = await app.inject({ method: "GET", url });
    return { status: res.statusCode, body: res.json() as T };
  };
  return { app, get };
}

describe("stats", () => {
  it("ranks players with a counted match by rating", async () => {
    const { get } = setup();
    play(["ann", "bob"], [["T20", "S1"], ["S20"], ["D20"]]); // Ann checks out 101 in 3 darts
    db.updatePlayer({ id: "dee", name: "Dee", archived: true });

    const { body } = await get<LeaderboardRow[]>("/api/players/stats");
    expect(body.map((r) => r.name)).toEqual(["Ann", "Bob"]);
    expect(body[0]).toMatchObject({ matches: 1, matchesWon: 1, highestCheckout: 40, s180: 0 });
    expect(body[0]?.rating).toBe(101);
    expect(body[1]).toMatchObject({ matches: 1, matchesWon: 0, average: 60 });
  });

  it("leaves out walkovers and abandoned matches", async () => {
    const { get } = setup();
    db.createMatch({
      id: "w",
      station: null,
      settings: defaultX01Settings,
      playerIds: ["cid", "dee"],
    });
    db.closeAsWalkover("w", "cid");
    db.createMatch({
      id: "a",
      station: null,
      settings: defaultX01Settings,
      playerIds: ["cid", "dee"],
    });
    db.append("a", { type: "MatchStarted", playerCount: 2 });
    db.append("a", { type: "DartThrown", dartId: "a1", segment: seg("T20") });
    db.closeMatch("a", { abandoned: true });

    expect((await get<LeaderboardRow[]>("/api/players/stats")).body).toEqual([]);
    const cid = (await get<PlayerProfile>("/api/players/cid/stats")).body;
    expect(cid.totals.matches).toBe(0);
    expect(cid.recent).toEqual([]);
  });

  it("follows a correction", async () => {
    const { get } = setup();
    const id = play(["ann", "bob"], [["T20", "S1"], ["S20"], ["D20"]]);
    expect((await get<PlayerProfile>("/api/players/bob/stats")).body.totals.average).toBe(60);

    db.append(id, { type: "DartCorrected", dartId: `${id}-1-0`, segment: seg("T20") });
    expect((await get<PlayerProfile>("/api/players/bob/stats")).body.totals.average).toBe(180);
  });

  it("builds a profile: totals, evenings, tournaments and recent matches", async () => {
    const { get } = setup();
    // Two evenings; the second one runs past midnight.
    play(["ann", "bob"], [["T20", "S1"], ["S20"], ["D20"]], { at: "2026-10-16T19:00:00.000Z" });
    play(["bob", "ann"], [["S1"], ["T20", "T20", "T20"]], {
      at: "2026-10-17T20:00:00.000Z",
      settings: { startScore: 180 },
    });
    play(["ann", "bob", "cid"], [["S1"], ["T20", "S1", "D20"]], { at: "2026-10-18T00:30:00.000Z" });
    db.createTournament({
      id: "t1",
      name: "Friday",
      status: "finished",
      config: {} as never,
      createdAt: "2026-10-17T18:00:00.000Z",
      startedAt: "2026-10-17T18:30:00.000Z",
      finishedAt: "2026-10-17T23:00:00.000Z",
      placings: [
        { playerId: "bob", from: 1, to: 1 },
        { playerId: "ann", from: 2, to: 2 },
      ],
    });

    const ann = (await get<PlayerProfile>("/api/players/ann/stats")).body;
    expect(ann.totals).toMatchObject({
      matches: 3,
      matchesWon: 2,
      legs: 3,
      legsWon: 2,
      s180: 1,
      highestCheckout: 180,
      bestLeg: 3,
      checkoutPercent: null, // no double-out matches
    });
    expect(ann.evenings.map((e) => [e.day, e.matches])).toEqual([
      ["2026-10-16", 1],
      ["2026-10-17", 2],
    ]);
    expect(ann.tournaments).toEqual([
      { id: "t1", name: "Friday", date: "2026-10-17T18:30:00.000Z", from: 2, to: 2 },
    ]);
    expect(ann).toMatchObject({
      tournamentsWon: 0,
      bestPlacing: { from: 2, to: 2, tournament: "Friday" },
      rank: 1,
      since: "2026-10-16",
    });
    expect((await get<PlayerProfile>("/api/players/dee/stats")).body).toMatchObject({
      rank: null,
      since: null,
    });
    expect(ann.recent.map((r) => [r.opponents.join(), r.won, r.legsFor, r.legsAgainst])).toEqual([
      ["Bob,Cid", false, 0, 1],
      ["Bob", true, 1, 0],
      ["Bob", true, 1, 0],
    ]);
    expect((await get("/api/players/nobody/stats")).status).toBe(404);
  });
});

describe("heatmap", () => {
  /** A board dart: the segment's name plus where it landed. */
  const board = (id: string, dartId: string, name: string, x: number, y: number, bouncer = false) =>
    db.append(id, {
      type: "DartThrown",
      dartId,
      segment: seg(name),
      coords: { x, y },
      bouncer,
    });

  function boardMatch(id: string, visits: { name: string; x: number; y: number }[][]) {
    db.createMatch({
      id,
      station: null,
      settings: { ...defaultX01Settings, startScore: 701 },
      playerIds: ["ann", "bob"],
    });
    db.append(id, { type: "MatchStarted", playerCount: 2 });
    visits.forEach((darts, v) => {
      darts.forEach((d, i) => {
        board(id, `${id}-${v}-${i}`, d.name, d.x, d.y);
      });
      db.append(id, { type: "TakeoutFinished" });
    });
    db.setWinner(id, "ann");
    db.closeMatch(id);
  }

  const at = (name: string, x: number) => ({ name, x, y: 0.5 });

  it("lists the player's own board darts, newest first, across matches", async () => {
    const { get } = setup();
    boardMatch("old", [[at("S1", 0.1), at("S1", 0.2)], [at("S20", 0.9)]]);
    boardMatch("new", [[at("S1", 0.3)], [at("S20", 0.8)], [at("M17", 1.4)]]);

    const ann = (await get<PlayerProfile>("/api/players/ann/stats")).body;
    expect(ann.heatmap.map((p) => p.x)).toEqual([1.4, 0.3, 0.2, 0.1]);
    const bob = (await get<PlayerProfile>("/api/players/bob/stats")).body;
    expect(bob.heatmap).toEqual([
      { x: 0.8, y: 0.5 },
      { x: 0.9, y: 0.5 },
    ]);
  });

  it("leaves out bounce-outs, darts added by hand, corrected darts and abandoned matches", async () => {
    const { get } = setup();
    db.createMatch({
      id: "m",
      station: null,
      settings: { ...defaultX01Settings, startScore: 701 },
      playerIds: ["ann", "bob"],
    });
    db.append("m", { type: "MatchStarted", playerCount: 2 });
    board("m", "kept", "S1", 0.1, 0.1);
    board("m", "bounce", "M", 0, 0, true);
    db.append("m", { type: "DartThrown", dartId: "manual", segment: seg("S5") });
    db.append("m", { type: "TakeoutFinished" });
    board("m", "wrong", "S1", 0.2, 0.2);
    db.append("m", { type: "DartCorrected", dartId: "wrong", segment: seg("S2") });
    db.append("m", { type: "TakeoutFinished" });
    db.setWinner("m", "ann");
    db.closeMatch("m");

    db.createMatch({
      id: "a",
      station: null,
      settings: defaultX01Settings,
      playerIds: ["ann", "bob"],
    });
    db.append("a", { type: "MatchStarted", playerCount: 2 });
    board("a", "a1", "S1", 0.3, 0.3);
    db.closeMatch("a", { abandoned: true });

    expect((await get<PlayerProfile>("/api/players/ann/stats")).body.heatmap).toEqual([
      { x: 0.1, y: 0.1 },
    ]);
    expect((await get<PlayerProfile>("/api/players/bob/stats")).body.heatmap).toEqual([]);
  });

  it("keeps the last 500", async () => {
    const { get } = setup();
    // Ann throws 3 singles per visit, Bob misses: 170 of Ann's visits are 510 darts.
    const visits = Array.from({ length: 339 }, (_, v) =>
      v % 2 === 0 ? [at("S1", v), at("S1", v + 0.1), at("S1", v + 0.2)] : [at("M", 0)],
    );
    boardMatch("long", visits);

    const heatmap = (await get<PlayerProfile>("/api/players/ann/stats")).body.heatmap;
    expect(heatmap).toHaveLength(500);
    expect(heatmap[0]?.x).toBe(338.2);
  });
});

describe("tournament awards", () => {
  it("names the best of the evening, ties shared, empty categories left out", () => {
    setup();
    const t = { tournamentId: "t" };
    // Ann: 101 in 3 darts (avg 101, checkout 40). Bob: 101 in 3 darts the same way.
    play(["ann", "cid"], [["T20", "S1"], ["S20"], ["D20"]], t);
    play(["bob", "dee"], [["T20", "S1"], ["S20"], ["D20"]], t);
    // Cid's bigger checkout, in more darts.
    play(["cid", "dee"], [["S1"], ["M"], ["M"], ["M"], ["T20", "D20"]], t);
    // Outside the tournament, and a walkover inside it: neither counts.
    play(["dee", "ann"], [["T20", "T20", "S20"], ["S1"], ["S1"]]);
    db.createMatch({
      id: "w",
      station: null,
      settings: defaultX01Settings,
      playerIds: ["dee", "ann"],
      tournamentId: "t",
    });
    db.closeAsWalkover("w", "dee");

    const awards = createStats(db).awards("t");
    expect(awards).toEqual([
      { kind: "bestAverage", value: 101, players: ["Ann", "Bob"] },
      { kind: "highestCheckout", value: 100, players: ["Cid"] },
      { kind: "bestLeg", value: 3, players: ["Ann", "Bob"] },
    ]);
  });
});

describe("idle display", () => {
  it("shows the leaderboard while there's no running tournament", async () => {
    const { app, get } = setup();
    play(["ann", "bob"], [["T20", "S1"], ["S20"], ["D20"]]);
    expect((await get<DisplayView>("/api/display")).body.leaderboard.map((r) => r.name)).toEqual([
      "Ann",
      "Bob",
    ]);

    await app.inject({
      method: "POST",
      url: "/api/admin/tournament",
      payload: { playerIds: ["ann", "bob", "cid"] },
    });
    // A draft is still no tournament on the display.
    expect((await get<DisplayView>("/api/display")).body.leaderboard).toHaveLength(2);
    await app.inject({ method: "POST", url: "/api/admin/tournament/start" });
    expect((await get<DisplayView>("/api/display")).body.leaderboard).toEqual([]);
  });
});

import { defaultX01Settings } from "@n4/engine";
import { afterEach, describe, expect, it } from "vitest";
import type { TournamentAdminView } from "./api.ts";
import { buildApp } from "./app.ts";
import { type Db, openDb } from "./db.ts";
import { createStation } from "./station.ts";

let db: Db;
afterEach(() => db?.close());

const NAMES = ["Ann", "Bob", "Cid", "Dee", "Eve", "Fay", "Gus"];

/** A completed match in which `id` averaged `average` (one visit of 3 darts). */
function rated(id: string, average: number) {
  const matchId = `rating-${id}`;
  db.createMatch({
    id: matchId,
    station: null,
    settings: defaultX01Settings,
    playerIds: [id, "zed"],
  });
  db.append(matchId, { type: "MatchStarted", playerCount: 2 });
  // Three singles adding up to `average`.
  const third = average / 3;
  for (let i = 0; i < 3; i++) {
    db.append(matchId, {
      type: "DartThrown",
      dartId: `${matchId}-${i}`,
      segment: { number: third, multiplier: 1 },
    });
  }
  db.append(matchId, { type: "TakeoutFinished" });
  db.closeMatch(matchId);
}

function setup() {
  db = openDb(":memory:");
  for (const name of [...NAMES, "Zed"])
    db.addPlayer({ id: name.toLowerCase(), name, archived: false });
  const board = { reset: async () => {} };
  const stations = [1, 2].map((id) => createStation({ id, db, board }));
  const app = buildApp({ db, stations });
  const call = async (method: string, url: string, payload?: object) => {
    const res = await app.inject({ method: method as "GET", url, ...(payload ? { payload } : {}) });
    return {
      status: res.statusCode,
      body: (res.body ? res.json() : null) as TournamentAdminView & { error?: string },
    };
  };
  return { app, call };
}

const ids = (n: number) => NAMES.slice(0, n).map((n) => n.toLowerCase());

describe("setting up a tournament", () => {
  it("creates a draft with seeds by rating, unseeded players last", async () => {
    const { call } = setup();
    rated("cid", 60);
    rated("ann", 30);

    const res = await call("POST", "/api/admin/tournament", { name: "Friday", playerIds: ids(5) });

    expect(res.status).toBe(201);
    expect(res.body.tournament).toMatchObject({ name: "Friday", status: "draft" });
    const order = res.body.entrants.map((e) => e.playerId);
    expect(order.slice(0, 2)).toEqual(["cid", "ann"]);
    expect(order.slice(2).sort()).toEqual(["bob", "dee", "eve"]);
    expect(res.body.entrants[0]?.rating).toBe(60);
    expect(res.body.groups).toEqual([order]);
    expect(res.body.problems).toEqual([]);
    expect(res.body.estimateMinutes).toBeGreaterThan(0);
  });

  it("names it after today when no name is given", async () => {
    const { call } = setup();
    const res = await call("POST", "/api/admin/tournament", { playerIds: ids(3) });
    expect(res.body.tournament?.name.length).toBeGreaterThan(3);
  });

  it("allows only one active tournament", async () => {
    const { call } = setup();
    await call("POST", "/api/admin/tournament", { playerIds: ids(3) });
    expect((await call("POST", "/api/admin/tournament", { playerIds: ids(3) })).status).toBe(409);
  });

  it("keeps the seed order when players change, and takes the organiser's order", async () => {
    const { call } = setup();
    rated("bob", 50);
    const first = await call("POST", "/api/admin/tournament", { playerIds: ids(4) });
    const before = first.body.entrants.map((e) => e.playerId);

    const added = await call("PATCH", "/api/admin/tournament", { playerIds: [...ids(4), "eve"] });
    const after = added.body.entrants.map((e) => e.playerId);
    expect(after.filter((id) => id !== "eve")).toEqual(before);

    const reordered = [...after].reverse();
    const res = await call("PATCH", "/api/admin/tournament", { seedOrder: reordered });
    expect(res.body.entrants.map((e) => e.playerId)).toEqual(reordered);
    expect((await call("PATCH", "/api/admin/tournament", { seedOrder: ["ann"] })).status).toBe(400);
  });

  it("snake-seeds groups and reports problems instead of an estimate", async () => {
    const { call } = setup();
    await call("POST", "/api/admin/tournament", { playerIds: ids(6) });

    const two = await call("PATCH", "/api/admin/tournament", { config: { format: { groups: 2 } } });
    const order = two.body.entrants.map((e) => e.playerId);
    expect(two.body.groups).toEqual([
      [order[0], order[3], order[4]],
      [order[1], order[2], order[5]],
    ]);

    const three = await call("PATCH", "/api/admin/tournament", {
      config: { format: { groups: 3 } },
    });
    expect(three.body.problems[0]).toMatch(/at least 9 players/);
    expect(three.body.estimateMinutes).toBeNull();
    expect((await call("POST", "/api/admin/tournament/start")).status).toBe(409);
  });

  it("starts with the group matches queued; editable until the first match is played", async () => {
    const { call } = setup();
    await call("POST", "/api/admin/tournament", { playerIds: ids(4) });

    const res = await call("POST", "/api/admin/tournament/start");
    expect(res.body.tournament?.status).toBe("running");
    expect(res.body.tournament?.startedAt).not.toBeNull();
    const tournamentId = res.body.tournament?.id as string;
    expect(db.tournamentMatches(tournamentId)).toHaveLength(6);

    // A fifth player before anything is played: their fixtures are added.
    expect((await call("PATCH", "/api/admin/tournament", { playerIds: ids(5) })).status).toBe(200);
    const matches = db.tournamentMatches(tournamentId);
    expect(matches).toHaveLength(10);

    db.append(matches[0]?.id as string, { type: "MatchStarted", playerCount: 2 });
    expect((await call("PATCH", "/api/admin/tournament", { name: "x" })).status).toBe(409);
    expect((await call("DELETE", "/api/admin/tournament")).status).toBe(409);
  });

  it("discards a draft", async () => {
    const { call } = setup();
    await call("POST", "/api/admin/tournament", { playerIds: ids(3) });
    expect((await call("DELETE", "/api/admin/tournament")).status).toBe(204);
    expect((await call("GET", "/api/admin/tournament")).body.tournament).toBeNull();
  });
});

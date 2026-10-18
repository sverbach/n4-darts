import { afterEach, describe, expect, it } from "vitest";
import type { StationView } from "./api.ts";
import { buildApp } from "./app.ts";
import { type Db, openDb } from "./db.ts";
import { createStation } from "./station.ts";

let db: Db;
afterEach(() => db?.close());

/** Two stations on boards that accept every command; no simulator needed for assigning. */
function setup(adminPin?: string) {
  db = openDb(":memory:");
  for (const name of ["Ann", "Bob", "Cid"]) {
    db.addPlayer({ id: name.toLowerCase(), name, archived: false });
  }
  const board = { reset: async () => {} };
  const stations = [1, 2].map((id) => createStation({ id, db, board }));
  const app = buildApp({ db, stations, adminPin });
  const create = (payload: object) =>
    app.inject({ method: "POST", url: "/api/admin/matches", payload });
  const station = async (id: number): Promise<StationView> =>
    (await app.inject(`/api/stations/${id}`)).json();
  return { app, create, station };
}

describe("creating matches in /admin", () => {
  it("puts a new match on the chosen station, ready to start", async () => {
    const { create, station } = setup();

    const res = await create({
      station: 2,
      playerIds: ["ann", "bob", "cid"],
      settings: { startScore: 501, outRule: "double", legsToWin: 2 },
    });

    expect(res.statusCode).toBe(201);
    const view = await station(2);
    expect(view.match?.players.map((p) => p.name)).toEqual(["Ann", "Bob", "Cid"]);
    expect(view.match?.settings).toMatchObject({
      startScore: 501,
      outRule: "double",
      legsToWin: 2,
    });
    expect(view.match?.state.phase).toBe("notStarted");
    expect((await station(1)).match).toBeNull();
  });

  it("refuses a station that already has a match", async () => {
    const { create } = setup();
    await create({ station: 1, playerIds: ["ann", "bob"] });

    const res = await create({ station: 1, playerIds: ["cid", "bob"] });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toMatch(/already has a match/);
  });

  it("refuses an unknown station and invalid players", async () => {
    const { create } = setup();

    expect((await create({ station: 9, playerIds: ["ann", "bob"] })).statusCode).toBe(404);
    expect((await create({ station: 1, playerIds: ["ann"] })).statusCode).toBe(409);
    expect((await create({ station: 1, playerIds: "ann" })).statusCode).toBe(400);
  });

  it("abandons a station's match from /admin", async () => {
    const { app, create, station } = setup();
    await create({ station: 1, playerIds: ["ann", "bob"] });

    const res = await app.inject({ method: "POST", url: "/api/admin/stations/1/abandon" });

    expect(res.statusCode).toBe(200);
    expect((await station(1)).match).toBeNull();
    expect((await create({ station: 1, playerIds: ["cid", "bob"] })).statusCode).toBe(201);
  });

  it("needs the admin PIN", async () => {
    const { app, create } = setup("1234");

    expect((await create({ station: 1, playerIds: ["ann", "bob"] })).statusCode).toBe(401);
    expect(
      (await app.inject({ method: "POST", url: "/api/admin/stations/1/abandon" })).statusCode,
    ).toBe(401);
  });
});

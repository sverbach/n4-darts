import { afterEach, describe, expect, it } from "vitest";
import type { PastTournament, PastTournamentSummary } from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";
import { playTournament } from "../testing/tournament.ts";

let db: Db;
afterEach(() => db?.close());

function setup() {
  db = openDb(":memory:");
  const ids = ["ann", "bob", "cid", "dee"];
  for (const id of ids) db.addPlayer({ id, name: id.toUpperCase(), archived: false });
  const app = buildApp({ db });
  const get = async (url: string) => {
    const res = await app.inject(url);
    return { status: res.statusCode, body: res.json() };
  };
  return { app, ids, get };
}

describe("past tournaments", () => {
  it("lists finished tournaments with their champion", async () => {
    const { app, ids, get } = setup();
    expect((await get("/api/tournaments")).body).toEqual([]);

    const id = await playTournament(app, db, ids);
    const list = (await get("/api/tournaments")).body as PastTournamentSummary[];
    expect(list).toEqual([
      { id, name: "Test night", date: expect.any(String), champion: expect.any(Object) },
    ]);
    expect(ids).toContain(list[0]?.champion?.id);
  });

  it("shows a finished tournament's placings, awards, groups and bracket", async () => {
    const { app, ids, get } = setup();
    const id = await playTournament(app, db, ids);

    const { status, body } = await get(`/api/tournaments/${id}`);
    expect(status).toBe(200);
    const page = body as PastTournament;
    expect(page.endedEarly).toBe(false);
    expect(page.placings?.map((p) => p.id).sort()).toEqual([...ids].sort());
    expect(page.placings?.[0]?.id).toBe(page.champion?.id);
    expect(page.awards?.length).toBeGreaterThan(0);
    expect(page.groups[0]?.table).toHaveLength(4);
    expect(page.groups[0]?.fixtures.every((f) => f.status === "played")).toBe(true);
    expect(page.bracket.length).toBeGreaterThan(0);
  });

  it("leaves out a running tournament and answers 404 for it", async () => {
    const { app, ids, get } = setup();
    await app.inject({ method: "POST", url: "/api/admin/tournament", payload: { playerIds: ids } });
    const running = await app.inject({ method: "POST", url: "/api/admin/tournament/start" });
    const id = running.json().tournament.id as string;

    expect((await get("/api/tournaments")).body).toEqual([]);
    expect((await get(`/api/tournaments/${id}`)).status).toBe(404);
    expect((await get("/api/tournaments/nope")).status).toBe(404);
  });
});

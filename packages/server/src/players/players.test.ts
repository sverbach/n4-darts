import { afterEach, describe, expect, it } from "vitest";
import type { Player } from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";

let db: Db;
afterEach(() => db?.close());

function setup() {
  db = openDb(":memory:");
  const app = buildApp({ db });
  const add = async (name: string) => {
    const res = await app.inject({ method: "POST", url: "/api/admin/players", payload: { name } });
    return { status: res.statusCode, body: res.json() };
  };
  const patch = (id: string, payload: object) =>
    app.inject({ method: "PATCH", url: `/api/admin/players/${id}`, payload });
  const names = async (url: string) =>
    ((await app.inject(url)).json() as Player[]).map((p) => p.name);
  return { app, add, patch, names };
}

describe("players", () => {
  it("adds players and lists them by name", async () => {
    const { add, names } = setup();

    const res = await add("  Sven  ");
    await add("ann");
    await add("Bob");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Sven", archived: false });
    expect(await names("/api/players")).toEqual(["ann", "Bob", "Sven"]);
  });

  it("refuses an empty name or one that's already taken in any case", async () => {
    const { add } = setup();
    await add("Sven");

    expect((await add("   ")).status).toBe(400);
    expect((await add("sVEN")).status).toBe(409);
    expect((await add("Älex")).status).toBe(201);
    expect((await add("älex")).status).toBe(409);
  });

  it("renames a player, but not onto another player's name", async () => {
    const { add, patch, names } = setup();
    const sven = (await add("Sven")).body as Player;
    await add("Ann");

    expect((await patch(sven.id, { name: "ann" })).statusCode).toBe(409);
    expect((await patch(sven.id, { name: "SVEN" })).statusCode).toBe(200);
    expect((await patch(sven.id, { name: "Sven E." })).json()).toMatchObject({ name: "Sven E." });
    expect(await names("/api/players")).toEqual(["Ann", "Sven E."]);
  });

  it("hides archived players from the public list but keeps them in admin", async () => {
    const { add, patch, names } = setup();
    const sven = (await add("Sven")).body as Player;
    await add("Ann");

    await patch(sven.id, { archived: true });
    expect(await names("/api/players")).toEqual(["Ann"]);
    expect(await names("/api/admin/players")).toEqual(["Ann", "Sven"]);

    await patch(sven.id, { archived: false });
    expect(await names("/api/players")).toEqual(["Ann", "Sven"]);
  });

  it("keeps an archived player's name taken", async () => {
    const { add, patch } = setup();
    const sven = (await add("Sven")).body as Player;
    await patch(sven.id, { archived: true });

    expect((await add("Sven")).status).toBe(409);
  });

  it("deletes a player", async () => {
    const { app, add, names } = setup();
    const sven = (await add("Sven")).body as Player;

    const res = await app.inject({ method: "DELETE", url: `/api/admin/players/${sven.id}` });
    expect(res.statusCode).toBe(204);
    expect(await names("/api/admin/players")).toEqual([]);
  });

  it("won't delete a player who has matches", async () => {
    const { app, add } = setup();
    const ann = (await add("Ann")).body as Player;
    const bob = (await add("Bob")).body as Player;
    db.createMatch({
      id: "m1",
      station: null,
      settings: {
        startScore: 301,
        inRule: "straight",
        outRule: "straight",
        legsToWin: 1,
        rulesVersion: 1,
      },
      playerIds: [ann.id, bob.id],
    });

    const res = await app.inject({ method: "DELETE", url: `/api/admin/players/${ann.id}` });
    expect(res.statusCode).toBe(409);
    expect(db.getPlayer(ann.id)).toBeDefined();
  });

  it("lets a station add a player without the admin PIN", async () => {
    db = openDb(":memory:");
    const app = buildApp({ db, adminPin: "1234" });

    const res = await app.inject({
      method: "POST",
      url: "/api/players",
      payload: { name: "Sven" },
    });
    expect(res.statusCode).toBe(201);
    expect(db.playerNamed("sven")?.name).toBe("Sven");
  });

  it("answers 404 for a player that doesn't exist", async () => {
    const { app, patch } = setup();

    expect((await patch("nope", { name: "X" })).statusCode).toBe(404);
    expect(
      (await app.inject({ method: "DELETE", url: "/api/admin/players/nope" })).statusCode,
    ).toBe(404);
  });

  it("needs the admin PIN to change players, but not to list them", async () => {
    db = openDb(":memory:");
    const app = buildApp({ db, adminPin: "1234" });

    const add = await app.inject({
      method: "POST",
      url: "/api/admin/players",
      payload: { name: "Sven" },
    });
    expect(add.statusCode).toBe(401);
    expect((await app.inject("/api/players")).statusCode).toBe(200);
  });
});

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp, buildPublicApp } from "../../app.ts";
import { type Db, openDb } from "../../db.ts";
import { createStationRegistry, type StationRegistry } from "../../stations/stations.ts";
import { seedHistory } from "../seed.ts";

const PUBLIC_ROUTES = [
  "GET /api/health",
  "GET /api/players/stats",
  "GET /api/players/:id/stats",
  "GET /api/players/:id/photo",
];

/** Every registered route as "METHOD /path" (HEAD left out: Fastify adds it to each GET). */
function routes(app: FastifyInstance): string[] {
  const found: string[] = [];
  for (const line of app.printRoutes({ commonPrefix: false }).split("\n")) {
    const match = line.match(/(\/\S*) \(([A-Z, ]+)\)/);
    if (!match) continue;
    for (const method of (match[2] as string).split(", ")) {
      if (method !== "HEAD") found.push(`${method} ${match[1]}`);
    }
  }
  return [...new Set(found)].sort();
}

const opened: { close(): void }[] = [];
afterEach(() => {
  for (const item of opened.splice(0).reverse()) item.close();
});

function databaseFile() {
  return join(mkdtempSync(join(tmpdir(), "n4-public-")), "n4-darts.db");
}

function roomServer(path: string) {
  const db = openDb(path);
  const registry: StationRegistry = createStationRegistry(db, {
    seed: "1=http://localhost:1",
    gatewayOptions: { reconnectDelayMs: 1000, maxReconnectDelayMs: 1000 },
  });
  opened.push(db, registry);
  return { db, app: buildApp({ db, stations: registry, adminPin: "1234" }) };
}

function publicServer(path: string): { db: Db; app: FastifyInstance } {
  const db = openDb(path, { readOnly: true });
  opened.push(db);
  return { db, app: buildPublicApp({ db }) };
}

describe("the public server", () => {
  it("registers only the public read routes", async () => {
    const path = databaseFile();
    const room = roomServer(path);
    const site = publicServer(path);
    await room.app.ready();
    await site.app.ready();

    expect(routes(site.app)).toEqual([...PUBLIC_ROUTES].sort());

    const privateRoutes = routes(room.app).filter((r) => !PUBLIC_ROUTES.includes(r));
    expect(privateRoutes.length).toBeGreaterThan(30);
    for (const route of privateRoutes) {
      const [method, url] = route.split(" ") as [string, string];
      const res = await site.app.inject({
        method: method as "GET",
        url: url.replace(/:\w+/g, "x"),
      });
      expect(res.statusCode, route).toBe(404);
    }
  });

  it("reads the room's database while the room's server writes to it", async () => {
    const path = databaseFile();
    const room = roomServer(path);
    const site = publicServer(path);

    room.db.addPlayer({ id: "ann", name: "Ann", archived: false });
    expect(site.db.getPlayer("ann")?.name).toBe("Ann");
    room.db.addPlayer({ id: "bob", name: "Bob", archived: false });
    expect(site.db.players().map((p) => p.name)).toEqual(["Ann", "Bob"]);

    expect(() => site.db.addPlayer({ id: "cid", name: "Cid", archived: false })).toThrow(
      /readonly/,
    );
  });

  it("follows a correction the room's server makes to a match it already showed", async () => {
    const path = databaseFile();
    const room = roomServer(path);
    const site = publicServer(path);
    room.db.addPlayer({ id: "ann", name: "Ann", archived: false });
    room.db.addPlayer({ id: "bob", name: "Bob", archived: false });
    seedHistory(room.db, { matches: 1, playerIds: ["ann", "bob"] });
    const average = async () =>
      ((await site.app.inject("/api/players/stats")).json() as { average: number }[])[0]?.average;

    const before = await average();
    room.db.append("seed-0", {
      type: "DartCorrected",
      dartId: "seed-0-0",
      segment: { number: 1, multiplier: 1 },
      source: "admin",
    });
    expect(await average()).not.toBe(before);
  });

  describe("a player hidden from the public site", () => {
    function history() {
      const path = databaseFile();
      const room = roomServer(path);
      const site = publicServer(path);
      room.db.addPlayer({ id: "p-ann", name: "Ann", archived: false, public: false });
      room.db.addPlayer({ id: "p-bob", name: "Bob", archived: false });
      room.db.setPhoto("p-ann", new Uint8Array([0xff, 0xd8, 0xff, 0xe0]));
      seedHistory(room.db, { matches: 2, playerIds: ["p-ann", "p-bob"] });
      return { room, site };
    }
    const get = async (app: FastifyInstance, url: string) => {
      const res = await app.inject(url);
      return { status: res.statusCode, body: res.body };
    };

    it("is 'Player' on the leaderboard, without photo or id", async () => {
      const { site } = history();
      const board = await get(site.app, "/api/players/stats");
      expect(board.body).not.toMatch(/Ann|p-ann/);
      const rows = JSON.parse(board.body) as { playerId: string; name: string; photo: unknown }[];
      expect(rows.find((r) => r.name === "Player")).toMatchObject({
        playerId: "hidden-1",
        photo: null,
      });
    });

    it("has no public profile or photo", async () => {
      const { site } = history();
      expect((await get(site.app, "/api/players/p-ann/stats")).status).toBe(404);
      expect((await get(site.app, "/api/players/hidden-1/stats")).status).toBe(404);
      expect((await get(site.app, "/api/players/p-ann/photo")).status).toBe(404);
    });

    it("is 'Player' in others' profiles", async () => {
      const { site } = history();
      const profile = await get(site.app, "/api/players/p-bob/stats");
      expect(profile.status).toBe(200);
      expect(profile.body).not.toMatch(/Ann|p-ann/);
      expect(JSON.parse(profile.body).recent[0].opponents).toEqual(["Player"]);
    });

    it("stays as they are on the room's pages", async () => {
      const { room } = history();
      expect((await get(room.app, "/api/players/stats")).body).toMatch(/Ann/);
      expect((await get(room.app, "/api/players/p-ann/stats")).status).toBe(200);
    });
  });

  it("refuses a database the room's server hasn't brought up to date", () => {
    expect(() => openDb(databaseFile(), { readOnly: true })).toThrow();
  });
});

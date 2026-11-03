import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { createAccess } from "../../access/admin.ts";
import { buildApp, buildPublicApp } from "../../app.ts";
import { type Db, openDb } from "../../db.ts";
import { createStationRegistry, type StationRegistry } from "../../stations/stations.ts";
import { seedHistory } from "../seed.ts";
import { playTournament } from "../tournament.ts";

const PUBLIC_ROUTES = [
  "GET /api/health",
  "GET /api/players/stats",
  "GET /api/players/:id/stats",
  "GET /api/players/:id/photo",
  "GET /api/tournaments",
  "GET /api/tournaments/:id",
  "GET /api/matches/:id",
  "GET /api/public/session",
  "POST /api/public/login",
  "POST /api/public/logout",
];
const PIN = "4321";
const LOGGED_IN = `n4_public=${createAccess(PIN, "public").token}`;

type Inject = (options: InjectOptions | string) => Promise<LightMyRequestResponse>;

/** Every registered route as "METHOD /path" (HEAD left out: Fastify adds it to each GET). */
function routes(app: FastifyInstance): string[] {
  const found: string[] = [];
  const parents: string[] = [];
  for (const line of app.printRoutes({ commonPrefix: false }).split("\n")) {
    const match = line.match(/^([│├└─\s]*)(\/\S*) \(([A-Z, ]+)\)/);
    if (!match) continue;
    const depth = (match[1] as string).length / 4;
    parents.length = depth;
    const path = `${parents[depth - 1] ?? ""}${match[2]}`;
    parents[depth] = path;
    for (const method of (match[3] as string).split(", ")) {
      if (method !== "HEAD") found.push(`${method} ${path}`);
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
  const app = buildApp({ db, stations: registry, adminPin: "1234" });
  const inject: Inject = (options) => app.inject(options);
  return { db, app, inject };
}

/** The public server; `inject` asks as a device that has logged in. */
function publicServer(path: string): { db: Db; app: FastifyInstance; inject: Inject } {
  const db = openDb(path, { readOnly: true });
  opened.push(db);
  const app = buildPublicApp({ db, pin: PIN, wrongPinDelayMs: 0 });
  const inject: Inject = (options) => {
    const asked = typeof options === "string" ? { url: options } : options;
    return app.inject({ ...asked, headers: { ...asked.headers, cookie: LOGGED_IN } });
  };
  return { db, app, inject };
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
      const res = await site.inject({
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
      ((await site.inject("/api/players/stats")).json() as { average: number }[])[0]?.average;

    const before = await average();
    room.db.append("seed-0", {
      type: "DartCorrected",
      dartId: "seed-0-0",
      segment: { number: 1, multiplier: 1 },
      source: "admin",
    });
    expect(await average()).not.toBe(before);
  });

  describe("the shared password", () => {
    /** The public server on a database the room's server has set up. */
    const sitePublic = () => {
      const path = databaseFile();
      roomServer(path);
      return publicServer(path);
    };

    it("is needed for everything but logging in", async () => {
      const site = sitePublic();
      expect((await site.app.inject("/api/players/stats")).statusCode).toBe(401);
      expect((await site.app.inject("/api/players/x/photo")).statusCode).toBe(401);
      expect((await site.app.inject("/api/public/session")).json()).toEqual({
        public: true,
        authenticated: false,
      });
      expect((await site.inject("/api/players/stats")).statusCode).toBe(200);
    });

    it("logs a device in with the right PIN, and not with a wrong one", async () => {
      const site = sitePublic();
      const login = (pin: string, headers = {}) =>
        site.app.inject({ method: "POST", url: "/api/public/login", payload: { pin }, headers });

      expect((await login("0000")).statusCode).toBe(401);
      const res = await login(PIN);
      expect(res.statusCode).toBe(204);
      const cookie = String(res.headers["set-cookie"]);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).not.toMatch(/Secure/);
      const session = await site.app.inject({
        url: "/api/public/session",
        headers: { cookie: cookie.split(";")[0] as string },
      });
      expect(session.json()).toEqual({ public: true, authenticated: true });

      const tls = await login(PIN, { "x-forwarded-proto": "https" });
      expect(String(tls.headers["set-cookie"])).toMatch(/Secure/);
    });

    it("doesn't take the admin PIN's cookie", async () => {
      const site = sitePublic();
      const res = await site.app.inject({
        url: "/api/players/stats",
        headers: { cookie: `n4_public=${createAccess(PIN).token}` },
      });
      expect(res.statusCode).toBe(401);
    });

    it("must be set, or the public server doesn't start", () => {
      const main = fileURLToPath(new URL("../../main.ts", import.meta.url));
      const run = spawnSync(
        process.execPath,
        ["--conditions=source", "--experimental-strip-types", main],
        {
          env: { ...process.env, N4_PUBLIC: "1", N4_PUBLIC_PIN: "", DATA_DIR: databaseFile() },
          encoding: "utf8",
          timeout: 10_000,
        },
      );
      expect(run.status).toBe(1);
      expect(run.stderr).toMatch(/N4_PUBLIC_PIN/);
    });

    it("asks search engines to stay away", async () => {
      const site = sitePublic();
      expect((await site.app.inject("/api/public/session")).headers["x-robots-tag"]).toBe(
        "noindex, nofollow",
      );
    });

    it("tells the room's web app it isn't the public site", async () => {
      const room = roomServer(databaseFile());
      expect((await room.inject("/api/public/session")).json()).toEqual({
        public: false,
        authenticated: true,
      });
    });
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
    const get = async (server: { inject: Inject }, url: string) => {
      const res = await server.inject(url);
      return { status: res.statusCode, body: res.body };
    };

    it("is 'Player' on the leaderboard, without photo or id", async () => {
      const { site } = history();
      const board = await get(site, "/api/players/stats");
      expect(board.body).not.toMatch(/Ann|p-ann/);
      const rows = JSON.parse(board.body) as { playerId: string; name: string; photo: unknown }[];
      expect(rows.find((r) => r.name === "Player")).toMatchObject({
        playerId: "hidden-1",
        photo: null,
      });
    });

    it("has no public profile or photo", async () => {
      const { site } = history();
      expect((await get(site, "/api/players/p-ann/stats")).status).toBe(404);
      expect((await get(site, "/api/players/hidden-1/stats")).status).toBe(404);
      expect((await get(site, "/api/players/p-ann/photo")).status).toBe(404);
    });

    it("is 'Player' in others' profiles", async () => {
      const { site } = history();
      const profile = await get(site, "/api/players/p-bob/stats");
      expect(profile.status).toBe(200);
      expect(profile.body).not.toMatch(/Ann|p-ann/);
      expect(JSON.parse(profile.body).recent[0].opponents).toEqual(["Player"]);
    });

    it("is 'Player' in a tournament's placings, groups, bracket and awards", async () => {
      const { room, site } = history();
      room.db.addPlayer({ id: "p-cid", name: "Cid", archived: false });
      room.db.addPlayer({ id: "p-dee", name: "Dee", archived: false });
      const id = await playTournament(buildApp({ db: room.db }), room.db, [
        "p-ann",
        "p-bob",
        "p-cid",
        "p-dee",
      ]);

      const page = await get(site, `/api/tournaments/${id}`);
      expect(page.status).toBe(200);
      expect(page.body).toMatch(/Bob/);
      expect(page.body).not.toMatch(/Ann|p-ann/);
      expect(page.body).toMatch(/"Player"/);
      expect((await get(site, "/api/tournaments")).body).not.toMatch(/Ann|p-ann/);
      expect((await get(room, `/api/tournaments/${id}`)).body).toMatch(/Ann/);
    });

    it("is 'Player' on a match's page", async () => {
      const { room, site } = history();
      const page = await get(site, "/api/matches/seed-0");
      expect(page.status).toBe(200);
      expect(page.body).toMatch(/Bob/);
      expect(page.body).not.toMatch(/Ann|p-ann/);
      expect(JSON.parse(page.body).players.map((p: { name: string }) => p.name)).toContain(
        "Player",
      );
      expect((await get(room, "/api/matches/seed-0")).body).toMatch(/Ann/);
    });

    it("stays as they are on the room's pages", async () => {
      const { room } = history();
      expect((await get(room, "/api/players/stats")).body).toMatch(/Ann/);
      expect((await get(room, "/api/players/p-ann/stats")).status).toBe(200);
    });
  });

  it("refuses a database the room's server hasn't brought up to date", () => {
    expect(() => openDb(databaseFile(), { readOnly: true })).toThrow();
  });
});

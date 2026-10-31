import { type BoardSim, createBoardSim, type SimView } from "@n4/board-sim";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StationAdminView, StationView } from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";
import { createStationRegistry, parseStationsConfig, type StationRegistry } from "./stations.ts";

let sims: BoardSim[] = [];
let registry: StationRegistry | undefined;
let db: Db | undefined;
afterEach(async () => {
  registry?.close();
  registry = undefined;
  db?.close();
  db = undefined;
  for (const sim of sims) await sim.close();
  sims = [];
});

const gatewayOptions = { reconnectDelayMs: 10, maxReconnectDelayMs: 20 };

async function setup(seed?: string) {
  sims = [await createBoardSim(), await createBoardSim()];
  db = openDb(":memory:");
  registry = createStationRegistry(db, { seed, gatewayOptions });
  const app = buildApp({ db, stations: registry });
  const admin = async (method: string, url: string, payload?: object) => {
    const res = await app.inject({ method: method as "GET", url, ...(payload ? { payload } : {}) });
    return { status: res.statusCode, body: res.body ? res.json() : null };
  };
  const list = async () => (await admin("GET", "/api/admin/stations")).body as StationAdminView[];
  return { app, admin, list };
}

describe("parsing STATIONS", () => {
  it("reads station numbers and Board Manager addresses", () => {
    expect(parseStationsConfig("1=http://a:3180, 2=http://b:3180")).toEqual([
      { id: 1, boardUrl: "http://a:3180" },
      { id: 2, boardUrl: "http://b:3180" },
    ]);
    expect(() => parseStationsConfig("one=http://a")).toThrow();
  });
});

describe("stations in /admin", () => {
  it("adds a station, which connects to its board straight away", async () => {
    const { admin, list } = await setup();

    const res = await admin("POST", "/api/admin/stations", {
      name: "Left board",
      boardUrl: sims[0]?.url,
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, name: "Left board" });
    await vi.waitFor(async () => expect((await list())[0]?.boardOnline).toBe(true));
    const view = (await admin("GET", "/api/stations/1")).body as StationView;
    expect(view.name).toBe("Left board");
  });

  it("numbers new stations after the highest one and refuses a taken number", async () => {
    const { admin } = await setup();
    await admin("POST", "/api/admin/stations", { id: 3, name: "Three", boardUrl: sims[0]?.url });

    expect(
      (await admin("POST", "/api/admin/stations", { boardUrl: sims[1]?.url })).body,
    ).toMatchObject({ id: 4, name: "Station 4" });
    expect(
      (await admin("POST", "/api/admin/stations", { id: 3, boardUrl: sims[1]?.url })).status,
    ).toBe(409);
    expect((await admin("POST", "/api/admin/stations", { boardUrl: "not a url" })).status).toBe(
      400,
    );
  });

  it("moves a station to another board without a restart", async () => {
    const { admin, list } = await setup();
    await admin("POST", "/api/admin/stations", { name: "One", boardUrl: sims[0]?.url });
    await vi.waitFor(async () => expect((await list())[0]?.boardOnline).toBe(true));

    const res = await admin("PATCH", "/api/admin/stations/1", { boardUrl: sims[1]?.url });

    expect(res.status).toBe(200);
    await vi.waitFor(() => expect(registry?.list()[0]?.view().boardOnline).toBe(true));
    // The old board is let go, the new one is followed.
    await vi.waitFor(async () => {
      const [old, now] = await Promise.all(
        (sims as BoardSim[]).map(
          async (s) => (await (await fetch(`${s.url}/sim/state`)).json()) as SimView,
        ),
      );
      expect([old?.boardClients, now?.boardClients]).toEqual([0, 1]);
    });
    expect((await list())[0]).toMatchObject({ name: "One", boardUrl: sims[1]?.url });
  });

  it("renames a station", async () => {
    const { admin } = await setup();
    await admin("POST", "/api/admin/stations", { name: "One", boardUrl: sims[0]?.url });

    await admin("PATCH", "/api/admin/stations/1", { name: "Window" });

    expect(((await admin("GET", "/api/stations/1")).body as StationView).name).toBe("Window");
  });

  it("removes a free station, but not one with a match", async () => {
    const { admin, list } = await setup();
    db?.addPlayer({ id: "ann", name: "Ann", archived: false });
    db?.addPlayer({ id: "bob", name: "Bob", archived: false });
    await admin("POST", "/api/admin/stations", { boardUrl: sims[0]?.url });
    await admin("POST", "/api/admin/stations", { boardUrl: sims[1]?.url });
    await admin("POST", "/api/admin/matches", { station: 1, playerIds: ["ann", "bob"] });

    expect((await admin("DELETE", "/api/admin/stations/1")).status).toBe(409);
    expect((await admin("DELETE", "/api/admin/stations/2")).status).toBe(204);
    expect((await list()).map((s) => s.id)).toEqual([1]);
    expect((await admin("GET", "/api/stations/2")).status).toBe(404);
  });

  it("needs the admin PIN", async () => {
    sims = [await createBoardSim()];
    db = openDb(":memory:");
    registry = createStationRegistry(db, { gatewayOptions });
    const app = buildApp({ db, stations: registry, adminPin: "1234" });

    const res = await app.inject({
      method: "POST",
      url: "/api/admin/stations",
      payload: { boardUrl: sims[0]?.url },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("seeding from STATIONS", () => {
  it("happens once, on a fresh database", async () => {
    const { admin, list } = await setup("1=http://127.0.0.1:1,2=http://127.0.0.1:2");
    expect((await list()).map((s) => [s.id, s.name, s.boardUrl])).toEqual([
      [1, "Station 1", "http://127.0.0.1:1"],
      [2, "Station 2", "http://127.0.0.1:2"],
    ]);

    await admin("DELETE", "/api/admin/stations/1");
    await admin("DELETE", "/api/admin/stations/2");
    registry?.close();
    registry = createStationRegistry(db as Db, {
      seed: "1=http://127.0.0.1:1",
      gatewayOptions,
    });

    expect(registry.list()).toEqual([]);
  });
});

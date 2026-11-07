import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type {
  AdminPlayer,
  DisplayView,
  MatchSummary,
  Player,
  StationView,
  TournamentAdminView,
} from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";
import { createStation, type Station } from "../stations/station.ts";
import { openLive } from "../testing/liveClient.ts";
import { enableLive, liveView } from "./liveRoutes.ts";

let db: Db | undefined;
const closers: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const close of closers.splice(0)) await close();
  db?.close();
  db = undefined;
});

async function listen(app: ReturnType<typeof Fastify> | ReturnType<typeof buildApp>) {
  await app.listen({ port: 0, host: "127.0.0.1" });
  closers.push(() => app.close());
  return `http://127.0.0.1:${app.addresses()[0]?.port}`;
}

/** Opens a stream that's closed when the test ends. */
function open<T>(url: string, headers: Record<string, string> = {}) {
  const live = openLive<T>(url, headers);
  closers.unshift(() => live.close());
  return live;
}

function setup(adminPin?: string) {
  db = openDb(":memory:");
  for (const id of ["ann", "bob"]) db.addPlayer({ id, name: id, archived: false });
  const board = { reset: async () => {} };
  const station = createStation({ id: 1, db, board });
  const app = buildApp({ db, stations: [station], adminPin });
  return { app, station };
}

const dart = (station: Station, name: string, number: number, multiplier: 0 | 1 | 2 | 3) =>
  station.handleBoardEvent({
    type: "DartDetected",
    index: 0,
    segment: { number, multiplier },
    name,
    coords: { x: 0, y: 0 },
    bouncer: false,
  });

describe("live streams", () => {
  it("pushes the display view when a dart is thrown", async () => {
    const { app, station } = setup();
    const base = await listen(app);
    const display = open<DisplayView>(`${base}/api/display/live`);
    expect((await display.next()).stations[0]?.match).toBeNull();

    await station.command({ type: "quickMatch", playerIds: ["ann", "bob"] });
    expect((await display.next()).stations[0]?.match?.players.map((p) => p.name)).toEqual([
      "ann",
      "bob",
    ]);
    await station.command({ type: "startMatch" });
    expect((await display.next()).stations[0]?.match?.throwing).toBe(0);
    dart(station, "T20", 20, 3);
    const card = (await display.next()).stations[0]?.match;
    expect(card?.players[0]?.score).toBe("241");
    expect(card?.visit.map((d) => d.score)).toEqual([60]);
  });

  it("pushes the admin tournament view on every change", async () => {
    const { app } = setup();
    const base = await listen(app);
    const admin = open<TournamentAdminView>(`${base}/api/admin/tournament/live`);
    expect((await admin.next()).tournament).toBeNull();

    await app.inject({
      method: "POST",
      url: "/api/admin/tournament",
      payload: { playerIds: ["ann", "bob"] },
    });
    const view = await admin.next();
    expect(view.tournament?.status).toBe("draft");
    expect(view.entrants).toHaveLength(2);
  });

  it("pushes the station list when a station changes", async () => {
    const { app, station } = setup();
    const base = await listen(app);
    const list = open<StationView[]>(`${base}/api/stations/live`);
    expect((await list.next())[0]?.match).toBeNull();

    await station.command({ type: "quickMatch", playerIds: ["ann", "bob"] });
    expect((await list.next())[0]?.match?.players).toHaveLength(2);
  });

  it("pushes both player lists when a player is added at a station or renamed in /admin", async () => {
    const { app } = setup();
    const base = await listen(app);
    const list = open<Player[]>(`${base}/api/players/live`);
    const admin = open<AdminPlayer[]>(`${base}/api/admin/players/live`);
    expect((await list.next()).map((p) => p.name)).toEqual(["ann", "bob"]);
    expect((await admin.next()).map((p) => p.name)).toEqual(["ann", "bob"]);

    await app.inject({ method: "POST", url: "/api/players", payload: { name: "Cid" } });
    expect((await list.next()).map((p) => p.name)).toEqual(["ann", "bob", "Cid"]);
    expect((await admin.next()).map((p) => p.name)).toEqual(["ann", "bob", "Cid"]);

    await app.inject({
      method: "PATCH",
      url: "/api/admin/players/ann",
      payload: { archived: true },
    });
    expect((await list.next()).map((p) => p.name)).toEqual(["bob", "Cid"]);
    expect((await admin.next()).find((p) => p.id === "ann")?.archived).toBe(true);
  });

  it("pushes the match history when a match finishes", async () => {
    const { app, station } = setup();
    const base = await listen(app);
    const history = open<MatchSummary[]>(`${base}/api/admin/matches/live`);
    expect(await history.next()).toEqual([]);

    await station.command({ type: "quickMatch", playerIds: ["ann", "bob"] });
    await station.command({ type: "startMatch" });
    await station.command({ type: "abandonMatch" });
    let list = await history.next();
    while (!list[0]?.abandoned) list = await history.next();
    expect(list).toHaveLength(1);
  });

  it("refuses the admin streams without the PIN with 4401; the display stream is public", async () => {
    const { app } = setup("1234");
    const base = await listen(app);
    for (const path of [
      "/api/admin/tournament/live",
      "/api/admin/players/live",
      "/api/admin/matches/live",
    ]) {
      expect(await open(`${base}${path}`).closed).toEqual({
        code: 4401,
        reason: "admin PIN required",
      });
    }
    await open(`${base}/api/players/live`).next();
    await open(`${base}/api/display/live`).next();
  });

  it("closes with 4000 + the status when a stream can't be followed", async () => {
    const { app } = setup();
    const base = await listen(app);
    expect(await open(`${base}/api/stations/9/live`).closed).toEqual({
      code: 4404,
      reason: "no such station",
    });
    expect((await open(`${base}/api/stations/one/live`).closed).code).toBe(4400);
  });

  it("unsubscribes when the client goes away", async () => {
    const listeners = new Set<() => void>();
    const app = Fastify();
    enableLive(app);
    await app.after();
    liveView(app, "/live", () => ({
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      view: () => ({ n: listeners.size }),
      kind: "display",
    }));
    const base = await listen(app);
    const stream = open<{ n: number }>(`${base}/live`);
    await stream.next();
    expect(listeners.size).toBe(1);

    await stream.close();
    for (let i = 0; i < 50 && listeners.size > 0; i++) await new Promise((r) => setTimeout(r, 10));
    expect(listeners.size).toBe(0);
  });
});

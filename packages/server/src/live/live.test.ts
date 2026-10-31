import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type {
  AdminPlayer,
  DisplayView,
  MatchDetail,
  MatchSummary,
  Player,
  StationView,
  TournamentAdminView,
} from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";
import { createStation, type Station } from "../stations/station.ts";
import { streamView } from "./liveRoutes.ts";

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

/** Opens a stream; `next()` resolves with the next pushed view. */
async function open<T>(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers });
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const next = async (): Promise<T> => {
    while (!buffer.includes("\n\n")) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended");
      buffer += decoder.decode(value);
    }
    const end = buffer.indexOf("\n\n");
    const message = buffer.slice(0, end);
    buffer = buffer.slice(end + 2);
    if (message.startsWith(":")) return next();
    return JSON.parse(message.replace(/^data: /, ""));
  };
  closers.unshift(() => reader.cancel().catch(() => {}));
  return { status: res.status, next, cancel: () => reader.cancel() };
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
  it("tells proxies not to buffer or compress the stream", async () => {
    const { app } = setup();
    const res = await fetch(`${await listen(app)}/api/display/live`);
    closers.unshift(() => (res.body as ReadableStream).cancel().catch(() => {}));
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
    expect(res.headers.get("cache-control")).toBe("no-cache, no-transform");
  });

  it("pushes the display view when a dart is thrown", async () => {
    const { app, station } = setup();
    const base = await listen(app);
    const display = await open<DisplayView>(`${base}/api/display/live`);
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
    expect(card?.players[0]?.remaining).toBe(241);
    expect(card?.visit.map((d) => d.score)).toEqual([60]);
  });

  it("pushes the admin tournament view on every change", async () => {
    const { app } = setup();
    const base = await listen(app);
    const admin = await open<TournamentAdminView>(`${base}/api/admin/tournament/live`);
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

  it("pushes a match's detail when it's corrected", async () => {
    const { app, station } = setup();
    const base = await listen(app);
    await station.command({ type: "quickMatch", playerIds: ["ann", "bob"] });
    await station.command({ type: "startMatch" });
    dart(station, "S20", 20, 1);
    const matchId = station.view().match?.id as string;
    const detail = await open<MatchDetail>(`${base}/api/admin/matches/${matchId}/live`);
    expect((await detail.next()).state.players[0]?.remaining).toBe(281);

    const dartId = station.view().match?.state.currentVisit?.darts[0]?.dartId;
    await app.inject({
      method: "POST",
      url: `/api/admin/matches/${matchId}/corrections`,
      payload: { dartId, segment: { number: 20, multiplier: 3 } },
    });
    expect((await detail.next()).state.players[0]?.remaining).toBe(241);
  });

  it("pushes the station list when a station changes", async () => {
    const { app, station } = setup();
    const base = await listen(app);
    const list = await open<StationView[]>(`${base}/api/stations/live`);
    expect((await list.next())[0]?.match).toBeNull();

    await station.command({ type: "quickMatch", playerIds: ["ann", "bob"] });
    expect((await list.next())[0]?.match?.players).toHaveLength(2);
  });

  it("pushes both player lists when a player is added at a station or renamed in /admin", async () => {
    const { app } = setup();
    const base = await listen(app);
    const list = await open<Player[]>(`${base}/api/players/live`);
    const admin = await open<AdminPlayer[]>(`${base}/api/admin/players/live`);
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
    const history = await open<MatchSummary[]>(`${base}/api/admin/matches/live`);
    expect(await history.next()).toEqual([]);

    await station.command({ type: "quickMatch", playerIds: ["ann", "bob"] });
    await station.command({ type: "startMatch" });
    await station.command({ type: "abandonMatch" });
    let list = await history.next();
    while (!list[0]?.abandoned) list = await history.next();
    expect(list).toHaveLength(1);
  });

  it("refuses the admin streams without the PIN; the display stream is public", async () => {
    const { app } = setup("1234");
    const base = await listen(app);
    expect((await fetch(`${base}/api/admin/tournament/live`)).status).toBe(401);
    expect((await fetch(`${base}/api/admin/matches/x/live`)).status).toBe(401);
    expect((await fetch(`${base}/api/admin/players/live`)).status).toBe(401);
    expect((await fetch(`${base}/api/admin/matches/live`)).status).toBe(401);
    expect((await open(`${base}/api/players/live`)).status).toBe(200);
    expect((await open(`${base}/api/display/live`)).status).toBe(200);
  });

  it("unsubscribes when the client goes away", async () => {
    const listeners = new Set<() => void>();
    const app = Fastify();
    app.get("/live", (request, reply) =>
      streamView(
        request,
        reply,
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => ({ n: listeners.size }),
        { kind: "display" },
      ),
    );
    const base = await listen(app);
    const stream = await open<{ n: number }>(`${base}/live`);
    await stream.next();
    expect(listeners.size).toBe(1);

    await stream.cancel();
    for (let i = 0; i < 50 && listeners.size > 0; i++) await new Promise((r) => setTimeout(r, 10));
    expect(listeners.size).toBe(0);
  });
});

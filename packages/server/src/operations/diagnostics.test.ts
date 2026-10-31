import { type BoardSim, createBoardSim } from "@n4/board-sim";
import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DiagnosticsView, StationView } from "../api.ts";
import { buildApp } from "../app.ts";
import { openDb } from "../db.ts";
import { streamView } from "../live/liveRoutes.ts";
import { startStation } from "../stations/stations.ts";
import { createDiagnostics, diagnostics as recorder } from "./diagnostics.ts";

let sim: BoardSim | undefined;
const closers: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  for (const close of closers.splice(0)) await close();
  await sim?.close();
  sim = undefined;
});

/** The server with station 1 on the simulator, listening, as main.ts wires it. */
async function setup(adminPin?: string, diagnosticsRefreshMs = 50) {
  sim = await createBoardSim();
  const db = openDb(":memory:");
  for (const id of ["ann", "bob"]) db.addPlayer({ id, name: id, archived: false });
  const running = startStation({ id: 1, boardUrl: sim.url }, db, {
    reconnectDelayMs: 10,
    maxReconnectDelayMs: 20,
  });
  const app = buildApp({ db, stations: [running.station], adminPin, diagnosticsRefreshMs });
  await app.listen({ port: 0, host: "127.0.0.1" });
  closers.push(async () => {
    running.close();
    await app.close();
    db.close();
  });
  const base = `http://127.0.0.1:${app.addresses()[0]?.port}`;
  const station = async (): Promise<StationView> => (await app.inject("/api/stations/1")).json();
  await vi.waitFor(async () => expect((await station()).boardOnline).toBe(true));
  const command = (payload: object) =>
    app.inject({ method: "POST", url: "/api/stations/1/commands", payload });
  const diagnostics = async (headers: Record<string, string> = {}) =>
    (await fetch(`${base}/api/admin/diagnostics`, { headers })).json() as Promise<DiagnosticsView>;
  return { app, base, station, command, diagnostics };
}

/** Opens a stream and keeps it open until the test ends; `next()` reads the next view. */
async function open<T = unknown>(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers });
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  closers.unshift(() => reader.cancel().catch(() => {}));
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
  const first = await next();
  return { status: res.status, first, next, close: () => reader.cancel() };
}

const busy = (ms: number) => {
  const until = performance.now() + ms;
  while (performance.now() < until);
};

describe("diagnostics page", () => {
  it("is behind the admin PIN", async () => {
    const { app } = await setup("1234");
    expect((await app.inject("/api/admin/diagnostics")).statusCode).toBe(401);
    expect((await app.inject("/api/admin/diagnostics/live")).statusCode).toBe(401);
  });

  it("lists the open streams with their client and updates", async () => {
    const { base, command, diagnostics } = await setup();
    await open(`${base}/api/stations/1/live`, { "user-agent": "kiosk" });
    await open(`${base}/api/stations/1/live?view=watch`);
    await open(`${base}/api/display/live`, { "x-forwarded-for": "10.0.0.7, 10.0.0.1" });
    await command({ type: "quickMatch", playerIds: ["ann", "bob"] });

    const { streams } = await diagnostics();
    expect(streams.map((s) => [s.kind, s.label])).toEqual([
      ["station", "Station 1"],
      ["watch", "Station 1"],
      ["display", null],
    ]);
    expect(streams[0]?.userAgent).toBe("kiosk");
    expect(streams[2]?.client).toBe("10.0.0.7");
    // The first view, then the match being set up.
    await vi.waitFor(async () => expect((await diagnostics()).streams[0]?.updates).toBe(2));
  });

  it("times darts from the board's message to the station's streams", async () => {
    const { command, diagnostics } = await setup();
    await command({ type: "quickMatch", playerIds: ["ann", "bob"] });
    await command({ type: "startMatch" });
    const before = (await diagnostics()).darts.length;
    sim?.throwDart("T20");

    await vi.waitFor(async () => expect((await diagnostics()).darts.length).toBe(before + 1));
    const [dart] = (await diagnostics()).darts;
    expect(dart).toMatchObject({ station: 1, name: "T20" });
    expect(dart?.ms).toBeGreaterThanOrEqual(0);
    expect(dart?.ms).toBeLessThan(1000);
  });

  it("shows each board's connection and the last command's round trip", async () => {
    const { app, diagnostics } = await setup();
    await app.inject({ method: "POST", url: "/api/stations/1/board", payload: { action: "stop" } });

    const [board] = (await diagnostics()).boards;
    expect(board).toMatchObject({ station: 1, name: "Station 1", online: true, reconnects: 0 });
    expect(board?.lastCommand).toMatchObject({ name: "stop", ok: true });
    expect(board?.sinceMessageSeconds).not.toBeNull();
  });

  it("times a slow view", async () => {
    await setup();
    const stop = recorder.watch();
    closers.push(async () => stop());
    const listeners = new Set<() => void>();
    const app = Fastify();
    app.get("/slow", (request, reply) =>
      streamView(
        request,
        reply,
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => {
          busy(30);
          return { at: performance.now() };
        },
        { kind: "match detail", label: "slow" },
      ),
    );
    await app.listen({ port: 0, host: "127.0.0.1" });
    closers.push(() => app.close());
    await open(`http://127.0.0.1:${app.addresses()[0]?.port}/slow`);
    for (const listener of listeners) listener();

    const slow = recorder.view([]).views.find((v) => v.kind === "match detail");
    expect(slow?.perMinute).toBeGreaterThanOrEqual(2);
    expect(slow?.maxMs).toBeGreaterThanOrEqual(30);
  });

  it("pushes the page while it's open, with each viewer's own request", async () => {
    const { base } = await setup();
    const page = await open<DiagnosticsView>(`${base}/api/admin/diagnostics/live`, {
      via: "1.1 nginx",
    });
    expect(page.first.request.proxied).toBe(true);
    expect(page.first.boards[0]?.name).toBe("Station 1");
    const next = await page.next();
    expect(next.request.proxied).toBe(true);
    expect(next.streams.map((s) => s.kind)).toContain("diagnostics");
  });

  it("computes one view per tick however many pages are open, and stops when they close", async () => {
    const { base } = await setup(undefined, 100);
    const view = vi.spyOn(recorder, "view");
    const a = await open<DiagnosticsView>(`${base}/api/admin/diagnostics/live`);
    const b = await open<DiagnosticsView>(`${base}/api/admin/diagnostics/live`);
    expect(a.first.request.proxied).toBe(false);
    expect(b.first.request.proxied).toBe(false);
    // The first page computed one; the second got the same.
    expect(view).toHaveBeenCalledTimes(1);
    await a.next();
    await b.next();
    expect(view).toHaveBeenCalledTimes(2);

    // Closed: the costlier timings stop at once, with no grace period.
    await a.close();
    await b.close();
    await vi.waitFor(() =>
      expect(recorder.view([]).streams.map((s) => s.kind)).not.toContain("diagnostics"),
    );
    const probe = recorder.openStream("display", null, { ip: "", headers: {} });
    probe.computed(999);
    expect(recorder.view([]).views.find((v) => v.maxMs === 999)).toBeUndefined();
    probe.close();
    view.mockRestore();
  });

  it("says whether this request came through a proxy", async () => {
    const { diagnostics } = await setup();
    expect((await diagnostics()).request.proxied).toBe(false);

    const proxied = (await diagnostics({ via: "1.1 nginx", "x-forwarded-proto": "https" })).request;
    expect(proxied.proxied).toBe(true);
    expect(proxied.headers).toEqual({ via: "1.1 nginx", "x-forwarded-proto": "https" });
  });
});

describe("diagnostics recorder", () => {
  const request = { ip: "127.0.0.1", headers: {} };

  it("records view and write timings only while the page is open", () => {
    const d = createDiagnostics();
    const stream = d.openStream("display", null, request);
    stream.computed(5);
    d.timeWrite("append", () => busy(1));
    let view = d.view([]);
    expect(view.views).toEqual([]);
    expect(view.database.writesPerMinute).toBe(0);

    const stop = d.watch();
    stream.computed(5);
    stream.computed(15);
    d.timeWrite("append", () => busy(2));
    view = d.view([]);
    expect(view.views).toEqual([{ kind: "display", perMinute: 2, averageMs: 10, maxMs: 15 }]);
    expect(view.database.writesPerMinute).toBe(1);
    expect(view.database.slowestWrite).toBe("append");
    expect(view.database.slowestMs).toBeGreaterThanOrEqual(2);

    stop();
    stream.computed(40);
    expect(d.view([]).views[0]?.maxMs).toBe(15);
  });

  it("keeps collecting until the last of several pages closes", () => {
    const d = createDiagnostics();
    const stream = d.openStream("display", null, request);
    const first = d.watch();
    const second = d.watch();
    first();
    first();
    stream.computed(7);
    expect(d.view([]).views[0]?.maxMs).toBe(7);
    second();
    stream.computed(9);
    expect(d.view([]).views[0]?.maxMs).toBe(7);
  });

  it("sees a blocked event loop", async () => {
    const d = createDiagnostics();
    const stop = d.watch();
    await new Promise((resolve) => setTimeout(resolve, 50));
    busy(120);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const { eventLoop } = d.view([]);
    stop();
    expect(eventLoop.maxMs).toBeGreaterThan(100);
    expect(eventLoop.p50Ms).toBeLessThan(5);
  });

  it("keeps the last 20 darts, newest first", () => {
    const d = createDiagnostics();
    for (let i = 0; i < 25; i++) d.dart(1, `S${i}`, i);
    const { darts } = d.view([]);
    expect(darts).toHaveLength(20);
    expect(darts[0]?.name).toBe("S24");
  });

  it("forgets a stream when it closes", () => {
    const d = createDiagnostics();
    d.openStream("stations", null, request).close();
    expect(d.view([]).streams).toEqual([]);
  });
});

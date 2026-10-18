import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type BoardSim, createBoardSim } from "@n4/board-sim";
import type { MatchState } from "@n4/engine";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.ts";
import { openDb } from "./db.ts";
import type { StationCommand, StationView } from "./station.ts";
import { startStation } from "./stations.ts";

interface Server {
  app: ReturnType<typeof buildApp>;
  command(command: StationCommand): Promise<{ status: number; body: unknown }>;
  view(): Promise<StationView>;
  stop(): Promise<void>;
}

let sim: BoardSim;
let servers: Server[] = [];
afterEach(async () => {
  for (const server of servers) await server.stop();
  servers = [];
  await sim?.close();
});

const tempDb = () => join(mkdtempSync(join(tmpdir(), "n4-db-")), "test.db");

/** Server with station 1 on the simulator, as main.ts wires it; resolves once the board is online. */
async function startServer(dbPath: string): Promise<Server> {
  const db = openDb(dbPath);
  const running = startStation({ id: 1, boardUrl: sim.url }, db, {
    reconnectDelayMs: 10,
    maxReconnectDelayMs: 20,
  });
  const app = buildApp({ stations: [running.station] });
  let stopped = false;
  const server: Server = {
    app,
    async command(command: StationCommand) {
      const res = await app.inject({
        method: "POST",
        url: "/api/stations/1/commands",
        payload: command,
      });
      return { status: res.statusCode, body: res.json() };
    },
    async view() {
      return (await app.inject("/api/stations/1")).json();
    },
    async stop() {
      if (stopped) return;
      stopped = true;
      running.close();
      await app.close();
      db.close();
    },
  };
  servers.push(server);
  await vi.waitFor(async () => expect((await server.view()).boardOnline).toBe(true));
  return server;
}

const state = async (server: Server) => (await server.view()).match?.state as MatchState;

/** Throws a dart on the board and waits until the match has recorded it. */
async function throwDart(server: Server, name: string) {
  const before = (await state(server)).currentVisit?.darts.length ?? 0;
  sim.throwDart(name);
  await vi.waitFor(async () =>
    expect((await state(server)).currentVisit?.darts.length).toBe(before + 1),
  );
}

async function takeout(server: Server) {
  const visits = (await state(server)).legs.flatMap((l) => l.visits).length;
  sim.takeout();
  await vi.waitFor(async () =>
    expect((await state(server)).legs.flatMap((l) => l.visits).length).toBe(visits + 1),
  );
}

/** What a finished match looks like, without random dart ids. */
const summary = (s: MatchState) => ({
  phase: s.phase,
  winner: s.winner,
  remaining: s.players.map((p) => p.remaining),
  visits: s.legs.flatMap((l) => l.visits.map((v) => [v.player, ...v.darts.map((d) => d.score)])),
});

const start: StationCommand = {
  type: "startMatch",
  players: ["Ann", "Bob"],
  settings: { startScore: 101 },
};

/** Ann 66 (one dart corrected), Bob 60, Ann checks out 35. Optionally restarts the server mid-visit. */
async function playMatch(restart: boolean) {
  sim = await createBoardSim();
  const dbPath = tempDb();
  let server = await startServer(dbPath);
  expect((await server.command(start)).status).toBe(200);

  await throwDart(server, "T20");
  await throwDart(server, "S1");
  await throwDart(server, "S1");
  const misdetected = (await state(server)).currentVisit?.darts[1]?.dartId as string;
  await server.command({
    type: "correctDart",
    dartId: misdetected,
    segment: { number: 5, multiplier: 1 },
  });
  await takeout(server);

  for (const _ of [1, 2, 3]) await throwDart(server, "S20");
  await takeout(server);

  await throwDart(server, "S20");
  if (restart) {
    await server.stop();
    sim.throwDart("S10"); // thrown while the server is down
    server = await startServer(dbPath);
    await vi.waitFor(async () => expect((await state(server)).currentVisit?.darts).toHaveLength(2));
  } else {
    await throwDart(server, "S10");
  }
  await throwDart(server, "S5");
  await takeout(server);

  return summary(await state(server));
}

describe("playing a match at a station", () => {
  it("plays a full leg from the board, with a correction from the station", async () => {
    expect(await playMatch(false)).toEqual({
      phase: "matchWon",
      winner: 0,
      remaining: [0, 41],
      visits: [
        [0, 60, 5, 1],
        [1, 20, 20, 20],
        [0, 20, 10, 5],
      ],
    });
  });

  it("ends up in the same state when the server restarts mid-visit", async () => {
    const restarted = await playMatch(true);
    await sim.close();
    expect(restarted).toEqual(await playMatch(false));
  });

  it("notices a takeout and a new visit that happened while the server was down", async () => {
    sim = await createBoardSim();
    const dbPath = tempDb();
    const first = await startServer(dbPath);
    await first.command(start);
    await throwDart(first, "S20");
    await first.stop();

    sim.takeout();
    sim.throwDart("T20"); // Bob, as many darts as Ann had logged
    const second = await startServer(dbPath);

    await vi.waitFor(async () => {
      const s = await state(second);
      expect(s.currentVisit).toMatchObject({ player: 1, darts: [{ score: 60 }] });
      expect(s.players.map((p) => p.remaining)).toEqual([81, 41]);
    });
  });

  it("ignores darts while no match is running", async () => {
    sim = await createBoardSim();
    const server = await startServer(tempDb());

    sim.throwDart("T20");
    await server.command(start);
    await throwDart(server, "S1");

    expect((await state(server)).currentVisit?.darts.map((d) => d.score)).toEqual([1]);
  });

  it("applies the board's own revision of a dart", async () => {
    sim = await createBoardSim();
    const server = await startServer(tempDb());
    await server.command(start);
    await throwDart(server, "S1");

    sim.reviseDart(0, "T20");

    await vi.waitFor(async () => expect((await state(server)).players[0]?.remaining).toBe(41));
  });

  it("passes the turn on 'next player' and clears the board", async () => {
    sim = await createBoardSim();
    const server = await startServer(tempDb());
    await server.command(start);
    await throwDart(server, "S20");

    await server.command({ type: "nextPlayer" });
    await throwDart(server, "T20");

    const s = await state(server);
    expect(s.currentPlayer).toBe(1);
    expect(s.players.map((p) => p.remaining)).toEqual([81, 41]);
  });

  it("refuses a second match until the first is closed", async () => {
    sim = await createBoardSim();
    const server = await startServer(tempDb());
    await server.command(start);

    expect((await server.command(start)).status).toBe(409);
    await server.command({ type: "closeMatch" });
    expect((await server.command(start)).status).toBe(200);
  });

  it("pushes every change to live viewers", async () => {
    sim = await createBoardSim();
    const server = await startServer(tempDb());
    await server.app.listen({ port: 0, host: "127.0.0.1" });
    const address = server.app.addresses()[0];
    const res = await fetch(`http://127.0.0.1:${address?.port}/api/stations/1/live`);
    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    const next = async (): Promise<StationView> => {
      const { value } = await reader.read();
      return JSON.parse(decoder.decode(value).replace(/^data: /, ""));
    };

    expect((await next()).match).toBeNull();
    await server.command(start);
    expect((await next()).match?.players).toEqual(["Ann", "Bob"]);
    sim.throwDart("T20");
    expect((await next()).match?.state.players[0]?.remaining).toBe(41);
    await reader.cancel();
  });
});

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type BoardSim, createBoardSim } from "@n4/board-sim";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DisplayView, StationView, TournamentAdminView } from "../../api.ts";
import { buildApp } from "../../app.ts";
import { openDb } from "../../db.ts";
import { startStation } from "../../stations/stations.ts";

let sims: BoardSim[] = [];
let stopServer: (() => Promise<void>) | undefined;
afterEach(async () => {
  await stopServer?.();
  stopServer = undefined;
  for (const sim of sims) await sim.close();
  sims = [];
});

/** The server as main.ts wires it, with two stations on the simulators and the scheduler on. */
async function startServer(dbPath: string) {
  const db = openDb(dbPath);
  const running = sims.map((sim, i) =>
    startStation({ id: i + 1, boardUrl: sim.url }, db, {
      reconnectDelayMs: 10,
      maxReconnectDelayMs: 20,
    }),
  );
  const app = buildApp({
    db,
    stations: running.map((r) => r.station),
    scheduler: { tickMs: 50 },
  });
  const stop = async () => {
    for (const r of running) r.close();
    await app.close();
    db.close();
  };
  stopServer = stop;
  const station = async (id: number): Promise<StationView> =>
    (await app.inject(`/api/stations/${id}`)).json();
  const command = (id: number, type: string) =>
    app.inject({ method: "POST", url: `/api/stations/${id}/commands`, payload: { type } });
  await vi.waitFor(async () => {
    for (const id of [1, 2]) expect((await station(id)).boardOnline).toBe(true);
  });
  return { app, db, station, command, stop };
}

describe("a tournament plays itself", () => {
  it("runs 4 players from groups to a champion on two boards, through a server restart", {
    timeout: 30_000,
  }, async () => {
    sims = [await createBoardSim(), await createBoardSim()];
    const dbPath = join(mkdtempSync(join(tmpdir(), "n4-db-")), "t.db");
    let server = await startServer(dbPath);
    for (const name of ["Ann", "Bob", "Cid", "Dee"]) {
      server.db.addPlayer({ id: name.toLowerCase(), name, archived: false });
    }
    const created = await server.app.inject({
      method: "POST",
      url: "/api/admin/tournament",
      payload: {
        playerIds: ["ann", "bob", "cid", "dee"],
        config: {
          format: { elimination: "single" },
          legs: { groups: 1, winners: 1, losers: 1, final: 1 },
          x01: { startScore: 40 },
        },
      },
    });
    expect(created.statusCode).toBe(201);
    await server.app.inject({ method: "POST", url: "/api/admin/tournament/start" });

    let played = 0;
    let restarted = false;
    const usedStations = new Set<number>();
    for (let guard = 0; guard < 300; guard++) {
      const view = (await server.app.inject("/api/admin/tournament")).json() as TournamentAdminView;
      if (!view.tournament) break;
      for (const id of [1, 2]) {
        const match = (await server.station(id)).match;
        if (!match) continue;
        usedStations.add(id);
        const sim = sims[id - 1] as BoardSim;
        if (match.state.phase === "notStarted") {
          await server.command(id, "startMatch");
        } else if (match.state.phase === "throwing") {
          sim.throwDart("D20");
          await vi.waitFor(async () =>
            expect((await server.station(id)).match?.state.phase).toBe("matchWon"),
          );
          sim.takeout();
          await vi.waitFor(async () =>
            expect((await server.station(id)).match?.state.currentVisit).toBeNull(),
          );
          await server.command(id, "closeMatch");
          played += 1;
        }
      }
      if (played >= 3 && !restarted) {
        restarted = true;
        await server.stop();
        server = await startServer(dbPath);
      }
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    expect(restarted).toBe(true);
    expect(usedStations).toEqual(new Set([1, 2]));
    // 6 group matches, 2 semi-finals, the final.
    expect(played).toBe(9);
    const finished = server.db.tournaments()[0];
    expect(finished?.status).toBe("finished");
    expect(finished?.placings?.map((p) => [p.from, p.to])).toEqual([
      [1, 1],
      [2, 2],
      [3, 4],
      [3, 4],
    ]);

    // The awards reach /admin and the projector (from Stats, not the tournament).
    const admin = (await server.app.inject("/api/admin/tournament")).json() as TournamentAdminView;
    const kinds = admin.progress?.awards?.map((a) => a.kind);
    expect(kinds).toEqual(["bestAverage", "highestCheckout", "bestLeg"]);
    const display = (await server.app.inject("/api/display")).json() as DisplayView;
    expect(display.awards).toEqual(admin.progress?.awards);
  });
});

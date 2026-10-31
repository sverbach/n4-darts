import { afterEach, describe, expect, it } from "vitest";
import type { DisplayView, TournamentAdminView } from "../../api.ts";
import { buildApp } from "../../app.ts";
import { type Db, openDb } from "../../db.ts";
import { upNextLabel } from "../../live/display.ts";
import { PAUSED } from "../../scheduling/scheduler.ts";
import { createStation, type Station } from "../../stations/station.ts";

let db: Db;
let app: ReturnType<typeof buildApp> | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
  db?.close();
});

/** Lets the scheduler react (it runs on the next turn of the event loop). */
const settle = async () => {
  for (let i = 0; i < 3; i++) await new Promise((resolve) => setImmediate(resolve));
};

async function setup(players = 5) {
  db = openDb(":memory:");
  const ids = Array.from({ length: players }, (_, i) => `p${i + 1}`);
  for (const id of ids) db.addPlayer({ id, name: id.toUpperCase(), archived: false });
  const board = { reset: async () => {} };
  const stations = [1, 2].map((id) => createStation({ id, db, board }));
  app = buildApp({ db, stations, scheduler: { tickMs: 1_000_000 } });
  const call = async (url: string, payload?: object) => {
    const res = await (app as ReturnType<typeof buildApp>).inject({
      method: payload === undefined && !url.includes("/tournament/") ? "GET" : "POST",
      url,
      ...(payload ? { payload } : {}),
    });
    await settle();
    return { status: res.statusCode, body: res.json() as TournamentAdminView & { error?: string } };
  };
  await call("/api/admin/tournament", {
    playerIds: ids,
    config: {
      format: { elimination: "single" },
      legs: { groups: 1, winners: 1, losers: 1, final: 1 },
      x01: { startScore: 40 },
    },
  });
  await call("/api/admin/tournament/start");
  const view = async () => (await call("/api/admin/tournament")).body;
  return { stations: stations as [Station, Station], call, view };
}

const onStation = (station: Station) => station.view().match?.id;

describe("organiser overrides", () => {
  it("shows progress, stations, the queue and group tables", async () => {
    const { view } = await setup();
    const progress = (await view()).progress;
    expect(progress).toMatchObject({ phase: "groups", played: 0, total: 10, placings: null });
    expect(progress?.stations.every((s) => s.match !== null)).toBe(true);
    expect(progress?.queue).toHaveLength(8);
    expect(progress?.groups[0]?.table).toHaveLength(5);
    expect(progress?.groups[0]?.fixtures.filter((f) => f.status === "on-station")).toHaveLength(2);
    expect(Date.parse(progress?.expectedEnd ?? "")).toBeGreaterThan(Date.now());

    // The projector's "Up next" is the head of the same queue.
    const display = (await (app as ReturnType<typeof buildApp>).inject("/api/display")).json();
    expect((display as DisplayView).upNext.map((m) => m.label)).toEqual(
      progress?.queue.slice(0, 5).map((q) => upNextLabel(q.label)),
    );
  });

  it("pauses a station: its current match carries on, nothing new comes", async () => {
    const { stations, call } = await setup();
    const current = onStation(stations[1]);
    await call("/api/admin/tournament/stations/2/pause", { paused: true });
    expect(onStation(stations[1])).toBe(current);

    await stations[1].command({ type: "abandonMatch" }); // not started: back to the queue
    await settle();
    expect(stations[1].view()).toMatchObject({ match: null, notice: PAUSED });

    await call("/api/admin/tournament/stations/2/pause", { paused: false });
    expect(onStation(stations[1])).toBeDefined();
  });

  it("holds a match: off its station, skipped until released", async () => {
    const { stations, call, view } = await setup();
    const held = onStation(stations[0]) as string;
    await call(`/api/admin/tournament/matches/${held}/hold`, { held: true });

    expect(onStation(stations[0])).not.toBe(held);
    expect((await view()).progress?.queue.find((q) => q.matchId === held)).toMatchObject({
      held: true,
      ready: false,
    });

    await call(`/api/admin/tournament/matches/${held}/hold`, { held: false });
    expect((await view()).progress?.queue.find((q) => q.matchId === held)?.held).toBe(false);
  });

  it("sends a waiting match back: the station gets another one", async () => {
    const { stations, call, view } = await setup();
    const sent = onStation(stations[0]) as string;
    const res = await call(`/api/admin/tournament/matches/${sent}/send-back`, {});

    expect(res.status).toBe(200);
    expect(onStation(stations[0])).not.toBe(sent);
    expect((await view()).progress?.queue.some((q) => q.matchId === sent)).toBe(true);
  });

  it("refuses to send back a match that has started", async () => {
    const { stations, call } = await setup();
    await stations[0].command({ type: "startMatch" });
    const res = await call(`/api/admin/tournament/matches/${onStation(stations[0])}/send-back`, {});
    expect(res.status).toBe(409);
  });

  /** A queued match that can go on station 1: none of its players are on station 2. */
  async function fitsStationOne(
    stations: [Station, Station],
    view: () => Promise<TournamentAdminView>,
  ) {
    const onTwo = new Set(stations[1].view().match?.players.map((p) => p.id));
    const entry = (await view()).progress?.queue.find((q) =>
      q.players.every((p) => !onTwo.has(p.id)),
    );
    expect(entry).toBeDefined();
    return entry?.matchId as string;
  }

  it("plays a chosen match now, sending the waiting one back", async () => {
    const { stations, call, view } = await setup();
    const waiting = onStation(stations[0]);
    const chosen = await fitsStationOne(stations, view);

    const res = await call(`/api/admin/tournament/matches/${chosen}/play-now`, { station: 1 });
    expect(res.status, res.body.error).toBe(200);
    expect(onStation(stations[0])).toBe(chosen);
    expect((await view()).progress?.queue.some((q) => q.matchId === waiting)).toBe(true);
  });

  it("pins a match to a station", async () => {
    const { stations, call, view } = await setup();
    const target = await fitsStationOne(stations, view);
    await call(`/api/admin/tournament/matches/${target}/pin`, { station: 1 });
    await call(`/api/admin/tournament/matches/${onStation(stations[0])}/send-back`, {});

    expect(onStation(stations[0])).toBe(target);
  });

  it("ends the tournament early: open matches abandoned, nothing more scheduled", async () => {
    const { stations, call, view } = await setup();
    await stations[0].command({ type: "startMatch" });
    await call("/api/admin/tournament/end", {});
    await settle();

    const ended = await view();
    expect(ended.tournament?.status).toBe("finished");
    expect(ended.progress?.endedEarly).toBe(true);
    expect(stations.map((s) => s.view().match)).toEqual([null, null]);
    const tournamentId = ended.tournament?.id as string;
    expect(db.tournamentMatches(tournamentId).every((m) => m.closedAt !== null)).toBe(true);
  });
});

import type { Segment } from "@n4/engine";
import { afterEach, describe, expect, it } from "vitest";
import type {
  LeaderboardRow,
  MatchDetail,
  MatchSummary,
  PlayerProfile,
  StationView,
} from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";
import { createStation, type Station } from "../stations/station.ts";

let db: Db;
afterEach(() => db?.close());

function seg(name: string): Segment {
  if (name === "M") return { number: 0, multiplier: 0 };
  if (name === "25") return { number: 25, multiplier: 1 };
  if (name === "BULL") return { number: 25, multiplier: 2 };
  const multiplier = ({ S: 1, D: 2, T: 3 } as const)[name[0] as "S" | "D" | "T"];
  return { number: Number(name.slice(1)), multiplier };
}

function setup() {
  db = openDb(":memory:");
  for (const name of ["Ann", "Bob"]) {
    db.addPlayer({ id: name.toLowerCase(), name, archived: false });
  }
  const stations = [1].map((id) => createStation({ id, db, board: { reset: async () => {} } }));
  const app = buildApp({ db, stations });
  const station = stations[0] as Station;
  const play = (darts: string) => {
    let index = 0;
    for (const dart of darts.split(" ")) {
      if (dart === "/") {
        station.handleBoardEvent({ type: "TakeoutFinished" });
        index = 0;
        continue;
      }
      station.handleBoardEvent({
        type: "DartDetected",
        index: index++,
        segment: seg(dart),
        name: dart,
        coords: { x: 0.1, y: 0.1 },
        bouncer: false,
      });
    }
  };
  const command = (payload: object) =>
    app.inject({ method: "POST", url: "/api/stations/1/commands", payload });
  const view = async (): Promise<StationView> => (await app.inject("/api/stations/1")).json();
  const get = async <T>(url: string) => (await app.inject(url)).json() as T;
  return { app, play, command, view, get };
}
const AROUND = [
  "S1 S2 S3",
  "S4 S5 S6",
  "S7 S8 S9",
  "S10 S11 S12",
  "S13 S14 S15",
  "S16 S17 S18",
  "S19 S20 25",
];

async function playAroundTheClock(ctx: ReturnType<typeof setup>) {
  await ctx.command({
    type: "quickMatch",
    playerIds: ["ann", "bob"],
    settings: { mode: "aroundTheClock" },
  });
  await ctx.command({ type: "startMatch" });
  AROUND.forEach((visit, i) => {
    ctx.play(`${visit} /`);
    if (i < AROUND.length - 1) ctx.play("M M M /");
  });
  const id = (await ctx.view()).match?.id as string;
  await ctx.command({ type: "closeMatch" });
  return id;
}

describe("setting up a party match", () => {
  it("starts Around the Clock from the station's quick match", async () => {
    const ctx = setup();

    const res = await ctx.command({
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings: { mode: "aroundTheClock" },
    });
    expect(res.statusCode).toBe(200);
    await ctx.command({ type: "startMatch" });

    const match = (await ctx.view()).match;
    expect(match?.settings).toEqual({ mode: "aroundTheClock", rulesVersion: 1 });
    expect(match?.state).toMatchObject({ mode: "aroundTheClock", phase: "throwing" });
  });

  it("starts Around the Clock from /admin", async () => {
    const ctx = setup();

    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/matches",
      payload: { station: 1, playerIds: ["ann", "bob"], settings: { mode: "aroundTheClock" } },
    });

    expect(res.statusCode).toBe(201);
    expect((await ctx.view()).match?.settings.mode).toBe("aroundTheClock");
  });

  it("keeps X01 when no mode is given", async () => {
    const ctx = setup();
    await ctx.command({
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings: { startScore: 501 },
    });

    expect((await ctx.view()).match?.settings).toMatchObject({ mode: "x01", startScore: 501 });
  });

  it("starts High Score with its rounds", async () => {
    const ctx = setup();
    await ctx.command({
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings: { mode: "highScore", rounds: 3 },
    });

    expect((await ctx.view()).match?.settings).toEqual({
      mode: "highScore",
      rounds: 3,
      rulesVersion: 1,
    });
  });

  it("starts Golf with its holes", async () => {
    const ctx = setup();
    await ctx.command({
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings: { mode: "golf", holes: 18 },
    });

    expect((await ctx.view()).match?.settings).toEqual({
      mode: "golf",
      holes: 18,
      rulesVersion: 1,
    });
  });

  it("starts Killer with its lives and a distinct number drawn per player", async () => {
    const ctx = setup();
    await ctx.command({
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings: { mode: "killer", lives: 5 },
    });
    await ctx.command({ type: "startMatch" });

    const match = (await ctx.view()).match;
    expect(match?.settings).toEqual({ mode: "killer", lives: 5, rulesVersion: 1 });
    const started = db.events(match?.id as string).find((e) => e.type === "MatchStarted");
    const numbers = started?.type === "MatchStarted" ? started.numbers : undefined;
    expect(numbers).toHaveLength(2);
    expect(new Set(numbers).size).toBe(2);
    expect(match?.state.mode === "killer" && match.state.players.map((p) => p.number)).toEqual(
      numbers,
    );
  });

  it("starts Cricket in cut-throat", async () => {
    const ctx = setup();
    await ctx.command({
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings: { mode: "cricket", variant: "cutThroat" },
    });

    expect((await ctx.view()).match?.settings).toEqual({
      mode: "cricket",
      variant: "cutThroat",
      rulesVersion: 1,
    });
  });

  it.each([
    ["an unknown mode", { mode: "baseball" }],
    ["an unknown cricket variant", { mode: "cricket", variant: "mickeyMouse" }],
    ["no lives", { mode: "killer", lives: 0 }],
    ["more than 9 lives", { mode: "killer", lives: 10 }],
    ["a golf course that isn't 9 or 18 holes", { mode: "golf", holes: 12 }],
    ["no rounds", { mode: "highScore", rounds: 0 }],
    ["more than 20 rounds", { mode: "highScore", rounds: 21 }],
    ["X01 options on a party mode", { mode: "aroundTheClock", startScore: 501 }],
  ])("refuses %s", async (_, settings) => {
    const ctx = setup();

    const res = await ctx.command({ type: "quickMatch", playerIds: ["ann", "bob"], settings });

    expect(res.statusCode).toBe(400);
    expect((await ctx.view()).match).toBeNull();
  });
});

describe("a finished party match", () => {
  it("has a winner and closes like any match", async () => {
    const ctx = setup();
    const id = await playAroundTheClock(ctx);

    expect(db.getMatch(id)).toMatchObject({ winner: "ann", closedAt: expect.any(String) });
    expect((await ctx.view()).match).toBeNull();
  });

  it("counts in no stats and shows up in no list", async () => {
    const ctx = setup();
    const id = await playAroundTheClock(ctx);

    expect(await ctx.get<MatchSummary[]>("/api/admin/matches")).toEqual([]);
    expect((await ctx.app.inject(`/api/matches/${id}`)).statusCode).toBe(404);
    expect(await ctx.get<LeaderboardRow[]>("/api/players/stats")).toEqual([]);
    const profile = await ctx.get<PlayerProfile>("/api/players/ann/stats");
    expect(profile.totals.matches).toBe(0);
    expect(profile.recent).toEqual([]);
    expect(profile.heatmap).toEqual([]);
  });
});

describe("a High Score 180", () => {
  it("counts in no stats", async () => {
    const ctx = setup();
    await ctx.command({
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings: { mode: "highScore", rounds: 1 },
    });
    await ctx.command({ type: "startMatch" });
    ctx.play("T20 T20 T20 /");
    ctx.play("S1 S1 S1 /");
    expect((await ctx.view()).match?.state.winner).toBe(0);
    await ctx.command({ type: "closeMatch" });

    expect(await ctx.get<LeaderboardRow[]>("/api/players/stats")).toEqual([]);
    expect((await ctx.get<PlayerProfile>("/api/players/ann/stats")).totals.s180).toBe(0);
  });
});

describe("a live party match in /admin", () => {
  it("shows its visits and takes a correction", async () => {
    const ctx = setup();
    await ctx.command({
      type: "quickMatch",
      playerIds: ["ann", "bob"],
      settings: { mode: "aroundTheClock" },
    });
    await ctx.command({ type: "startMatch" });
    ctx.play("S1 S5 /");
    const id = (await ctx.view()).match?.id as string;

    const detail = await ctx.get<MatchDetail>(`/api/admin/matches/${id}`);
    expect(detail.state.mode).toBe("aroundTheClock");
    const missed = detail.state.mode === "aroundTheClock" ? detail.state.visits[0]?.darts[1] : null;

    await ctx.app.inject({
      method: "POST",
      url: `/api/admin/matches/${id}/corrections`,
      payload: { dartId: missed?.dartId, segment: { number: 2, multiplier: 1 } },
    });

    const state = (await ctx.view()).match?.state;
    expect(state?.mode === "aroundTheClock" && state.players[0]?.target).toBe(3);
  });
});

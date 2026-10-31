import { matchState, type Segment } from "@n4/engine";
import { afterEach, describe, expect, it } from "vitest";
import type { TournamentAdminView } from "../../api.ts";
import { buildApp } from "../../app.ts";
import { type Db, type MatchRecord, openDb } from "../../db.ts";

let db: Db;
afterEach(() => db?.close());

const D20: Segment = { number: 20, multiplier: 2 };
const S20: Segment = { number: 20, multiplier: 1 };

/** p1…pN seeded in order; 40 straight out, best of 1; no stations, so nothing gets played by itself. */
async function setup(players: number) {
  db = openDb(":memory:");
  const ids = Array.from({ length: players }, (_, i) => `p${i + 1}`);
  for (const id of ids) db.addPlayer({ id, name: id.toUpperCase(), archived: false });
  const app = buildApp({ db });
  const call = async (method: "GET" | "POST" | "PATCH", url: string, payload?: object) => {
    const res = await app.inject({ method, url, ...(payload ? { payload } : {}) });
    return { status: res.statusCode, body: res.json() as TournamentAdminView & { error?: string } };
  };
  await call("POST", "/api/admin/tournament", {
    playerIds: ids,
    config: {
      format: { elimination: "single" },
      legs: { groups: 1, winners: 1, losers: 1, final: 1 },
      x01: { startScore: 40 },
    },
  });
  await call("PATCH", "/api/admin/tournament", { seedOrder: ids });
  await call("POST", "/api/admin/tournament/start");
  const tournamentId = (await call("GET", "/api/admin/tournament")).body.tournament?.id as string;
  /** The open match between these two players. */
  const between = (a: string, b: string) =>
    db
      .tournamentMatches(tournamentId)
      .find(
        (m) => !m.closedAt && m.playerIds.includes(a) && m.playerIds.includes(b),
      ) as MatchRecord;
  /** Records each visit (one dart, then takeout) in order, closes the match, syncs. */
  const play = async (match: MatchRecord, visits: Segment[]) => {
    db.append(match.id, { type: "MatchStarted", playerCount: 2 });
    visits.forEach((segment, i) => {
      db.append(match.id, { type: "DartThrown", dartId: `${match.id}-${i}`, segment });
      db.append(match.id, { type: "TakeoutFinished" });
    });
    const winner = matchState(match.settings, db.events(match.id)).winner;
    db.setWinner(match.id, winner === null ? null : (match.playerIds[winner] ?? null));
    db.closeMatch(match.id);
    await call("GET", "/api/admin/tournament"); // syncs
  };
  /**
   * `winner` beats `loser`. Normally the winner throws first and checks out. On a comeback the
   * loser throws first and leaves 20 (dart 0), then the winner checks out; correcting dart 0 to
   * D20 then flips the result.
   */
  const win = async (winner: string, loser: string, comeback = false) => {
    const match = between(winner, loser);
    const order = comeback ? [loser, winner] : [winner, loser];
    db.setOrder(match.id, order);
    const ordered = { ...match, playerIds: order };
    await play(ordered, comeback ? [S20, D20] : [D20]);
    return ordered;
  };
  const correct = (match: MatchRecord, dart: number, segment: Segment) =>
    call("POST", `/api/admin/matches/${match.id}/corrections`, {
      dartId: `${match.id}-${dart}`,
      segment,
    });
  const knockout = () =>
    db
      .tournamentMatches(tournamentId)
      .filter((m) => m.slot?.startsWith("w") && !m.closedAt)
      .map((m) => [m.slot, [...m.playerIds].sort()]);
  return { call, between, win, correct, knockout, tournamentId };
}

/** The 4-player group ends p1, p2, p3, p4 — p3 beat p4 on a comeback (the decider). */
async function groupWithComeback(t: Awaited<ReturnType<typeof setup>>) {
  await t.win("p1", "p2");
  await t.win("p1", "p3");
  await t.win("p1", "p4");
  await t.win("p2", "p3");
  await t.win("p2", "p4");
  return t.win("p3", "p4", true);
}

describe("corrections that change tournament results", () => {
  it("refuses a correction that leaves a finished match without a winner", async () => {
    const t = await setup(3);
    const match = await t.win("p1", "p2");

    const res = await t.correct(match, 0, S20);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/without a winner/);
  });

  it("recomputes the group table", async () => {
    const t = await setup(3);
    const match = await t.win("p1", "p2", true);

    const res = await t.correct(match, 0, D20);
    expect(res.status).toBe(200);
    expect(db.getMatch(match.id)?.winner).toBe("p2");
    const table = (await t.call("GET", "/api/admin/tournament")).body.progress?.groups[0]?.table;
    expect(table?.find((r) => r.playerId === "p1")?.points).toBe(0);
    expect(table?.find((r) => r.playerId === "p2")?.points).toBe(2);
  });

  it("rebuilds the knockout while none of it has started", async () => {
    const t = await setup(4);
    const decider = await groupWithComeback(t);
    expect(t.knockout()).toEqual([
      ["w1.0", ["p1", "p4"]],
      ["w1.1", ["p2", "p3"]],
    ]);

    const res = await t.correct(decider, 0, D20); // now p4 beat p3
    expect(res.status, res.body.error).toBe(200);
    expect(t.knockout()).toEqual([
      ["w1.0", ["p1", "p3"]],
      ["w1.1", ["p2", "p4"]],
    ]);
  });

  it("refuses, naming the match, once a knockout match it would change has started", async () => {
    const t = await setup(4);
    const decider = await groupWithComeback(t);
    db.append(t.between("p1", "p4").id, { type: "MatchStarted", playerCount: 2 });

    const res = await t.correct(decider, 0, D20);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe(
      "It would change Semi-final 1 (P1 vs P4), which has already started.",
    );
  });

  it("updates the next match when a knockout winner changes before it starts", async () => {
    const t = await setup(4);
    await groupWithComeback(t);
    const semi1 = await t.win("p1", "p4", true);
    await t.win("p2", "p3");
    expect(t.knockout()).toEqual([["w2.0", ["p1", "p2"]]]);

    const res = await t.correct(semi1, 0, D20); // now p4 won the semi-final
    expect(res.status, res.body.error).toBe(200);
    expect(t.knockout()).toEqual([["w2.0", ["p2", "p4"]]]);
  });

  it("always accepts a correction that keeps the winner", async () => {
    const t = await setup(4);
    const decider = await groupWithComeback(t);
    db.append(t.between("p1", "p4").id, { type: "MatchStarted", playerCount: 2 });

    // p4's opening single becomes a 19: p3 still won, same legs.
    const res = await t.correct(decider, 0, { number: 19, multiplier: 1 });
    expect(res.status, res.body.error).toBe(200);
  });

  it("can't change who won once the tournament is over", async () => {
    const t = await setup(3);
    await t.win("p1", "p2");
    await t.win("p1", "p3");
    await t.win("p2", "p3");
    await t.win("p2", "p3"); // semi-final (3 advance: p1 has a bye)
    const final = await t.win("p1", "p2", true);
    expect((await t.call("GET", "/api/admin/tournament")).body.tournament?.status).toBe("finished");

    const res = await t.correct(final, 0, D20);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/tournament is over/);
  });
});

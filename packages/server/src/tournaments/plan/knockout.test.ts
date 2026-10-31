import { describe, expect, it } from "vitest";
import type { TableRow } from "./groups.ts";
import {
  type Advancer,
  bracketOrder,
  type Knockout,
  knockout,
  placingsFromStages,
  seedAdvancers,
} from "./knockout.ts";
import type { Elimination, Result } from "./types.ts";

const advancers = (n: number, groups = 1): Advancer[] =>
  Array.from({ length: n }, (_, i) => ({
    playerId: `s${i + 1}`,
    group: i % groups,
    rank: Math.floor(i / groups),
  }));

const result = (slot: string, a: string, b: string, winner: string): Result => ({
  slot,
  players: [a, b],
  winner,
  legs: winner === a ? [1, 0] : [0, 1],
  walkover: false,
  stats: [
    { points: 0, darts: 0 },
    { points: 0, darts: 0 },
  ],
});

const names = (k: Knockout, slot: string) =>
  k.matches
    .find((m) => m.slot === slot)
    ?.players.map((p) => (p.kind === "player" ? p.playerId : p.kind));

/** Plays the bracket to the end; `pick` chooses each winner. Returns the final state. */
function playOut(
  seeds: Advancer[],
  elimination: Elimination,
  bracketReset: boolean,
  pick: (slot: string, a: string, b: string) => string,
) {
  const results = new Map<string, Result>();
  for (let guard = 0; guard < 200; guard++) {
    const state = knockout(seeds, elimination, bracketReset, results);
    if (state.champion) return { state, results };
    const ready = state.matches.find(
      (m) => !results.has(m.slot) && m.players.every((p) => p.kind === "player"),
    );
    if (!ready) throw new Error("stuck without a champion");
    const [a, b] = ready.players.map((p) => (p.kind === "player" ? p.playerId : "")) as [
      string,
      string,
    ];
    results.set(ready.slot, result(ready.slot, a, b, pick(ready.slot, a, b)));
  }
  throw new Error("never finished");
}

const seedNo = (id: string) => Number(id.slice(1));
const higherSeedWins = (_: string, a: string, b: string) => (seedNo(a) < seedNo(b) ? a : b);

describe("seeding advancers", () => {
  const row = (playerId: string, points: number, legDiff = 0): TableRow => ({
    playerId,
    played: 3,
    won: points / 2,
    lost: 0,
    legsFor: 0,
    legsAgainst: 0,
    legDiff,
    points,
    average: null,
  });

  it("puts all group winners first, then runners-up, each by points", () => {
    const tables = [
      [row("a1", 4), row("a2", 2), row("a3", 0)],
      [row("b1", 6), row("b2", 4), row("b3", 0)],
    ];
    expect(seedAdvancers(tables, 2).map((s) => s.playerId)).toEqual(["b1", "a1", "b2", "a2"]);
  });

  it("takes everyone, in table order, from a single group", () => {
    const tables = [[row("x", 6), row("y", 4), row("z", 0)]];
    expect(seedAdvancers(tables, null).map((s) => s.playerId)).toEqual(["x", "y", "z"]);
  });
});

describe("single elimination", () => {
  it("uses the usual bracket positions", () => {
    expect(bracketOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it.each([2, 3, 5, 6, 7, 8, 9, 12, 16])("plays %i advancers down to the top seed", (n) => {
    const { state } = playOut(advancers(n), "single", false, higherSeedWins);
    expect(state.champion).toBe("s1");
    expect(state.placings?.[0]).toEqual({ playerId: "s1", from: 1, to: 1 });
    expect(state.placings).toHaveLength(n);
  });

  it("gives byes to the top seeds", () => {
    const k = knockout(advancers(6), "single", false, new Map());
    expect(names(k, "w1.0")).toEqual(["s1", "bye"]);
    expect(names(k, "w1.2")).toEqual(["s2", "bye"]);
    expect(names(k, "w1.1")).toEqual(["s4", "s5"]);
    // s1 advances without playing; s4 v s5 decides the other side.
    expect(names(k, "w2.0")).toEqual(["s1", "pending"]);
  });

  it("labels rounds and uses the final's legs only for the final", () => {
    const k = knockout(advancers(8), "single", false, new Map());
    expect(k.matches.map((m) => [m.slot, m.label, m.phase])).toContainEqual([
      "w3.0",
      "Final",
      "final",
    ]);
    expect(k.matches.find((m) => m.slot === "w2.1")).toMatchObject({
      label: "Semi-final 2",
      phase: "winners",
    });
    expect(k.matches.find((m) => m.slot === "w1.0")?.label).toBe("Quarter-final 1");
  });

  it("shares third place between the semi-final losers", () => {
    const { state } = playOut(advancers(4), "single", false, higherSeedWins);
    expect(state.placings).toEqual([
      { playerId: "s1", from: 1, to: 1 },
      { playerId: "s2", from: 2, to: 2 },
      { playerId: "s4", from: 3, to: 4 },
      { playerId: "s3", from: 3, to: 4 },
    ]);
  });

  it("keeps players from the same group apart in the first round where possible", () => {
    // 4 groups, top 2: winners s1–s4 (groups 0–3), runners-up s5–s8 (groups 0–3).
    const seeds = advancers(8, 4);
    const k = knockout(seeds, "single", false, new Map());
    const groupOf = new Map(seeds.map((s) => [s.playerId, s.group]));
    for (const m of k.matches.filter((m) => m.slot.startsWith("w1."))) {
      const [a, b] = m.players.map((p) => (p.kind === "player" ? groupOf.get(p.playerId) : -1));
      expect(a).not.toBe(b);
    }
  });
});

describe("double elimination", () => {
  it.each([2, 3, 4, 5, 6, 7, 8, 11, 16])("plays %i advancers to a champion", (n) => {
    const { state, results } = playOut(advancers(n), "double", true, higherSeedWins);
    expect(state.champion).toBe("s1");
    expect(state.placings).toHaveLength(n);
    // Everyone but the champion lost twice, except a grand final loser who lost once in it.
    const losses = new Map<string, number>();
    for (const r of results.values()) {
      const loser = r.players.find((p) => p !== r.winner) as string;
      losses.set(loser, (losses.get(loser) ?? 0) + 1);
    }
    expect(losses.get("s1")).toBeUndefined();
    for (const [, count] of losses) expect(count).toBeLessThanOrEqual(2);
  });

  it("sends first-round losers to the losers bracket and drops later losers in", () => {
    const results = new Map<string, Result>();
    const k0 = knockout(advancers(4), "double", true, results);
    expect(names(k0, "w1.0")).toEqual(["s1", "s4"]);
    results.set("w1.0", result("w1.0", "s1", "s4", "s1"));
    results.set("w1.1", result("w1.1", "s2", "s3", "s2"));
    const k1 = knockout(advancers(4), "double", true, results);
    expect(names(k1, "l1.0")).toEqual(["s4", "s3"]);
    expect(names(k1, "w2.0")).toEqual(["s1", "s2"]);
    results.set("l1.0", result("l1.0", "s4", "s3", "s3"));
    results.set("w2.0", result("w2.0", "s1", "s2", "s1"));
    const k2 = knockout(advancers(4), "double", true, results);
    expect(names(k2, "l2.0")).toEqual(["s3", "s2"]);
    expect(k2.matches.find((m) => m.slot === "l2.0")?.label).toBe("Losers final");
    results.set("l2.0", result("l2.0", "s3", "s2", "s2"));
    expect(names(knockout(advancers(4), "double", true, results), "gf")).toEqual(["s1", "s2"]);
  });

  it.each([8, 16])("avoids rematches in the first losers rounds with %i players", (n) => {
    const { results } = playOut(advancers(n), "double", true, higherSeedWins);
    const met = (slotPrefix: string) =>
      [...results.values()]
        .filter((r) => r.slot.startsWith(slotPrefix))
        .map((r) => [...r.players].sort().join("-"));
    const winnersPairs = new Set(met("w"));
    for (const pair of [...met("l1."), ...met("l2.")]) expect(winnersPairs.has(pair)).toBe(false);
  });

  it("plays the bracket reset when the losers-bracket player wins the grand final", () => {
    const losersSideWinsFinal = (slot: string, a: string, b: string) =>
      slot === "gf" ? b : higherSeedWins(slot, a, b);
    const { state, results } = playOut(advancers(4), "double", true, losersSideWinsFinal);
    expect(results.has("gf2")).toBe(true);
    expect(state.champion).toBe("s1"); // wins the reset as the higher seed
    expect(state.matches.find((m) => m.slot === "gf2")?.label).toBe("Grand final (reset)");
  });

  it("crowns the grand final winner straight away without a bracket reset", () => {
    const losersSideWinsFinal = (slot: string, a: string, b: string) =>
      slot === "gf" ? b : higherSeedWins(slot, a, b);
    const { state, results } = playOut(advancers(4), "double", false, losersSideWinsFinal);
    expect(results.has("gf2")).toBe(false);
    expect(state.champion).toBe("s2");
  });

  it("places by the round a player went out in the losers bracket", () => {
    const { state } = playOut(advancers(8), "double", true, higherSeedWins);
    expect(state.placings?.slice(0, 4).map((p) => [p.playerId, p.from, p.to])).toEqual([
      ["s1", 1, 1],
      ["s2", 2, 2],
      ["s3", 3, 3],
      ["s4", 4, 4],
    ]);
    expect(state.placings?.slice(4).map((p) => [p.from, p.to])).toEqual([
      [5, 6],
      [5, 6],
      [7, 8],
      [7, 8],
    ]);
  });
});

describe("placings from stages", () => {
  it("shares places between equal stages", () => {
    expect(
      placingsFromStages([
        { playerId: "a", stage: 5 },
        { playerId: "b", stage: 2 },
        { playerId: "c", stage: 2 },
        { playerId: "d", stage: 1 },
      ]),
    ).toEqual([
      { playerId: "a", from: 1, to: 1 },
      { playerId: "b", from: 2, to: 3 },
      { playerId: "c", from: 2, to: 3 },
      { playerId: "d", from: 4, to: 4 },
    ]);
  });
});

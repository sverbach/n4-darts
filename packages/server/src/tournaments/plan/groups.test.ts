import { describe, expect, it } from "vitest";
import { groupFixtures, groupSlot, groupTable, snakeGroups } from "./groups.ts";
import type { Result } from "./types.ts";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

describe("snake-seeded groups", () => {
  it("deals seeds out and back", () => {
    expect(snakeGroups(ids(8), 2)).toEqual([
      ["p1", "p4", "p5", "p8"],
      ["p2", "p3", "p6", "p7"],
    ]);
    expect(snakeGroups(ids(7), 3)).toEqual([
      ["p1", "p6", "p7"],
      ["p2", "p5"],
      ["p3", "p4"],
    ]);
  });

  it("puts everyone in one group by default", () => {
    expect(snakeGroups(ids(5), 1)).toEqual([ids(5)]);
  });
});

describe("group fixtures", () => {
  it.each([3, 4, 5, 6, 7, 8, 16])("has everyone play everyone once with %i players", (n) => {
    const fixtures = groupFixtures(ids(n));
    const pairs = fixtures.map((f) => [f.a, f.b].sort().join("-"));

    expect(fixtures).toHaveLength((n * (n - 1)) / 2);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("spreads matches over rounds so nobody plays twice in a round", () => {
    const fixtures = groupFixtures(ids(6));
    const rounds = new Set(fixtures.map((f) => f.round));
    expect(rounds.size).toBe(5);
    for (const round of rounds) {
      const players = fixtures.filter((f) => f.round === round).flatMap((f) => [f.a, f.b]);
      expect(new Set(players).size).toBe(players.length);
    }
  });

  it("names a fixture the same whichever way round", () => {
    expect(groupSlot(0, "b", "a")).toBe(groupSlot(0, "a", "b"));
  });
});

/** A group result; legs default to 1–0 (best of 1). */
function result(
  winner: string,
  loser: string,
  legs: [number, number] = [1, 0],
  average = 45,
): Result {
  return {
    slot: groupSlot(0, winner, loser),
    players: [winner, loser],
    winner,
    legs,
    walkover: false,
    stats: [
      { points: average, darts: 3 },
      { points: 30, darts: 3 },
    ],
  };
}

const seeds = (players: string[]) => (id: string) => players.indexOf(id);
const order = (players: string[], results: Result[]) =>
  groupTable(players, results, seeds(players)).map((row) => row.playerId);

describe("group table", () => {
  it("counts played, won, lost, legs, points and average", () => {
    const players = ["a", "b", "c"];
    const table = groupTable(
      players,
      [result("a", "b", [2, 1]), result("c", "a", [2, 0])],
      seeds(players),
    );

    expect(table.find((r) => r.playerId === "a")).toMatchObject({
      played: 2,
      won: 1,
      lost: 1,
      legsFor: 2,
      legsAgainst: 3,
      legDiff: -1,
      points: 2,
    });
    expect(table.map((r) => r.playerId)).toEqual(["c", "a", "b"]);
  });

  it("ranks by points, then leg difference", () => {
    const players = ["a", "b", "c", "d"];
    // a and b both win twice; a by more legs.
    const results = [
      result("a", "c", [2, 0]),
      result("a", "d", [2, 0]),
      result("b", "c", [2, 1]),
      result("b", "d", [2, 1]),
      result("b", "a", [2, 1]),
      result("c", "d", [2, 1]),
    ];
    // a: 2 wins, legs 5–2 (+3); b: 3 wins.
    expect(order(players, results)).toEqual(["b", "a", "c", "d"]);
  });

  it("breaks a two-way tie on points and legs by head-to-head", () => {
    const players = ["a", "b", "c", "d"];
    const results = [
      result("a", "c"),
      result("b", "d"),
      result("b", "a"),
      result("a", "d"),
      result("c", "b"),
      result("d", "c"),
    ];
    // a and b: 2 wins, legs 2–1; b beat a. c and d: 1 win, legs 1–2; d beat c.
    expect(order(players, results)).toEqual(["b", "a", "d", "c"]);
  });

  it("splits a three-way tie with the mini table of their mutual matches", () => {
    const players = ["a", "b", "c", "d"];
    const results = [
      // Mutual: a beat b 2–0, b beat c 2–1, c beat a 2–1 → mini legs a +1, c 0, b −1.
      result("a", "b", [2, 0]),
      result("b", "c", [2, 1]),
      result("c", "a", [2, 1]),
      // Against d they make up the difference: everyone ends on 4 points and +2.
      result("a", "d", [2, 1]),
      result("b", "d", [3, 0]),
      result("c", "d", [2, 0]),
    ];
    expect(order(players, results)).toEqual(["a", "c", "b", "d"]);
  });

  it("falls back to the group average, then the seed", () => {
    const players = ["a", "b", "c"];
    // A perfect circle: everyone 1 win, 1–1 legs, mutual table level too.
    const circle = (avgA: number, avgB: number, avgC: number) => [
      result("a", "b", [1, 0], avgA),
      result("b", "c", [1, 0], avgB),
      result("c", "a", [1, 0], avgC),
    ];
    expect(order(players, circle(30, 60, 45))).toEqual(["b", "c", "a"]);
    expect(order(players, circle(45, 45, 45))).toEqual(["a", "b", "c"]);
  });

  it("gives a walkover 2 points and the legs, but leaves it out of the average", () => {
    const players = ["a", "b"];
    const walkover: Result = { ...result("a", "b", [2, 0], 180), walkover: true };
    const [first] = groupTable(players, [walkover], seeds(players));

    expect(first).toMatchObject({ playerId: "a", points: 2, legsFor: 2, average: null });
  });
});

import { describe, expect, it } from "vitest";
import { configProblems, plan } from "./plan.ts";
import {
  defaultTournamentConfig,
  type Entrant,
  type Result,
  type TournamentConfig,
} from "./types.ts";

const entrants = (n: number, groups = 1): Entrant[] =>
  Array.from({ length: n }, (_, i) => ({
    playerId: `p${i + 1}`,
    seed: i,
    group: i % groups,
    withdrawn: false,
  }));

const config = (format: Partial<TournamentConfig["format"]> = {}): TournamentConfig => ({
  ...defaultTournamentConfig,
  format: { ...defaultTournamentConfig.format, ...format },
});

const seedNo = (id: string) => Number(id.slice(1));

/** Plays every playable match with the higher seed winning, until nothing is left. */
function playAll(cfg: TournamentConfig, people: Entrant[]) {
  const results: Result[] = [];
  for (let guard = 0; guard < 500; guard++) {
    const p = plan(cfg, people, results);
    const next = p.matches.find((m) => m.players && !results.some((r) => r.slot === m.slot));
    if (!next?.players) return { plan: p, results };
    const [a, b] = next.players;
    const winner = seedNo(a) < seedNo(b) ? a : b;
    results.push({
      slot: next.slot,
      players: [a, b],
      winner,
      legs: winner === a ? [1, 0] : [0, 1],
      walkover: false,
      stats: [
        { points: 45, darts: 3 },
        { points: 45, darts: 3 },
      ],
    });
  }
  throw new Error("never finished");
}

describe("tournament plan", () => {
  it("starts with the group fixtures only", () => {
    const p = plan(config(), entrants(4), []);
    expect(p.matches).toHaveLength(6);
    expect(p.matches.every((m) => m.phase === "groups" && m.players)).toBe(true);
    expect(p.matches[0]?.label).toBe("Group match 1");
    expect(p.groupPhaseDone).toBe(false);
    expect(p.knockout).toBeNull();
  });

  it("labels fixtures by group when there are several", () => {
    const p = plan(config({ groups: 2 }), entrants(6, 2), []);
    expect(p.matches.map((m) => m.label)).toContain("Group B · match 3");
  });

  it("builds the knockout once the groups are done and plays to a champion", () => {
    const { plan: p } = playAll(config({ elimination: "single" }), entrants(4));
    expect(p.groupPhaseDone).toBe(true);
    expect(p.champion).toBe("p1");
    // 6 group matches + semi-finals + final.
    expect(p.matches).toHaveLength(9);
    expect(p.placings?.map((x) => [x.playerId, x.from, x.to])).toEqual([
      ["p1", 1, 1],
      ["p2", 2, 2],
      ["p4", 3, 4],
      ["p3", 3, 4],
    ]);
  });

  it("places players who didn't advance after the knockout, by group position", () => {
    const cfg = config({ groups: 2, advancePerGroup: 1, elimination: "single" });
    const { plan: p } = playAll(cfg, entrants(6, 2));
    // p1 (group A) beats p2 (group B) in the final; then 2nd and 3rd of each group.
    expect(p.placings?.map((x) => [x.from, x.to])).toEqual([
      [1, 1],
      [2, 2],
      [3, 4],
      [3, 4],
      [5, 6],
      [5, 6],
    ]);
  });

  it("runs a double-elimination tournament to the end", () => {
    const { plan: p } = playAll(config(), entrants(7));
    expect(p.champion).toBe("p1");
    expect(p.placings).toHaveLength(7);
  });
});

describe("config problems", () => {
  it("accepts the default for 3 or more players", () => {
    expect(configProblems(defaultTournamentConfig, 3)).toEqual([]);
  });

  it("needs 3 players per group and someone to advance", () => {
    expect(configProblems(defaultTournamentConfig, 2)).toEqual([
      "A tournament needs at least 3 players.",
    ]);
    expect(configProblems(config({ groups: 2 }), 5)[0]).toMatch(/at least 6 players/);
    expect(configProblems(config({ groups: 2, advancePerGroup: 4 }), 6)[0]).toMatch(
      /smallest group/,
    );
    expect(configProblems(config({ groups: 1, advancePerGroup: 1 }), 4)[0]).toMatch(/two players/);
  });
});

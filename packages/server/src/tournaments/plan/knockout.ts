// The knockout: seeding the advancers, single or double elimination brackets with byes, who
// plays whom as results come in, and the final placings (.scratch/tournaments/spec.md).

import type { TableRow } from "./groups.ts";
import type { Elimination, Placing, Result } from "./types.ts";

export interface Advancer {
  playerId: string;
  group: number;
  /** Position in the group, 0 = winner. */
  rank: number;
}

/**
 * Knockout seeds from the final group tables: all group winners (by points, leg difference,
 * average), then all runners-up, and so on. With one group that's simply the table.
 */
export function seedAdvancers(tables: TableRow[][], advancePerGroup: number | null): Advancer[] {
  const seeds: Advancer[] = [];
  const deepest = Math.max(0, ...tables.map((t) => t.length));
  const limit = advancePerGroup ?? deepest;
  for (let rank = 0; rank < Math.min(limit, deepest); rank++) {
    const tier = tables.flatMap((table, group) => {
      const row = table[rank];
      return row ? [{ row, group }] : [];
    });
    tier.sort(
      (a, b) =>
        b.row.points - a.row.points ||
        b.row.legDiff - a.row.legDiff ||
        (b.row.average ?? -1) - (a.row.average ?? -1) ||
        a.group - b.group,
    );
    seeds.push(...tier.map(({ row, group }) => ({ playerId: row.playerId, group, rank })));
  }
  return seeds;
}

/** Bracket positions for `size` slots: seed numbers (1-based) in order, e.g. 1 8 4 5 2 7 3 6. */
export function bracketOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const length = order.length * 2;
    order = order.flatMap((seed) => [seed, length + 1 - seed]);
  }
  return order;
}

const nextPowerOfTwo = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(n, 1)));

/**
 * Swaps players within the same rank so nobody meets someone from their own group in the first
 * round, where that's possible. Returns the seeds in their (possibly changed) order.
 */
function avoidSameGroup(seeds: Advancer[], size: number): Advancer[] {
  const out = [...seeds];
  const order = bracketOrder(size);
  const partner = new Map<number, number>();
  for (let i = 0; i < order.length; i += 2) {
    const [a, b] = [order[i] as number, order[i + 1] as number];
    partner.set(a, b);
    partner.set(b, a);
  }
  const at = (seedNo: number) => out[seedNo - 1];
  const clashes = () => {
    let count = 0;
    for (let s = 1; s <= out.length; s++) {
      const p = partner.get(s) as number;
      if (s < p && at(p) && at(s)?.group === at(p)?.group) count++;
    }
    return count;
  };
  let current = clashes();
  for (let improved = true; improved && current > 0; ) {
    improved = false;
    for (let s = 1; s <= out.length && !improved; s++) {
      const p = partner.get(s) as number;
      if (!(s < p && at(p) && at(s)?.group === at(p)?.group)) continue;
      // Try swapping the lower seed of the clash with another player of the same rank.
      for (let t = 1; t <= out.length && !improved; t++) {
        if (t === p || at(t)?.rank !== at(p)?.rank) continue;
        [out[p - 1], out[t - 1]] = [out[t - 1] as Advancer, out[p - 1] as Advancer];
        const after = clashes();
        if (after < current) {
          current = after;
          improved = true;
        } else {
          [out[p - 1], out[t - 1]] = [out[t - 1] as Advancer, out[p - 1] as Advancer];
        }
      }
    }
  }
  return out;
}

export type Participant =
  | { kind: "player"; playerId: string }
  /** Nobody will ever come from here (an empty bracket slot); the other side advances. */
  | { kind: "bye" }
  /** Not decided yet. */
  | { kind: "pending" };

type Source = { seed: number } | { winnerOf: string } | { loserOf: string };

export type BracketPhase = "winners" | "losers" | "final";

export interface BracketMatch {
  slot: string;
  /** Which legs setting applies. */
  phase: BracketPhase;
  label: string;
  /** Queue order: lower plays first. */
  order: number;
  players: [Participant, Participant];
}

export interface Knockout {
  matches: BracketMatch[];
  champion: string | null;
  /** Placings of everyone in the knockout, once there's a champion. */
  placings: Placing[] | null;
}

const pending: Participant = { kind: "pending" };
const bye: Participant = { kind: "bye" };
const player = (playerId: string): Participant => ({ kind: "player", playerId });

function roundName(fromEnd: number) {
  return ["Final", "Semi-final", "Quarter-final"][fromEnd];
}

/**
 * The bracket for the given seeds (in seed order), with every participant worked out from the
 * results so far. A match with a bye on one side isn't played: the other player advances.
 */
export function knockout(
  advancers: Advancer[],
  elimination: Elimination,
  bracketReset: boolean,
  results: Map<string, Result>,
): Knockout {
  const size = nextPowerOfTwo(advancers.length);
  const rounds = Math.log2(size);
  const seeds = avoidSameGroup(advancers, size);
  const order = bracketOrder(size);
  const double = elimination === "double";

  const defs = new Map<string, Omit<BracketMatch, "players"> & { sources: [Source, Source] }>();
  const define = (
    slot: string,
    phase: BracketPhase,
    label: string,
    matchOrder: number,
    sources: [Source, Source],
  ) => defs.set(slot, { slot, phase, label, order: matchOrder, sources });

  // Winners bracket (the whole bracket in single elimination).
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    const fromEnd = rounds - r;
    const name = double
      ? fromEnd === 0
        ? "Winners final"
        : fromEnd < 3
          ? `Winners ${roundName(fromEnd)?.toLowerCase()}`
          : `Winners round ${r}`
      : (roundName(fromEnd) ?? `Round ${r}`);
    for (let m = 0; m < count; m++) {
      const sources: [Source, Source] =
        r === 1
          ? [{ seed: order[2 * m] as number }, { seed: order[2 * m + 1] as number }]
          : [{ winnerOf: `w${r - 1}.${2 * m}` }, { winnerOf: `w${r - 1}.${2 * m + 1}` }];
      const phase: BracketPhase = !double && fromEnd === 0 ? "final" : "winners";
      define(`w${r}.${m}`, phase, count > 1 ? `${name} ${m + 1}` : name, 2 * r - 1, sources);
    }
  }

  let losersWinner: Source = { loserOf: "w1.0" };
  if (double && rounds >= 2) {
    const lastRound = 2 * (rounds - 1);
    for (let j = 1; j <= lastRound; j++) {
      const name = j === lastRound ? "Losers final" : `Losers round ${j}`;
      const add = (count: number, sourcesFor: (m: number) => [Source, Source]) => {
        for (let m = 0; m < count; m++) {
          define(
            `l${j}.${m}`,
            "losers",
            count > 1 ? `${name} ${m + 1}` : name,
            j + 1,
            sourcesFor(m),
          );
        }
      };
      if (j === 1) {
        add(size / 4, (m) => [{ loserOf: `w1.${2 * m}` }, { loserOf: `w1.${2 * m + 1}` }]);
      } else if (j % 2 === 0) {
        // Losers of winners round i+1 drop in, every other round in reverse to avoid rematches.
        const i = j / 2;
        const count = size / 2 ** (i + 1);
        add(count, (m) => [
          { winnerOf: `l${j - 1}.${m}` },
          { loserOf: `w${i + 1}.${i % 2 === 1 ? count - 1 - m : m}` },
        ]);
      } else {
        const count = size / 2 ** ((j + 1) / 2 + 1);
        add(count, (m) => [
          { winnerOf: `l${j - 1}.${2 * m}` },
          { winnerOf: `l${j - 1}.${2 * m + 1}` },
        ]);
      }
    }
    losersWinner = { winnerOf: `l${lastRound}.0` };
  }
  if (double) {
    define("gf", "final", "Grand final", 2 * rounds + 1, [
      { winnerOf: `w${rounds}.0` },
      losersWinner,
    ]);
  }

  // Resolving participants, memoised per slot.
  const resolved = new Map<string, [Participant, Participant]>();
  function participants(slot: string): [Participant, Participant] {
    const known = resolved.get(slot);
    if (known) return known;
    const def = defs.get(slot);
    if (!def) return [bye, bye];
    const both = def.sources.map(resolve) as [Participant, Participant];
    resolved.set(slot, both);
    return both;
  }
  function outcome(slot: string): { winner: Participant; loser: Participant } {
    const [a, b] = participants(slot);
    if (a.kind === "pending" || b.kind === "pending") return { winner: pending, loser: pending };
    if (a.kind === "bye") return { winner: b, loser: bye };
    if (b.kind === "bye") return { winner: a, loser: bye };
    const result = results.get(slot);
    if (!result) return { winner: pending, loser: pending };
    const winner = result.winner;
    const loser = winner === a.playerId ? b.playerId : a.playerId;
    return { winner: player(winner), loser: player(loser) };
  }
  function resolve(source: Source): Participant {
    if ("seed" in source) {
      const seed = seeds[source.seed - 1];
      return seed ? player(seed.playerId) : bye;
    }
    if ("winnerOf" in source) return outcome(source.winnerOf).winner;
    return outcome(source.loserOf).loser;
  }

  const matches: BracketMatch[] = [...defs.values()].map(({ sources: _, ...def }) => ({
    ...def,
    players: participants(def.slot),
  }));

  // The champion, adding the bracket reset when the losers-bracket player wins the grand final.
  let champion: string | null = null;
  const last = double ? "gf" : `w${rounds}.0`;
  const decided = outcome(last).winner;
  if (advancers.length === 1) {
    champion = advancers[0]?.playerId ?? null;
  } else if (decided.kind === "player") {
    const [wbSide] = participants("gf");
    const losersSideWon =
      double && wbSide.kind === "player" && wbSide.playerId !== decided.playerId;
    if (losersSideWon && bracketReset) {
      const players = participants("gf");
      const reset: BracketMatch = {
        slot: "gf2",
        phase: "final",
        label: "Grand final (reset)",
        order: 2 * rounds + 2,
        players,
      };
      matches.push(reset);
      const resetResult = results.get("gf2");
      champion = resetResult ? resetResult.winner : null;
    } else {
      champion = decided.playerId;
    }
  }

  return { matches, champion, placings: champion ? knockoutPlacings() : null };

  /** Everyone's stage (how far they got): higher is better; equal stages share a place. */
  function knockoutPlacings(): Placing[] {
    const stage = new Map<string, number>();
    for (const match of matches) {
      const result = results.get(match.slot);
      if (!result) continue;
      const loser = result.players.find((p) => p !== result.winner) as string;
      if (!double) {
        stage.set(loser, Number(match.slot.slice(1).split(".")[0]));
      } else if (match.slot.startsWith("l")) {
        stage.set(loser, Number(match.slot.slice(1).split(".")[0]));
      } else if (match.slot === "gf" || match.slot === "gf2") {
        stage.set(loser, 2 * rounds - 1);
      }
      // A winners-bracket loser in double elimination isn't out yet: they drop to the losers.
    }
    if (champion) stage.set(champion, double ? 2 * rounds : rounds + 1);
    return placingsFromStages([...stage].map(([playerId, s]) => ({ playerId, stage: s })));
  }
}

/** Places from stages (higher = further): equal stages share, e.g. two players at 5–6. */
export function placingsFromStages(entries: { playerId: string; stage: number }[]): Placing[] {
  const sorted = [...entries].sort((a, b) => b.stage - a.stage);
  const placings: Placing[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j < sorted.length && sorted[j]?.stage === sorted[i]?.stage) j++;
    for (let k = i; k < j; k++) {
      placings.push({ playerId: (sorted[k] as { playerId: string }).playerId, from: i + 1, to: j });
    }
    i = j;
  }
  return placings;
}

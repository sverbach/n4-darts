// The group phase: snake-seeded groups, round-robin fixtures and tables with tie-breaks
// (.scratch/tournaments/spec.md).

import { type DartStats, threeDartAverage } from "@n4/engine";
import type { Result } from "./types.ts";

/** Deals players (in seed order) into groups: 1, 2, 3, then 3, 2, 1, and so on. */
export function snakeGroups(seedOrder: string[], groupCount: number): string[][] {
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  seedOrder.forEach((player, i) => {
    const lap = Math.floor(i / groupCount);
    const position = i % groupCount;
    groups[lap % 2 === 0 ? position : groupCount - 1 - position]?.push(player);
  });
  return groups;
}

/** A group fixture's slot; the same whichever way round the players are given. */
export const groupSlot = (group: number, a: string, b: string) =>
  `g:${group}:${[a, b].sort().join(":")}`;

export interface Fixture {
  a: string;
  b: string;
  /** Everyone plays at most once per round; rounds order the queue. */
  round: number;
}

/** Everyone plays everyone once, spread over rounds (the circle method). */
export function groupFixtures(players: string[]): Fixture[] {
  const ring: (string | null)[] = [...players];
  if (ring.length % 2 === 1) ring.push(null);
  const fixtures: Fixture[] = [];
  for (let round = 0; round < ring.length - 1; round++) {
    for (let i = 0; i < ring.length / 2; i++) {
      const a = ring[i];
      const b = ring[ring.length - 1 - i];
      if (a && b) fixtures.push({ a, b, round });
    }
    // Keep the first in place and rotate the rest.
    ring.splice(1, 0, ring.pop() as string | null);
  }
  return fixtures;
}

export interface TableRow {
  playerId: string;
  played: number;
  won: number;
  lost: number;
  legsFor: number;
  legsAgainst: number;
  legDiff: number;
  /** 2 per win. */
  points: number;
  /** 3-dart average over the group matches actually played. */
  average: number | null;
}

export const POINTS_PER_WIN = 2;

function rows(players: string[], results: Result[]): Map<string, TableRow> {
  const table = new Map(
    players.map((playerId) => [
      playerId,
      {
        playerId,
        played: 0,
        won: 0,
        lost: 0,
        legsFor: 0,
        legsAgainst: 0,
        legDiff: 0,
        points: 0,
        average: null as number | null,
      },
    ]),
  );
  for (const result of results) {
    result.players.forEach((playerId, i) => {
      const row = table.get(playerId);
      if (!row) return;
      const won = result.winner === playerId;
      row.played += 1;
      row.won += won ? 1 : 0;
      row.lost += won ? 0 : 1;
      row.points += won ? POINTS_PER_WIN : 0;
      row.legsFor += result.legs[i] ?? 0;
      row.legsAgainst += result.legs[1 - i] ?? 0;
      row.legDiff = row.legsFor - row.legsAgainst;
    });
  }
  return table;
}

/**
 * The group table, best first. Ties on points and leg difference go to head-to-head: a mini
 * table of the tied players' mutual matches (points, then leg difference), applied again to
 * whoever is still level; then the group average; then the higher seed.
 */
export function groupTable(
  players: string[],
  results: Result[],
  seedOf: (playerId: string) => number,
): TableRow[] {
  const table = rows(players, results);
  const stats = new Map<string, DartStats[]>(players.map((p) => [p, []]));
  for (const result of results) {
    if (result.walkover) continue;
    result.players.forEach((p, i) => stats.get(p)?.push(result.stats[i] as DartStats));
  }
  for (const row of table.values()) row.average = threeDartAverage(stats.get(row.playerId) ?? []);

  const byAverageThenSeed = (a: string, b: string) =>
    (table.get(b)?.average ?? -1) - (table.get(a)?.average ?? -1) || seedOf(a) - seedOf(b);

  function rank(ids: string[], mutualOnly: boolean): string[] {
    const relevant = mutualOnly
      ? results.filter((r) => r.players.every((p) => ids.includes(p)))
      : results;
    const sub = rows(ids, relevant);
    const key = (id: string) => {
      const row = sub.get(id) as TableRow;
      return [row.points, row.legDiff] as const;
    };
    const sorted = [...ids].sort((a, b) => {
      const [pa, da] = key(a);
      const [pb, db] = key(b);
      return pb - pa || db - da;
    });
    const out: string[] = [];
    for (let i = 0; i < sorted.length; ) {
      const [p, d] = key(sorted[i] as string);
      let j = i;
      while (
        j < sorted.length &&
        key(sorted[j] as string)[0] === p &&
        key(sorted[j] as string)[1] === d
      )
        j++;
      const tied = sorted.slice(i, j);
      if (tied.length === 1) out.push(...tied);
      else if (!mutualOnly || tied.length < ids.length) out.push(...rank(tied, true));
      else out.push(...tied.sort(byAverageThenSeed));
      i = j;
    }
    return out;
  }

  return rank(players, false).map((id) => table.get(id) as TableRow);
}

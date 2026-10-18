// The whole tournament from its entrants and results: group fixtures and tables, the knockout
// once the groups are done, and the champion and placings at the end. The server materialises
// the matches this plan says can be played.

import { groupFixtures, groupSlot, groupTable, type TableRow } from "./groups.ts";
import { type Knockout, knockout, placingsFromStages, seedAdvancers } from "./knockout.ts";
import type { Entrant, Placing, Result, TournamentConfig } from "./types.ts";

export type MatchPhase = "groups" | "winners" | "losers" | "final";

export interface PlannedMatch {
  slot: string;
  phase: MatchPhase;
  label: string;
  /** Queue order: lower plays first (group rounds, then knockout rounds). */
  order: number;
  /** Both players once known; null while a knockout match waits for earlier results. */
  players: [string, string] | null;
  /** Each side as soon as it's known, for showing the bracket. */
  sides: [string | null, string | null];
}

export interface Plan {
  groups: { players: string[]; table: TableRow[] }[];
  groupPhaseDone: boolean;
  /** Every match that is or will be played; byes (no match) aren't in here. */
  matches: PlannedMatch[];
  knockout: Knockout | null;
  champion: string | null;
  placings: Placing[] | null;
}

/** Knockout queue orders come after every group round. */
const KNOCKOUT_ORDER = 1000;

export const groupName = (group: number) => String.fromCharCode(65 + group);

export function plan(config: TournamentConfig, entrants: Entrant[], results: Result[]): Plan {
  const bySlot = new Map(results.map((r) => [r.slot, r]));
  const seedOf = (playerId: string) => entrants.find((e) => e.playerId === playerId)?.seed ?? 999;
  const groupCount = Math.max(1, ...entrants.map((e) => e.group + 1));
  const single = groupCount === 1;

  const matches: PlannedMatch[] = [];
  const groups = Array.from({ length: groupCount }, (_, group) => {
    const players = entrants
      .filter((e) => e.group === group)
      .sort((a, b) => a.seed - b.seed)
      .map((e) => e.playerId);
    const fixtures = groupFixtures(players);
    fixtures.forEach((fixture, i) => {
      matches.push({
        slot: groupSlot(group, fixture.a, fixture.b),
        phase: "groups",
        label: single ? `Group match ${i + 1}` : `Group ${groupName(group)} · match ${i + 1}`,
        order: fixture.round,
        players: [fixture.a, fixture.b],
        sides: [fixture.a, fixture.b],
      });
    });
    const groupResults = fixtures.flatMap((f) => {
      const result = bySlot.get(groupSlot(group, f.a, f.b));
      return result ? [result] : [];
    });
    return {
      players,
      table: groupTable(players, groupResults, seedOf),
      fixtureCount: fixtures.length,
      played: groupResults.length,
    };
  });
  const groupPhaseDone = groups.every((g) => g.played === g.fixtureCount);
  const groupView = groups.map(({ players, table }) => ({ players, table }));

  if (!groupPhaseDone) {
    return {
      groups: groupView,
      groupPhaseDone,
      matches,
      knockout: null,
      champion: null,
      placings: null,
    };
  }

  const { elimination, bracketReset, advancePerGroup } = config.format;
  const advancers = seedAdvancers(
    groups.map((g) => g.table),
    advancePerGroup,
  );
  const bracket = knockout(advancers, elimination, bracketReset, bySlot);
  for (const m of bracket.matches) {
    const [a, b] = m.players;
    if (a.kind === "bye" || b.kind === "bye") continue;
    matches.push({
      slot: m.slot,
      phase: m.phase,
      label: m.label,
      order: KNOCKOUT_ORDER + m.order,
      players: a.kind === "player" && b.kind === "player" ? [a.playerId, b.playerId] : null,
      sides: [a.kind === "player" ? a.playerId : null, b.kind === "player" ? b.playerId : null],
    });
  }

  let placings: Placing[] | null = null;
  if (bracket.placings) {
    // Players who didn't advance come after, sharing places by their group position.
    const advanced = new Set(advancers.map((a) => a.playerId));
    const others = groups.flatMap((g) =>
      g.table
        .map((row, rank) => ({ playerId: row.playerId, stage: -rank }))
        .filter((entry) => !advanced.has(entry.playerId)),
    );
    const offset = bracket.placings.length;
    placings = [
      ...bracket.placings,
      ...placingsFromStages(others).map((p) => ({
        ...p,
        from: p.from + offset,
        to: p.to + offset,
      })),
    ];
  }

  return {
    groups: groupView,
    groupPhaseDone,
    matches,
    knockout: bracket,
    champion: bracket.champion,
    placings,
  };
}

/** Problems that stop a tournament from starting; empty when it's fine. */
export function configProblems(config: TournamentConfig, playerCount: number): string[] {
  const problems: string[] = [];
  const { groups, advancePerGroup } = config.format;
  if (!Number.isInteger(groups) || groups < 1) problems.push("There has to be at least one group.");
  else if (playerCount < groups * 3) {
    problems.push(
      groups === 1
        ? "A tournament needs at least 3 players."
        : `${groups} groups need at least ${groups * 3} players (3 per group).`,
    );
  }
  if (advancePerGroup !== null) {
    const smallest = Math.floor(playerCount / Math.max(groups, 1));
    if (!Number.isInteger(advancePerGroup) || advancePerGroup < 1) {
      problems.push("At least one player has to advance from each group.");
    } else if (advancePerGroup > smallest && playerCount >= groups * 3) {
      problems.push(`Only ${smallest} players are in the smallest group.`);
    } else if (groups * advancePerGroup < 2) {
      problems.push("At least two players have to reach the knockout.");
    }
  }
  for (const [phase, legs] of Object.entries(config.legs)) {
    if (!Number.isInteger(legs) || legs < 1) problems.push(`Legs for ${phase} must be at least 1.`);
  }
  if (!Number.isInteger(config.x01.startScore) || config.x01.startScore < 2) {
    problems.push("The start score must be a whole number of at least 2.");
  }
  return problems;
}

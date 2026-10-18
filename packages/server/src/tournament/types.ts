// Tournament configuration and results as the pure tournament logic sees them. Nothing in
// this folder does I/O: the server feeds it what's in the database and acts on the answer.

import type { DartStats, InRule, OutRule } from "@n4/engine";

export type Elimination = "single" | "double";

export interface TournamentFormat {
  /** Number of groups; at least 3 players each. */
  groups: number;
  /** How many advance from each group; null = everyone. */
  advancePerGroup: number | null;
  elimination: Elimination;
  /** Double elimination: a deciding match if the losers-bracket player wins the grand final. */
  bracketReset: boolean;
}

/** Legs needed to win a match, per phase ("first to N"; best of 2N−1 for two players). */
export interface PhaseLegs {
  groups: number;
  winners: number;
  losers: number;
  final: number;
}

export interface TournamentConfig {
  format: TournamentFormat;
  legs: PhaseLegs;
  x01: { startScore: number; inRule: InRule; outRule: OutRule };
}

export const defaultTournamentConfig: TournamentConfig = {
  format: { groups: 1, advancePerGroup: null, elimination: "double", bracketReset: true },
  legs: { groups: 1, winners: 2, losers: 2, final: 3 },
  x01: { startScore: 301, inRule: "straight", outRule: "straight" },
};

export interface Entrant {
  playerId: string;
  /** 0 = top seed. */
  seed: number;
  group: number;
  withdrawn: boolean;
}

/** A decided tournament match. */
export interface Result {
  slot: string;
  players: [string, string];
  winner: string;
  /** Legs won, in the order of `players`. */
  legs: [number, number];
  /** Won without being played; doesn't count for averages. */
  walkover: boolean;
  /** Per player, in the order of `players`. */
  stats: [DartStats, DartStats];
}

/** A final place; shared when `from` < `to` (e.g. 5–6 for two players out in the same round). */
export interface Placing {
  playerId: string;
  from: number;
  to: number;
}

// Types shared with the web app. Type-only: nothing here may pull in Node modules.

import type { MatchState, Segment, X01Settings } from "@n4/engine";
import type { TableRow } from "./tournament/groups.ts";
import type { Placing, TournamentConfig } from "./tournament/types.ts";

export type { Placing, TableRow, TournamentConfig };

export interface MatchPlayer {
  id: string;
  name: string;
}

export interface MatchView {
  id: string;
  /** In throwing order: index = the engine's `PlayerIndex`. */
  players: MatchPlayer[];
  settings: X01Settings;
  state: MatchState;
}

/** A match as listed in /admin history. */
export interface MatchSummary {
  id: string;
  station: number | null;
  players: MatchPlayer[];
  settings: X01Settings;
  /** Player id; null while unfinished, when abandoned, or after a correction took the win away. */
  winner: string | null;
  abandoned: boolean;
  closedAt: string | null;
  /** Legs won per player, in throwing order. */
  legsWon: number[];
}

/** A match with every leg and visit, for /admin. */
export interface MatchDetail extends MatchSummary {
  state: MatchState;
  /** What the board first detected, for every dart that was corrected since. */
  originals: Record<string, Segment>;
}

export interface StationView {
  id: number;
  name: string;
  boardOnline: boolean;
  match: MatchView | null;
}

export interface Player {
  id: string;
  name: string;
  /** Hidden from pickers; their history stays. */
  archived: boolean;
}

/** A station as /admin manages it. */
export interface StationAdminView {
  id: number;
  name: string;
  boardUrl: string;
  boardOnline: boolean;
  /** Has a match (set up or running); can't be removed until it's closed. */
  busy: boolean;
}

/** A player as /admin lists them. */
export interface AdminPlayer extends Player {
  /** 3-dart average over the last 10 completed matches; null for an unseeded player. */
  rating: number | null;
}

export interface AdminSession {
  /** False when the server has no `ADMIN_PIN`: /admin is open. */
  pinRequired: boolean;
  authenticated: boolean;
}

export type StationCommand =
  /** Sets up a match on the station; it starts with `startMatch`. */
  | { type: "quickMatch"; playerIds: string[]; settings?: MatchSettingsInput }
  /** Reorders the players of a match that hasn't started; the first one starts leg 1. */
  | { type: "setOrder"; playerIds: string[] }
  | { type: "startMatch" }
  | { type: "correctDart"; dartId: string; segment: Segment }
  | { type: "nextPlayer" }
  | { type: "undo" }
  /** Frees the station after the match is won. */
  | { type: "closeMatch" }
  /** Ends the match without a result; one that never started is removed altogether. */
  | { type: "abandonMatch" };

/** What can be chosen when setting up a match; the rules version is always the current one. */
export type MatchSettingsInput = Partial<Omit<X01Settings, "rulesVersion">>;

export interface TournamentEntrantView {
  playerId: string;
  name: string;
  /** 0 = top seed. */
  seed: number;
  group: number;
  withdrawn: boolean;
  rating: number | null;
}

/** The active tournament as /admin shows it. */
export interface TournamentAdminView {
  tournament: {
    id: string;
    name: string;
    status: "draft" | "running" | "finished";
    config: TournamentConfig;
    startedAt: string | null;
    finishedAt: string | null;
  } | null;
  /** In seed order. */
  entrants: TournamentEntrantView[];
  /** Player ids per group. */
  groups: string[][];
  /** Whole tournament (draft) or what's left of it (running), in minutes. */
  estimateMinutes: number | null;
  /** Why it can't start yet; empty when it can. */
  problems: string[];
}

// Types shared with the web app. Type-only: nothing here may pull in Node modules.

import type { MatchState, Segment, X01Settings } from "@n4/engine";

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

export interface StationView {
  id: number;
  boardOnline: boolean;
  match: MatchView | null;
}

export interface Player {
  id: string;
  name: string;
  /** Hidden from pickers; their history stays. */
  archived: boolean;
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

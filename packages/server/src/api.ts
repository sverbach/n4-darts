// Types shared with the web app. Type-only: nothing here may pull in Node modules.

import type { MatchState, PlayerIndex, Segment, X01Settings } from "@n4/engine";

export interface MatchView {
  id: string;
  /** Display names for player 0 and player 1. */
  players: [string, string];
  settings: X01Settings;
  state: MatchState;
}

export interface StationView {
  id: number;
  boardOnline: boolean;
  match: MatchView | null;
}

export type StationCommand =
  | {
      type: "startMatch";
      players: [string, string];
      firstPlayer: PlayerIndex;
      settings?: Partial<X01Settings>;
    }
  | { type: "correctDart"; dartId: string; segment: Segment }
  | { type: "nextPlayer" }
  | { type: "undo" }
  | { type: "closeMatch" };

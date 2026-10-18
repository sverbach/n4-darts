// Types shared with the web app. Type-only: nothing here may pull in Node modules.

import type { MatchState, Segment, X01Settings } from "@n4/engine";

export interface MatchView {
  id: string;
  /** Display names in throwing order. */
  players: string[];
  settings: X01Settings;
  state: MatchState;
}

export interface StationView {
  id: number;
  boardOnline: boolean;
  match: MatchView | null;
}

export interface AdminSession {
  /** False when the server has no `ADMIN_PIN`: /admin is open. */
  pinRequired: boolean;
  authenticated: boolean;
}

export type StationCommand =
  | {
      type: "startMatch";
      /** Names in throwing order: the first one starts leg 1. */
      players: string[];
      settings?: Partial<Omit<X01Settings, "rulesVersion">>;
    }
  | { type: "correctDart"; dartId: string; segment: Segment }
  | { type: "nextPlayer" }
  | { type: "undo" }
  | { type: "closeMatch" };

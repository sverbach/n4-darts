import {
  type AroundTheClockSettings,
  type AroundTheClockState,
  aroundTheClockState,
} from "./aroundTheClock.ts";
import { type CricketSettings, type CricketState, cricketState } from "./cricket.ts";
import type { MatchEvent, PlayerIndex, VisitView } from "./events.ts";
import { type GolfSettings, type GolfState, golfState } from "./golf.ts";
import { type HighScoreSettings, type HighScoreState, highScoreState } from "./highScore.ts";
import { type KillerSettings, type KillerState, killerState } from "./killer.ts";
import {
  type RandomCheckoutSettings,
  type RandomCheckoutState,
  randomCheckoutState,
} from "./randomCheckout.ts";
import { type X01Settings, type X01State, x01State } from "./x01.ts";

export type MatchSettings =
  | X01Settings
  | AroundTheClockSettings
  | HighScoreSettings
  | GolfSettings
  | KillerSettings
  | CricketSettings
  | RandomCheckoutSettings;
export type Mode = MatchSettings["mode"];
export type PartyMode = Exclude<Mode, "x01">;
export type MatchState =
  | X01State
  | AroundTheClockState
  | HighScoreState
  | GolfState
  | KillerState
  | CricketState
  | RandomCheckoutState;

export const MODES: readonly Mode[] = [
  "x01",
  "aroundTheClock",
  "golf",
  "highScore",
  "killer",
  "cricket",
  "randomCheckout",
];

export const scoresPoints = (mode: Mode) => mode === "x01" || mode === "highScore";

export const isX01 = (settings: MatchSettings): settings is X01Settings => settings.mode === "x01";

type X01Of<T> = [Extract<T, { settings: X01Settings }>] extends [never]
  ? T & { settings: X01Settings }
  : Extract<T, { settings: X01Settings }>;

export const isX01Match = <T extends { settings: MatchSettings }>(match: T): match is X01Of<T> =>
  isX01(match.settings);

export function x01Only(state: MatchState): X01State {
  if (state.mode !== "x01") throw new Error(`expected an X01 match, got ${state.mode}`);
  return state;
}

export function storedSettings(stored: object): MatchSettings {
  return "mode" in stored ? (stored as MatchSettings) : ({ mode: "x01", ...stored } as X01Settings);
}

export type StateOf<S extends MatchSettings> = Extract<MatchState, { mode: S["mode"] }>;

export function matchState<S extends MatchSettings>(settings: S, events: MatchEvent[]): StateOf<S> {
  const s: MatchSettings = settings;
  switch (s.mode) {
    case "x01":
      return x01State(s, events) as StateOf<S>;
    case "aroundTheClock":
      return aroundTheClockState(s, events) as StateOf<S>;
    case "highScore":
      return highScoreState(s, events) as StateOf<S>;
    case "golf":
      return golfState(s, events) as StateOf<S>;
    case "killer":
      return killerState(s, events) as StateOf<S>;
    case "cricket":
      return cricketState(s, events) as StateOf<S>;
    case "randomCheckout":
      return randomCheckoutState(s, events) as StateOf<S>;
  }
}

export function closedVisits(state: MatchState): VisitView[] {
  return state.mode === "x01" ? state.legs.flatMap((leg) => leg.visits) : state.visits;
}

export function allVisits(state: MatchState): VisitView[] {
  return [...closedVisits(state), ...(state.currentVisit ? [state.currentVisit] : [])];
}

export function upNext(state: MatchState): PlayerIndex {
  if (state.mode !== "x01") return state.upNext;
  const leg = state.legs.at(-1);
  const after = state.currentVisit?.checkout && leg ? leg.starter : state.currentPlayer;
  return (after + 1) % Math.max(1, state.players.length);
}

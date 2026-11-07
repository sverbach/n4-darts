// X01 rules as a pure fold over a match's event log (docs/adr/0002, 0003).

import {
  type MatchEvent,
  type Phase,
  type PlayerIndex,
  type RawVisit,
  type Segment,
  started,
  type VisitView,
} from "./events.ts";

/** Bumped whenever the rules change, so old matches replay under the rules they were played with. */
export const RULES_VERSION = 1;

export type InRule = "straight" | "double" | "master" | "bull";
export type OutRule = "straight" | "double" | "master";

export interface X01Settings {
  mode: "x01";
  startScore: number;
  inRule: InRule;
  outRule: OutRule;
  legsToWin: number;
  rulesVersion: number;
}

export const defaultX01Settings: X01Settings = {
  mode: "x01",
  startScore: 301,
  inRule: "straight",
  outRule: "straight",
  legsToWin: 1,
  rulesVersion: RULES_VERSION,
};

export interface PlayerState {
  remaining: number;
  legsWon: number;
  /** Whether the in rule has been met this leg. */
  isIn: boolean;
}

export interface LegView {
  starter: PlayerIndex;
  /** Closed visits, in order. The visit in progress is `MatchState.currentVisit`. */
  visits: VisitView[];
  winner: PlayerIndex | null;
}

export interface X01State {
  mode: "x01";
  phase: Phase;
  /** One entry per player, in throwing order. */
  players: PlayerState[];
  currentPlayer: PlayerIndex;
  /** The visit in progress, until takeout. */
  currentVisit: VisitView | null;
  legs: LegView[];
  winner: PlayerIndex | null;
}

export function x01State(settings: X01Settings, events: MatchEvent[]): X01State {
  if (settings.rulesVersion !== RULES_VERSION) {
    throw new Error(`unknown X01 rules version ${settings.rulesVersion}`);
  }
  const match = started(events);
  const inFromStart = settings.inRule === "straight";
  const player = (): PlayerState => ({
    remaining: settings.startScore,
    legsWon: 0,
    isIn: inFromStart,
  });
  if (!match) {
    return {
      mode: "x01",
      phase: "notStarted",
      players: [],
      currentPlayer: 0,
      currentVisit: null,
      legs: [],
      winner: null,
    };
  }
  const count = match.playerCount;
  const players = Array.from({ length: count }, player);
  const next = (p: PlayerIndex): PlayerIndex => (p + 1) % count;

  let currentPlayer: PlayerIndex = 0;
  let leg: LegView = { starter: currentPlayer, visits: [], winner: null };
  const legs = [leg];
  let currentVisit: VisitView | null = null;
  let visitOver = false;
  let winner: PlayerIndex | null = null;
  for (const raw of match.visits) {
    const thrower = players[currentPlayer] as PlayerState;
    const visit = scoreVisit(raw, currentPlayer, thrower, settings);
    thrower.remaining = visit.remainingAfter;
    thrower.isIn = visit.isInAfter;
    visitOver = visit.over;
    if (visit.checkout) {
      thrower.legsWon += 1;
      leg.winner = currentPlayer;
      if (thrower.legsWon >= settings.legsToWin) winner = currentPlayer;
    }
    if (!raw.closed) {
      currentVisit = visit.view;
      continue;
    }

    leg.visits.push(visit.view);
    currentVisit = null;
    visitOver = false;
    if (winner !== null) break;
    if (leg.winner !== null) {
      for (const p of players) {
        p.remaining = settings.startScore;
        p.isIn = inFromStart;
      }
      leg = { starter: next(leg.starter), visits: [], winner: null };
      legs.push(leg);
      currentPlayer = leg.starter;
    } else {
      currentPlayer = next(currentPlayer);
    }
  }

  const phase: Phase = winner !== null ? "matchWon" : visitOver ? "awaitingTakeout" : "throwing";
  return { mode: "x01", phase, players, currentPlayer, currentVisit, legs, winner };
}

function getsIn(dart: Segment, inRule: InRule): boolean {
  switch (inRule) {
    case "straight":
      return true;
    case "double":
      return dart.multiplier === 2;
    case "master":
      return dart.multiplier >= 2;
    case "bull":
      return dart.number === 25 && dart.multiplier > 0;
  }
}

/** Multipliers a leg may be finished with; anything else reaching zero is a bust. */
const finishingMultipliers: Record<OutRule, readonly number[]> = {
  straight: [1, 2, 3],
  double: [2],
  master: [2, 3],
};

export function isBust(remaining: number, lastDart: Segment, outRule: OutRule): boolean {
  if (remaining < 0) return true;
  // With double or master out, 1 can never be finished.
  if (remaining === 1 && outRule !== "straight") return true;
  return remaining === 0 && !finishingMultipliers[outRule].includes(lastDart.multiplier);
}

function scoreVisit(
  raw: RawVisit,
  player: PlayerIndex,
  before: PlayerState,
  settings: X01Settings,
) {
  const view: VisitView = { player, darts: [], bust: false, checkout: false };
  let remaining = before.remaining;
  let isIn = before.isIn;
  let over = false;
  for (const { dartId, segment } of raw.darts) {
    if (over) {
      view.darts.push({ dartId, segment, score: 0, ignored: true });
      continue;
    }
    isIn ||= getsIn(segment, settings.inRule);
    const score = isIn ? segment.number * segment.multiplier : 0;
    view.darts.push({ dartId, segment, score, ignored: false });
    remaining -= score;
    if (isBust(remaining, segment, settings.outRule)) {
      view.bust = true;
      remaining = before.remaining;
      isIn = before.isIn;
    } else if (remaining === 0) {
      view.checkout = true;
    }
    over = view.bust || view.checkout || view.darts.length === 3;
  }
  return { view, remainingAfter: remaining, isInAfter: isIn, over, checkout: view.checkout };
}

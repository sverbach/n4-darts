// X01 rules as a pure fold over a match's event log (docs/adr/0002, 0003).

export type PlayerIndex = 0 | 1;

/** Where a dart landed: the bullseye is `{ number: 25, multiplier: 2 }`, a miss has multiplier 0. */
export interface Segment {
  number: number;
  multiplier: 0 | 1 | 2 | 3;
}

export type InRule = "straight" | "double" | "master" | "bull";
export type OutRule = "straight" | "double" | "master";

export interface X01Settings {
  startScore: number;
  inRule: InRule;
  outRule: OutRule;
  legsToWin: number;
}

export const defaultX01Settings: X01Settings = {
  startScore: 301,
  inRule: "straight",
  outRule: "straight",
  legsToWin: 1,
};

export type MatchEvent =
  | { type: "MatchStarted"; firstPlayer: PlayerIndex }
  | { type: "DartThrown"; dartId: string; segment: Segment }
  | { type: "DartCorrected"; dartId: string; segment: Segment }
  | { type: "TakeoutFinished" }
  | { type: "VisitEndedManually" }
  | { type: "VisitUndone" };

export interface PlayerState {
  remaining: number;
  legsWon: number;
  /** Whether the in rule has been met this leg. */
  isIn: boolean;
}

export type Phase = "notStarted" | "throwing" | "awaitingTakeout" | "matchWon";

export interface DartView {
  dartId: string;
  segment: Segment;
  score: number;
  /** Thrown after the visit was already over (third dart, bust or checkout); counts for nothing. */
  ignored: boolean;
}

export interface VisitView {
  player: PlayerIndex;
  darts: DartView[];
  /** Went below zero (or broke the out rule): the visit scores nothing. */
  bust: boolean;
  /** Finished the leg. */
  checkout: boolean;
}

export interface LegView {
  starter: PlayerIndex;
  /** Closed visits, in order. The visit in progress is `MatchState.currentVisit`. */
  visits: VisitView[];
  winner: PlayerIndex | null;
}

export interface MatchState {
  phase: Phase;
  players: [PlayerState, PlayerState];
  currentPlayer: PlayerIndex;
  /** The visit in progress, until takeout. */
  currentVisit: VisitView | null;
  legs: LegView[];
  winner: PlayerIndex | null;
}

interface RawVisit {
  darts: { dartId: string; segment: Segment }[];
  /** Ended by takeout or manually; only the last visit can be open. */
  closed: boolean;
}

/** Groups the event log into visits, independent of scoring. Corrections replace segments in place. */
function visitsOf(events: MatchEvent[]): RawVisit[] {
  const corrected = new Map<string, Segment>();
  for (const event of events) {
    if (event.type === "DartCorrected") corrected.set(event.dartId, event.segment);
  }

  const visits: RawVisit[] = [];
  const open = () => {
    const last = visits.at(-1);
    if (last && !last.closed) return last;
    const visit: RawVisit = { darts: [], closed: false };
    visits.push(visit);
    return visit;
  };
  for (const event of events) {
    switch (event.type) {
      case "DartThrown":
        open().darts.push({
          dartId: event.dartId,
          segment: corrected.get(event.dartId) ?? event.segment,
        });
        break;
      case "TakeoutFinished":
      case "VisitEndedManually":
        open().closed = true;
        break;
      case "VisitUndone":
        // Drops the visit in progress if it has darts, otherwise the last finished one.
        visits.pop();
        break;
    }
  }
  return visits;
}

const other = (player: PlayerIndex): PlayerIndex => (player === 0 ? 1 : 0);

export function matchState(settings: X01Settings, events: MatchEvent[]): MatchState {
  const startIndex = events.findIndex((e) => e.type === "MatchStarted");
  const started = events[startIndex];
  const inFromStart = settings.inRule === "straight";
  const player = (): PlayerState => ({
    remaining: settings.startScore,
    legsWon: 0,
    isIn: inFromStart,
  });
  const players: [PlayerState, PlayerState] = [player(), player()];
  if (started?.type !== "MatchStarted") {
    return {
      phase: "notStarted",
      players,
      currentPlayer: 0,
      currentVisit: null,
      legs: [],
      winner: null,
    };
  }

  let currentPlayer = started.firstPlayer;
  let leg: LegView = { starter: currentPlayer, visits: [], winner: null };
  const legs = [leg];
  let currentVisit: VisitView | null = null;
  let visitOver = false;
  let winner: PlayerIndex | null = null;
  for (const raw of visitsOf(events.slice(startIndex + 1))) {
    const thrower = players[currentPlayer];
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
      leg = { starter: other(leg.starter), visits: [], winner: null };
      legs.push(leg);
      currentPlayer = leg.starter;
    } else {
      currentPlayer = other(currentPlayer);
    }
  }

  const phase: Phase = winner !== null ? "matchWon" : visitOver ? "awaitingTakeout" : "throwing";
  return { phase, players, currentPlayer, currentVisit, legs, winner };
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

function isBust(remaining: number, lastDart: Segment, outRule: OutRule): boolean {
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

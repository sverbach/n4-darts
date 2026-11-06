/** A player's place in the match's throwing order; player 0 throws first. */
export type PlayerIndex = number;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

/**
 * Where a dart landed: the bullseye is `{ number: 25, multiplier: 2 }`. A miss has multiplier 0
 * and the number of the segment it landed next to, or 0 for a bounce-out
 * (docs/board-manager-api.md).
 */
export interface Segment {
  number: number;
  multiplier: 0 | 1 | 2 | 3;
}

const isWhole = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

/** Whether a value from outside (a request body) is a segment a dart can land in. */
export function isSegment(value: unknown): value is Segment {
  const { number, multiplier } = (value ?? {}) as Partial<Segment>;
  if (multiplier === 0) return isWhole(number, 0, 20);
  if (number === 25) return multiplier === 1 || multiplier === 2;
  return isWhole(number, 1, 20) && isWhole(multiplier, 1, 3);
}

export type MatchEvent =
  | { type: "MatchStarted"; playerCount: number; numbers?: number[] }
  | { type: "DartThrown"; dartId: string; segment: Segment }
  | { type: "DartCorrected"; dartId: string; segment: Segment }
  | { type: "TakeoutFinished" }
  | { type: "VisitEndedManually" }
  | { type: "VisitUndone" };

export type Phase = "notStarted" | "throwing" | "awaitingTakeout" | "matchWon";

export interface DartView {
  dartId: string;
  segment: Segment;
  score: number;
  /** Thrown after the visit was already over; counts for nothing. */
  ignored: boolean;
}

export interface VisitView {
  player: PlayerIndex;
  darts: DartView[];
  /** X01 only: went below zero (or broke the out rule), so the visit scores nothing. */
  bust: boolean;
  /** X01 only: finished the leg. */
  checkout: boolean;
}

export interface RawVisit {
  darts: { dartId: string; segment: Segment }[];
  /** Ended by takeout or manually; only the last visit can be open. */
  closed: boolean;
}

/** Groups the event log into visits, independent of scoring. Corrections replace segments in place. */
export function visitsOf(events: MatchEvent[]): RawVisit[] {
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

export function started(
  events: MatchEvent[],
): { playerCount: number; numbers: number[] | undefined; visits: RawVisit[] } | null {
  const startIndex = events.findIndex((e) => e.type === "MatchStarted");
  const start = events[startIndex];
  if (start?.type !== "MatchStarted") return null;
  const count = start.playerCount;
  if (!Number.isInteger(count) || count < MIN_PLAYERS || count > MAX_PLAYERS) {
    throw new Error(`a match needs ${MIN_PLAYERS}–${MAX_PLAYERS} players, got ${count}`);
  }
  return {
    playerCount: count,
    numbers: start.numbers,
    visits: visitsOf(events.slice(startIndex + 1)),
  };
}

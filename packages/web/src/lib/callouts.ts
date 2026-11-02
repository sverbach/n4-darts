import type { MatchState, VisitView } from "@n4/engine";

export type CallKey = string;

export const CALL_KEYS: readonly CallKey[] = [
  ...Array.from({ length: 181 }, (_, n) => String(n)),
  "gameshot",
  "matchshot",
  "busted",
];

function closedVisits(state: MatchState): VisitView[] {
  return state.legs.flatMap((leg) => leg.visits);
}

function outcome(visit: VisitView, state: MatchState): CallKey | null {
  if (visit.bust) return "busted";
  if (visit.checkout) return state.winner === null ? "gameshot" : "matchshot";
  return null;
}

function visitScore(visit: VisitView): number {
  return visit.darts.reduce((sum, dart) => sum + (dart.ignored ? 0 : dart.score), 0);
}

export function callsFor(prev: MatchState | null, next: MatchState): CallKey[] {
  if (!prev || prev.phase === "notStarted") return [];
  const before = closedVisits(prev);
  const after = closedVisits(next);
  const prevOutcome = prev.currentVisit ? outcome(prev.currentVisit, prev) : null;

  if (after.length === before.length + 1) {
    const visit = after.at(-1) as VisitView;
    const key = outcome(visit, next);
    if (key === null) return [String(visitScore(visit))];
    return key === prevOutcome ? [] : [key];
  }

  if (after.length !== before.length || !next.currentVisit) return [];
  const thrown = next.currentVisit.darts.length > (prev.currentVisit?.darts.length ?? 0);
  const key = outcome(next.currentVisit, next);
  return thrown && key !== null && key !== prevOutcome ? [key] : [];
}

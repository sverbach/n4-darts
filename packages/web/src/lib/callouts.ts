import { closedVisits, type MatchState, type VisitView, type X01State } from "@n4/engine";

export type CallKey = string;

export const CALL_KEYS: readonly CallKey[] = [
  ...Array.from({ length: 181 }, (_, n) => String(n)),
  "gameshot",
  "matchshot",
  "busted",
];

function outcome(visit: VisitView, state: X01State): CallKey | null {
  if (visit.bust) return "busted";
  if (visit.checkout) return state.winner === null ? "gameshot" : "matchshot";
  return null;
}

function visitScore(visit: VisitView): number {
  return visit.darts.reduce((sum, dart) => sum + (dart.ignored ? 0 : dart.score), 0);
}

function openCall(visit: VisitView, state: X01State): CallKey | null {
  const counted = visit.darts.filter((dart) => !dart.ignored).length;
  return outcome(visit, state) ?? (counted === 3 ? String(visitScore(visit)) : null);
}

export function callsFor(prev: MatchState | null, next: MatchState): CallKey[] {
  if (!prev || prev.phase === "notStarted") return [];
  if (prev.mode !== "x01" || next.mode !== "x01") {
    return prev.winner === null && next.winner !== null ? ["matchshot"] : [];
  }
  const before = closedVisits(prev);
  const after = closedVisits(next);
  const called = prev.currentVisit ? openCall(prev.currentVisit, prev) : null;

  if (after.length === before.length + 1) {
    const visit = after.at(-1) as VisitView;
    const key = outcome(visit, next) ?? String(visitScore(visit));
    return key === called ? [] : [key];
  }

  if (after.length !== before.length || !next.currentVisit) return [];
  const key = openCall(next.currentVisit, next);
  return key !== null && key !== called ? [key] : [];
}

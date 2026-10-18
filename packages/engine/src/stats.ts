// Points and darts per player, the raw material for 3-dart averages (ratings, group tables).

import { type MatchEvent, matchState, type X01Settings } from "./x01.ts";

export interface DartStats {
  points: number;
  darts: number;
}

/**
 * Per player, in throwing order. Busts count their darts for zero points; darts thrown after a
 * visit was over don't count; corrections apply.
 */
export function dartStats(settings: X01Settings, events: MatchEvent[]): DartStats[] {
  const state = matchState(settings, events);
  const totals = state.players.map(() => ({ points: 0, darts: 0 }));
  const visits = state.legs.flatMap((leg) => leg.visits);
  if (state.currentVisit) visits.push(state.currentVisit);
  for (const visit of visits) {
    const total = totals[visit.player];
    if (!total) continue;
    const counted = visit.darts.filter((d) => !d.ignored);
    total.darts += counted.length;
    if (!visit.bust) total.points += counted.reduce((sum, d) => sum + d.score, 0);
  }
  return totals;
}

/** Points per dart × 3 over all the given stats; null when there are no darts. */
export function threeDartAverage(stats: DartStats[]): number | null {
  const darts = stats.reduce((sum, s) => sum + s.darts, 0);
  if (darts === 0) return null;
  return (stats.reduce((sum, s) => sum + s.points, 0) / darts) * 3;
}

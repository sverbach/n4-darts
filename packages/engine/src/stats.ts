// Points and darts per player, the raw material for 3-dart averages (ratings, group tables).

import {
  type MatchEvent,
  type MatchState,
  matchState,
  type Segment,
  type X01Settings,
} from "./x01.ts";

export interface DartStats {
  points: number;
  darts: number;
}

/**
 * Per player, in throwing order. Busts count their darts for zero points; darts thrown after a
 * visit was over don't count; corrections apply.
 */
export function dartStats(settings: X01Settings, events: MatchEvent[]): DartStats[] {
  return stateDartStats(matchState(settings, events));
}

/** `dartStats` from a match state, for the UI, which has the state but not the events. */
export function stateDartStats(state: MatchState): DartStats[] {
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

/** The checkout that won the match: the finishing dart and the score it finished from. */
export function winningCheckout(state: MatchState): { segment: Segment; points: number } | null {
  if (state.winner === null) return null;
  const visit = state.currentVisit?.checkout
    ? state.currentVisit
    : state.legs.at(-1)?.visits.findLast((v) => v.checkout);
  const counted = visit?.darts.filter((d) => !d.ignored) ?? [];
  const last = counted.at(-1);
  if (!last) return null;
  return { segment: last.segment, points: counted.reduce((sum, d) => sum + d.score, 0) };
}

/** Points per dart × 3 over all the given stats; null when there are no darts. */
export function threeDartAverage(stats: DartStats[]): number | null {
  const darts = stats.reduce((sum, s) => sum + s.darts, 0);
  if (darts === 0) return null;
  return (stats.reduce((sum, s) => sum + s.points, 0) / darts) * 3;
}

/** One player's numbers in one match, for long-term stats. */
export interface PlayerMatchStats extends DartStats {
  /** Darts and points of the first three visits of every leg. */
  first9: DartStats;
  /** Darts thrown at a one-dart finish, and how many of them finished; double-out only. */
  checkoutAttempts: number;
  checkoutHits: number;
  highestCheckout: number | null;
  /** Visits of 180, of 140–179 and of 100–139. */
  s180: number;
  s140: number;
  s100: number;
  legsPlayed: number;
  legsWon: number;
  /** Fewest darts in a leg the player won. */
  bestLeg: number | null;
  won: boolean;
}

/** Whether one dart can finish from `remaining` with double out: a double or the bullseye. */
const oneDartFinish = (remaining: number) =>
  remaining === 50 || (remaining >= 2 && remaining <= 40 && remaining % 2 === 0);

/** Per player, in throwing order; counted the same way as `dartStats`. */
export function matchStats(settings: X01Settings, events: MatchEvent[]): PlayerMatchStats[] {
  const state = matchState(settings, events);
  const stats: PlayerMatchStats[] = state.players.map((_, p) => ({
    points: 0,
    darts: 0,
    first9: { points: 0, darts: 0 },
    checkoutAttempts: 0,
    checkoutHits: 0,
    highestCheckout: null,
    s180: 0,
    s140: 0,
    s100: 0,
    legsPlayed: 0,
    legsWon: 0,
    bestLeg: null,
    won: state.winner === p,
  }));
  const doubleOut = settings.outRule === "double";

  state.legs.forEach((leg, l) => {
    // The last visit stays open until takeout, also after the match-winning checkout.
    const visits =
      l === state.legs.length - 1 && state.currentVisit
        ? [...leg.visits, state.currentVisit]
        : leg.visits;
    const remaining = stats.map(() => settings.startScore);
    const visitsSoFar = stats.map(() => 0);
    const legDarts = stats.map(() => 0);
    for (const visit of visits) {
      const s = stats[visit.player];
      if (!s) continue;
      const counted = visit.darts.filter((d) => !d.ignored);
      const total = visit.bust ? 0 : counted.reduce((sum, d) => sum + d.score, 0);
      s.darts += counted.length;
      s.points += total;
      legDarts[visit.player] = (legDarts[visit.player] ?? 0) + counted.length;
      visitsSoFar[visit.player] = (visitsSoFar[visit.player] ?? 0) + 1;
      if ((visitsSoFar[visit.player] ?? 0) <= 3) {
        s.first9.darts += counted.length;
        s.first9.points += total;
      }
      if (total === 180) s.s180 += 1;
      else if (total >= 140) s.s140 += 1;
      else if (total >= 100) s.s100 += 1;

      let left = remaining[visit.player] ?? settings.startScore;
      for (const dart of counted) {
        if (doubleOut && oneDartFinish(left)) {
          s.checkoutAttempts += 1;
          if (visit.checkout && left - dart.score === 0) s.checkoutHits += 1;
        }
        left -= dart.score;
      }
      if (!visit.bust) remaining[visit.player] = left;
      if (visit.checkout) {
        s.highestCheckout = Math.max(s.highestCheckout ?? 0, total);
      }
    }
    if (leg.winner === null) return;
    for (const s of stats) s.legsPlayed += 1;
    const winner = stats[leg.winner];
    if (!winner) return;
    winner.legsWon += 1;
    const darts = legDarts[leg.winner] ?? 0;
    winner.bestLeg = winner.bestLeg === null ? darts : Math.min(winner.bestLeg, darts);
  });
  return stats;
}

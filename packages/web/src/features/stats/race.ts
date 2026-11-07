import type { X01State } from "@n4/engine";

export interface RacePoint {
  round: number;
  left: number;
  scored: number | null;
  bust: boolean;
}

export interface RaceSeries {
  player: number;
  points: RacePoint[];
}

export function raceOf(state: X01State, leg: number, startScore: number, players: number) {
  const own = state.legs[leg];
  if (!own) return [];
  const visits =
    leg === state.legs.length - 1 && state.currentVisit
      ? [...own.visits, state.currentVisit]
      : own.visits;
  const series: RaceSeries[] = Array.from({ length: players }, (_, player) => ({
    player,
    points: [{ round: 0, left: startScore, scored: null, bust: false }],
  }));
  for (const visit of visits) {
    const line = series[visit.player];
    if (!line) continue;
    const before = line.points.at(-1) as RacePoint;
    const scored = visit.bust
      ? 0
      : visit.darts.reduce((sum, d) => sum + (d.ignored ? 0 : d.score), 0);
    line.points.push({
      round: before.round + 1,
      left: before.left - scored,
      scored,
      bust: visit.bust,
    });
  }
  return series;
}

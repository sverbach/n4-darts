// How long a tournament will take (.scratch/tournaments/spec.md: "Duration estimate").

import { matchState } from "@n4/engine";
import type { Db, MatchRecord } from "./db.ts";
import type { TournamentConfig } from "./tournament/types.ts";

/** Minutes per leg before there's history, by start score. */
const DEFAULT_LEG_MINUTES: Record<number, number> = { 301: 4, 501: 6, 701: 8 };
/** Recorded legs needed at a start score before their average replaces the default. */
export const LEGS_FOR_HISTORY = 5;
const CHANGEOVER_MINUTES = 1;
/** Legs longer than this are interruptions, not play. */
const MAX_LEG_MINUTES = 30;

export const defaultLegMinutes = (startScore: number) =>
  DEFAULT_LEG_MINUTES[startScore] ?? Math.max(2, Math.round((startScore / 301) * 4));

/** How many recent matches the leg length is averaged over. */
export const MATCHES_FOR_LEG_MINUTES = 50;

/** How long each leg of a finished match took, in minutes: from the start or the previous checkout. */
function measureLegs(db: Db, match: MatchRecord): number[] {
  const timed = db.timedEvents(match.id);
  const at = new Map<string, number>();
  let started: number | null = null;
  for (const { at: when, event } of timed) {
    if (event.type === "MatchStarted") started = Date.parse(when);
    if (event.type === "DartThrown") at.set(event.dartId, Date.parse(when));
  }
  if (started === null) return [];
  const state = matchState(
    match.settings,
    timed.map((t) => t.event),
  );
  const minutes: number[] = [];
  let legStart = started;
  for (const [i, leg] of state.legs.entries()) {
    // A match can end before the winning visit's takeout: then it's still the current visit.
    const visits =
      i === state.legs.length - 1 && state.currentVisit
        ? [...leg.visits, state.currentVisit]
        : leg.visits;
    const checkout = visits.find((v) => v.checkout);
    const lastDart = checkout?.darts.filter((d) => !d.ignored).at(-1);
    const end = lastDart && at.get(lastDart.dartId);
    if (!end) break;
    minutes.push((end - legStart) / 60_000);
    legStart = end;
  }
  return minutes;
}

/**
 * Durations in minutes of the legs played in the last 50 matches, where they were completed
 * two-player matches at this start score. Each match's legs are measured once and stored.
 */
export function legDurations(db: Db, startScore: number): number[] {
  const minutes: number[] = [];
  for (const match of db.closedMatches(MATCHES_FOR_LEG_MINUTES)) {
    if (match.abandoned || match.walkover || match.playerIds.length !== 2) continue;
    if (match.settings.startScore !== startScore) continue;
    let legs = match.legMinutes;
    if (legs === null) {
      legs = measureLegs(db, match);
      db.setLegMinutes(match.id, legs);
    }
    minutes.push(...legs.filter((length) => length > 0 && length <= MAX_LEG_MINUTES));
  }
  return minutes;
}

/** Average leg length from history once there's enough of it, otherwise the default. */
export function legMinutes(db: Db, startScore: number): number {
  const history = legDurations(db, startScore);
  if (history.length < LEGS_FOR_HISTORY) return defaultLegMinutes(startScore);
  return history.reduce((sum, m) => sum + m, 0) / history.length;
}

/** About 75% of the most legs a match can take, but never fewer than are needed to win. */
const expectedLegs = (legsToWin: number) => Math.max(legsToWin, 0.75 * (2 * legsToWin - 1));

/** Expected minutes for one match, changeover included. */
export const matchMinutes = (legsToWin: number, minutesPerLeg: number) =>
  expectedLegs(legsToWin) * minutesPerLeg + CHANGEOVER_MINUTES;

/** Minutes for the whole tournament, double elimination counted with the bracket reset. */
export function estimateMinutes(
  config: TournamentConfig,
  playerCount: number,
  minutesPerLeg: number,
  stations: number,
): number {
  const { groups, advancePerGroup, elimination } = config.format;
  const sizes = Array.from(
    { length: groups },
    (_, g) => Math.floor(playerCount / groups) + (g < playerCount % groups ? 1 : 0),
  );
  const groupMatches = sizes.reduce((sum, n) => sum + (n * (n - 1)) / 2, 0);
  const advancing =
    advancePerGroup === null ? playerCount : Math.min(playerCount, groups * advancePerGroup);
  const legs = config.legs;
  const counts: [number, number][] =
    elimination === "single"
      ? [
          [groupMatches, legs.groups],
          [Math.max(0, advancing - 2), legs.winners],
          [advancing > 1 ? 1 : 0, legs.final],
        ]
      : [
          [groupMatches, legs.groups],
          [Math.max(0, advancing - 1), legs.winners],
          [Math.max(0, advancing - 2), legs.losers],
          [advancing > 1 ? 2 : 0, legs.final],
        ];
  const total = counts.reduce(
    (sum, [matches, legsToWin]) => sum + matches * matchMinutes(legsToWin, minutesPerLeg),
    0,
  );
  return total / Math.max(1, stations);
}

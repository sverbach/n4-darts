// Fills a database with past matches, for tests that need a realistic history (perf-tests).

import {
  checkoutRoute,
  defaultX01Settings,
  type MatchEvent,
  matchState,
  type Segment,
} from "@n4/engine";
import type { Db } from "./db.ts";

/** A visit when no checkout is on: 66, so a 501 leg takes about 9 visits a player. */
const PATTERN: Segment[] = [
  { number: 20, multiplier: 3 },
  { number: 5, multiplier: 1 },
  { number: 1, multiplier: 1 },
];
/** How long a visit takes, takeout included. */
const VISIT_MS = 30_000;

export interface SeedOptions {
  /** How many finished matches to add. */
  matches: number;
  /** Two of them play each match, taking turns. */
  playerIds: string[];
  startScore?: number;
  legsToWin?: number;
  /** When the first match starts; the others follow one after another. */
  from?: Date;
}

/**
 * Adds finished two-player matches, played to the end with darts that go for the checkout when
 * there is one, at a visit every 30 seconds. Returns when the last one ended.
 */
export function seedHistory(db: Db, options: SeedOptions): Date {
  const { matches, playerIds } = options;
  const settings = {
    ...defaultX01Settings,
    startScore: options.startScore ?? 501,
    outRule: "double" as const,
    legsToWin: options.legsToWin ?? 2,
  };
  let now = (options.from ?? new Date("2026-01-01T19:00:00.000Z")).getTime();
  for (let m = 0; m < matches; m++) {
    const id = `seed-${m}`;
    const pair = [playerIds[m % playerIds.length], playerIds[(m + 1) % playerIds.length]];
    db.createMatch({ id, station: null, settings, playerIds: pair as string[] });
    const events: MatchEvent[] = [];
    const log = (event: MatchEvent) => {
      events.push(event);
      db.append(id, event, new Date(now).toISOString());
    };
    log({ type: "MatchStarted", playerCount: 2 });
    let state = matchState(settings, events);
    for (let dart = 0; state.phase !== "matchWon"; dart++) {
      if (state.phase === "awaitingTakeout") {
        now += VISIT_MS;
        log({ type: "TakeoutFinished" });
      } else {
        const thrower = state.players[state.currentPlayer];
        const thrown = state.currentVisit?.darts.length ?? 0;
        const route = thrower && checkoutRoute(thrower.remaining, 3 - thrown, settings.outRule);
        log({
          type: "DartThrown",
          dartId: `${id}-${dart}`,
          segment: route?.[0] ?? (PATTERN[thrown] as Segment),
        });
      }
      state = matchState(settings, events);
    }
    db.setWinner(id, pair[state.winner ?? 0] ?? null);
    db.closeMatch(id);
    now += VISIT_MS;
  }
  return new Date(now);
}

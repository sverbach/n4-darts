// The organiser creates matches in /admin and puts them on a free station; the station then runs
// the match exactly like a quick match. /admin lists the history; a finished match has its page.
// The routes are in matchesRoutes.ts.

import { isX01Match, type MatchState, matchState, matchStats, x01Only } from "@n4/engine";
import type { MatchPage, MatchSummary } from "../api.ts";
import type { Db, MatchRecord, X01MatchRecord } from "../db.ts";
import { matchPlayer } from "../players/players.ts";
import { landedDarts } from "../stats/stats.ts";

/** Why a request about a match was refused. */
export class MatchError extends Error {
  readonly reason: "missing" | "refused";
  constructor(message: string, reason: "missing" | "refused") {
    super(message);
    this.reason = reason;
  }
}

const legsWon = (match: MatchRecord, state: MatchState) =>
  match.playerIds.map((_, i) =>
    state.mode === "x01" ? (state.players[i]?.legsWon ?? 0) : state.winner === i ? 1 : 0,
  );

export function createMatches(db: Db) {
  function summary(match: X01MatchRecord, state: MatchState): MatchSummary {
    return {
      id: match.id,
      station: match.station,
      players: match.playerIds.map((id) => matchPlayer(db, id)),
      settings: match.settings,
      winner: match.winner,
      abandoned: match.abandoned,
      walkover: match.walkover,
      closedAt: match.closedAt,
      legsWon: legsWon(match, state),
    };
  }

  return {
    /** Closed matches, newest first. */
    history: () =>
      db
        .closedMatches()
        .map((match) => summary(match, matchState(match.settings, db.events(match.id)))),

    /** A finished match, played to its end: not abandoned, not a walkover. */
    page(id: string): MatchPage {
      const match = db.getMatch(id);
      if (!match?.closedAt || match.abandoned || match.walkover || !isX01Match(match)) {
        throw new MatchError("no such match", "missing");
      }
      const events = db.events(id);
      const {
        station: _,
        walkover: __,
        ...rest
      } = summary(match, matchState(match.settings, events));
      return {
        ...rest,
        state: x01Only(matchState(match.settings, events)),
        stats: matchStats(match.settings, events),
        landed: landedDarts(match, events),
      };
    },
  };
}

export type Matches = ReturnType<typeof createMatches>;

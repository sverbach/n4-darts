// The organiser creates matches in /admin and puts them on a free station; the station then runs
// the match exactly like a quick match. /admin also shows the history and can correct any dart of
// any match (docs/adr/0002: the correction is appended, the original detection stays in the log).
// The routes are in matchesRoutes.ts.

import { isSegment, matchState, type Segment } from "@n4/engine";
import type { MatchDetail, MatchSummary } from "../api.ts";
import type { Db, MatchRecord, StoredEvent } from "../db.ts";
import { matchPlayer } from "../players/players.ts";
import type { StationDirectory } from "../stations/stations.ts";

/**
 * A say over a stored result changing, for whatever builds on results (a tournament: TOUR-14).
 * Matches asks it without knowing who answers.
 */
export interface ResultGuard {
  /** Why a correction can't be made, or null if it can; asked with the log it would leave. */
  problem(match: MatchRecord, events: StoredEvent[]): string | null;
  /** Told once a correction has been stored. */
  changed(match: MatchRecord): void;
}

/** Why a request about a match was refused. */
export class MatchError extends Error {
  readonly reason: "invalid" | "missing" | "refused";
  constructor(message: string, reason: "invalid" | "missing" | "refused") {
    super(message);
    this.reason = reason;
  }
}

export function createMatches(db: Db, stations: StationDirectory, guard?: ResultGuard) {
  /** The station currently running this match, if any. */
  const stationOf = (matchId: string) =>
    stations.list().find((s) => s.view().match?.id === matchId);

  function detail(match: MatchRecord, events: StoredEvent[]): MatchDetail {
    const state = matchState(match.settings, events);
    const originals: Record<string, Segment> = {};
    for (const event of events) {
      if (event.type === "DartThrown") originals[event.dartId] = event.segment;
    }
    // Keep only the darts whose segment changed since detection.
    const corrected = new Set(
      events.flatMap((e) => (e.type === "DartCorrected" ? [e.dartId] : [])),
    );
    for (const dartId of Object.keys(originals)) {
      if (!corrected.has(dartId)) delete originals[dartId];
    }
    const added = events.flatMap((e) =>
      e.type === "DartThrown" && e.source === "manual" ? [e.dartId] : [],
    );
    return {
      id: match.id,
      station: match.station,
      players: match.playerIds.map((id) => matchPlayer(db, id)),
      settings: match.settings,
      winner: match.winner,
      abandoned: match.abandoned,
      closedAt: match.closedAt,
      legsWon: match.playerIds.map((_, i) => state.players[i]?.legsWon ?? 0),
      state,
      originals,
      added,
    };
  }

  const summary = ({ state: _, originals: __, ...rest }: MatchDetail): MatchSummary => rest;

  function existing(id: string): MatchRecord {
    const match = db.getMatch(id);
    if (!match) throw new MatchError("no such match", "missing");
    return match;
  }

  return {
    /** Closed matches, newest first. */
    history: () => db.closedMatches().map((match) => summary(detail(match, db.events(match.id)))),

    detail(id: string): MatchDetail {
      const match = existing(id);
      return detail(match, db.events(match.id));
    },

    /** The match's detail as it changes; a match removed meanwhile keeps its last state. */
    follow(id: string): () => MatchDetail {
      let last = existing(id);
      return () => {
        last = db.getMatch(id) ?? last;
        return detail(last, db.events(id));
      };
    },

    /** Corrects a dart of a running or finished match; the result follows. */
    correct(id: string, dartId: unknown, segment: unknown): MatchDetail {
      const match = existing(id);
      if (!isSegment(segment)) throw new MatchError("not a valid segment", "invalid");
      const events = db.events(match.id);
      if (!events.some((e) => e.type === "DartThrown" && e.dartId === dartId)) {
        throw new MatchError("no such dart in this match", "missing");
      }

      const event: StoredEvent = {
        type: "DartCorrected",
        dartId: dartId as string,
        segment,
        source: "admin",
      };
      // The result may already have decided other things (a tournament's later matches).
      const problem = guard?.problem(match, [...events, event]);
      if (problem) throw new MatchError(problem, "refused");

      // A running match goes through its station, which keeps its own state and live viewers.
      const station = stationOf(match.id);
      if (station) {
        station.correct(dartId as string, segment, "admin");
      } else {
        db.append(match.id, event);
        // The stored result follows the log, also after the match was closed; an abandoned
        // match never gets one.
        const winner = match.abandoned
          ? null
          : matchState(match.settings, [...events, event]).winner;
        db.setWinner(match.id, winner === null ? null : (match.playerIds[winner] ?? null));
      }
      const updated = db.getMatch(match.id) as MatchRecord;
      guard?.changed(updated);
      return detail(updated, db.events(match.id));
    },
  };
}

export type Matches = ReturnType<typeof createMatches>;

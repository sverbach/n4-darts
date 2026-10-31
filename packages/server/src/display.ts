// What the projector shows (/display): the tournament with live station scores, or the stations.

import type { DisplayView, MatchView, ScoreCard, TournamentAdminView } from "./api.ts";
import type { Db } from "./db.ts";
import type { StationDirectory } from "./stations.ts";
import type { Stats } from "./stats.ts";

/** How many queued matches "Up next" lists. */
const UP_NEXT = 5;
/** How many players the idle display ranks. */
const LEADERBOARD = 10;

export function scoreCard(match: MatchView): ScoreCard {
  const { state, settings } = match;
  const on = state.phase === "throwing" || state.phase === "awaitingTakeout";
  return {
    matchId: match.id,
    label: match.label,
    players: match.players.map((p, i) => ({
      ...p,
      legsWon: state.players[i]?.legsWon ?? 0,
      remaining: state.players[i]?.remaining ?? settings.startScore,
    })),
    legsToWin: settings.legsToWin,
    startScore: settings.startScore,
    phase: state.phase,
    throwing: on ? state.currentPlayer : null,
    visit: on
      ? (state.currentVisit?.darts.map(({ segment, score, ignored }) => ({
          segment,
          score,
          ignored,
        })) ?? [])
      : [],
    winner: state.winner,
  };
}

export function displayView(
  db: Db,
  stations: StationDirectory,
  /** The tournament as /admin shows it, with its queue and awards. */
  admin: TournamentAdminView | undefined,
  stats?: Stats,
): DisplayView {
  const progress = admin?.tournament?.status === "draft" ? null : (admin?.progress ?? null);
  return {
    tournament:
      admin?.tournament && progress
        ? {
            name: admin.tournament.name,
            phase: progress.phase,
            played: progress.played,
            total: progress.total,
            endedEarly: progress.endedEarly,
          }
        : null,
    stations: [...stations.list()]
      .sort((a, b) => a.id - b.id)
      .map((station) => {
        const view = station.view();
        return {
          id: view.id,
          name: view.name,
          boardOnline: view.boardOnline,
          paused: progress !== null && progress.phase !== "finished" && db.isStationPaused(view.id),
          match: view.match ? scoreCard(view.match) : null,
        };
      }),
    upNext: (progress?.queue ?? []).slice(0, UP_NEXT).map((q) => ({
      label: q.label,
      players: q.players,
    })),
    groups: progress?.groups ?? [],
    bracket: progress?.bracket ?? [],
    placings: progress?.placings ?? null,
    awards: progress?.awards ?? null,
    leaderboard: progress || !stats ? [] : stats.leaderboard().slice(0, LEADERBOARD),
  };
}

// What the projector shows (/display): the tournament with live station scores, or the stations.

import { BULL, isX01Match } from "@n4/engine";
import type { DisplayView, MatchView, ScoreCard, TournamentAdminView } from "../api.ts";
import type { Db } from "../db.ts";
import type { StationDirectory } from "../stations/stations.ts";
import type { Stats } from "../stats/stats.ts";

/** How many queued matches "Up next" lists. */
const UP_NEXT = 5;
/** How many players the idle display ranks. */
const LEADERBOARD = 10;

export function upNextLabel(label: string) {
  return label.replace(/^Group match \d+$/, "").replace(/ · match \d+$/, "");
}

const targetLabel = (target: number | null | undefined) =>
  target === BULL ? "Bull" : target == null ? "" : String(target);

function scores(match: MatchView): { legsWon: number; score: string }[] {
  if (isX01Match(match)) {
    return match.players.map((_, i) => ({
      legsWon: match.state.players[i]?.legsWon ?? 0,
      score: String(match.state.players[i]?.remaining ?? match.settings.startScore),
    }));
  }
  if (match.state.mode === "cricket" || match.state.mode === "randomCheckout") {
    const { players } = match.state;
    return match.players.map((_, i) => ({ legsWon: 0, score: String(players[i]?.points ?? 0) }));
  }
  if (match.state.mode === "killer") {
    const { players } = match.state;
    return match.players.map((_, i) => {
      const lives = players[i]?.lives ?? 0;
      return {
        legsWon: 0,
        score: lives > 0 ? `${lives} ${lives === 1 ? "life" : "lives"}` : "Out",
      };
    });
  }
  if (
    match.state.mode === "highScore" ||
    match.state.mode === "golf" ||
    match.state.mode === "bermuda"
  ) {
    const { players } = match.state;
    return match.players.map((_, i) => ({ legsWon: 0, score: String(players[i]?.total ?? 0) }));
  }
  const { players } = match.state;
  return match.players.map((_, i) => ({ legsWon: 0, score: targetLabel(players[i]?.target ?? 1) }));
}

export function scoreCard(match: MatchView): ScoreCard {
  const { state } = match;
  const on = state.phase === "throwing" || state.phase === "awaitingTakeout";
  const own = scores(match);
  return {
    matchId: match.id,
    mode: match.settings.mode,
    label: match.label,
    players: match.players.map((p, i) => ({ ...p, ...(own[i] ?? { legsWon: 0, score: "" }) })),
    legsToWin: isX01Match(match) ? match.settings.legsToWin : 1,
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
      label: upNextLabel(q.label),
      players: q.players,
    })),
    groups: progress?.groups ?? [],
    bracket: progress?.bracket ?? [],
    placings: progress?.placings ?? null,
    awards: progress?.awards ?? null,
    leaderboard: progress || !stats ? [] : stats.leaderboard().slice(0, LEADERBOARD),
  };
}

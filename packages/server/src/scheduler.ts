// Puts tournament matches on stations by themselves (.scratch/tournaments/spec.md: "Scheduler"):
// a free, unpaused station gets the next ready match whose players are both free, pinned
// matches first, then queue order, then longest-rested. Everything is derived from the database
// on each run, so a restart just carries on.

import type { TournamentAdminView } from "./api.ts";
import type { Db, MatchRecord } from "./db.ts";
import { matchPlayer } from "./players.ts";
import type { StationDirectory } from "./stations.ts";
import type { Plan } from "./tournament/plan.ts";
import type { Tournaments } from "./tournaments.ts";

export const NO_MATCH_READY = "No tournament match ready (waiting for players)";
export const PAUSED = "Paused for the tournament";

export interface SchedulerOptions {
  /** A won tournament match frees its station after this long if nobody presses Done. */
  autoCloseMs?: number;
  /** Safety net: runs this often even when nothing announced a change. */
  tickMs?: number;
}

export interface QueuedMatch {
  match: MatchRecord;
  /** Both players free (not in another match on a station). */
  ready: boolean;
  /** Queue order from the plan: group rounds, then knockout rounds. */
  order: number;
}

/** A tournament's view with its queue filled in, while it runs; `plan` gives the order. */
export function withQueue(
  db: Db,
  view: TournamentAdminView,
  plan: Plan | null,
): TournamentAdminView {
  const { tournament, progress } = view;
  if (tournament?.status !== "running" || !progress) return view;
  const queue = queueOf(db, tournament.id, plan).map(({ match, ready }) => ({
    matchId: match.id,
    label: match.label ?? "",
    players: match.playerIds.map((id) => matchPlayer(db, id)),
    ready,
    held: match.held,
    pinnedStation: match.pinnedStation,
  }));
  return { ...view, progress: { ...progress, queue } };
}

/** Queued matches (no station) of a tournament in the order the scheduler will hand them out. */
export function queueOf(db: Db, tournamentId: string, plan: Plan | null): QueuedMatch[] {
  const orderOf = new Map(plan?.matches.map((m) => [m.slot, m.order]));
  const busy = db.busyPlayerIds();
  const lastClosed = db.lastClosedAt();
  // How long the less-rested player has rested: the later of their last matches.
  const restedSince = (match: MatchRecord) =>
    Math.max(...match.playerIds.map((p) => Date.parse(lastClosed.get(p) ?? "1970-01-01")));
  return db
    .tournamentMatches(tournamentId)
    .filter((m) => !m.closedAt && m.station === null)
    .map((match) => ({
      match,
      ready: !match.held && match.playerIds.every((p) => !busy.has(p)),
      order: orderOf.get(match.slot ?? "") ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.order - b.order || restedSince(a.match) - restedSince(b.match));
}

export function createScheduler(
  db: Db,
  stations: StationDirectory,
  tournaments: Tournaments,
  options: SchedulerOptions = {},
) {
  const autoCloseMs = options.autoCloseMs ?? 60_000;
  const subscribed = new Set<number>();
  const autoClose = new Map<number, { matchId: string; timer: ReturnType<typeof setTimeout> }>();
  let pending = false;
  let stopped = false;

  /** The running tournament's queue: matches without a station, in the order they'll go out. */
  function queue(): QueuedMatch[] {
    const tournament = db.activeTournament();
    if (tournament?.status !== "running") return [];
    return queueOf(db, tournament.id, tournaments.sync());
  }

  function run() {
    pending = false;
    if (stopped) return;
    for (const station of stations.list()) {
      if (subscribed.has(station.id)) continue;
      subscribed.add(station.id);
      station.subscribe(() => poke());
    }
    // The queue syncs the tournament first, which may finish it; check what's running after.
    const waiting = queue().filter((q) => q.ready);
    const running = db.activeTournament()?.status === "running";
    const taken = new Set<string>();

    for (const station of [...stations.list()].sort((a, b) => a.id - b.id)) {
      const view = station.view();
      watchForDone(station.id, view.match?.id ?? null, view.match?.state.phase === "matchWon");
      if (!running) {
        station.setNotice(null);
        continue;
      }
      if (db.isStationPaused(station.id)) {
        station.setNotice(PAUSED);
        continue;
      }
      if (view.match) continue;
      const fits = (q: QueuedMatch) =>
        !q.match.playerIds.some((p) => taken.has(p)) &&
        (q.match.pinnedStation === null || q.match.pinnedStation === station.id) &&
        !tournaments.avoids(q.match.id, station.id);
      const next =
        waiting.find((q) => fits(q) && q.match.pinnedStation === station.id) ?? waiting.find(fits);
      if (!next) {
        station.setNotice(NO_MATCH_READY);
        continue;
      }
      waiting.splice(waiting.indexOf(next), 1);
      for (const p of next.match.playerIds) taken.add(p);
      station.setNotice(null);
      station.take(next.match.id);
      tournaments.placed(next.match.id, station.id);
    }
  }

  /** A won tournament match closes by itself if nobody presses Done; an undo cancels that. */
  function watchForDone(stationId: number, matchId: string | null, won: boolean) {
    const current = autoClose.get(stationId);
    const isTournament = matchId !== null && db.getMatch(matchId)?.tournamentId != null;
    if (current && (current.matchId !== matchId || !won)) {
      clearTimeout(current.timer);
      autoClose.delete(stationId);
    }
    if (!won || !isTournament || autoClose.has(stationId) || matchId === null) return;
    const timer = setTimeout(() => {
      autoClose.delete(stationId);
      const station = stations.get(stationId);
      const view = station?.view();
      if (view?.match?.id === matchId && view.match.state.phase === "matchWon") {
        void station?.command({ type: "closeMatch" });
      }
    }, autoCloseMs);
    timer.unref?.();
    autoClose.set(stationId, { matchId, timer });
  }

  /** Runs soon, once, however many changes come in at the same time. */
  function poke() {
    if (pending || stopped) return;
    pending = true;
    setImmediate(run);
  }

  const unsubscribe = tournaments.subscribe(poke);
  const tick = setInterval(poke, options.tickMs ?? 2000);
  tick.unref?.();
  poke();

  return {
    poke,
    /** Runs straight away (tests, and right after an organiser's change). */
    run,
    queue,
    stop() {
      stopped = true;
      clearInterval(tick);
      unsubscribe();
      for (const { timer } of autoClose.values()) clearTimeout(timer);
      autoClose.clear();
    },
  };
}

export type Scheduler = ReturnType<typeof createScheduler>;

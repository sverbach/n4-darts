// The active tournament: setting it up in /admin (draft, seeds, groups, estimate) and starting
// it. Running it, matches and the scheduler, builds on this (.scratch/tournaments/spec.md).

import { randomUUID } from "node:crypto";
import { dartStats, defaultX01Settings, matchState, RULES_VERSION } from "@n4/engine";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { TournamentAdminView } from "./api.ts";
import type { Db, MatchRecord, StoredEvent, TournamentRecord } from "./db.ts";
import { estimateMinutes, legMinutes } from "./estimate.ts";
import type { ResultGuard } from "./matches.ts";
import { ratingOf } from "./ratings.ts";
import type { StationDirectory } from "./stations.ts";
import { snakeGroups } from "./tournament/groups.ts";
import { configProblems, type MatchPhase, type Plan, plan } from "./tournament/plan.ts";
import {
  defaultTournamentConfig,
  type Entrant,
  type Result,
  type TournamentConfig,
} from "./tournament/types.ts";
import { progressView } from "./tournamentView.ts";

export class TournamentError extends Error {
  readonly status: 400 | 404 | 409;
  constructor(message: string, status: 400 | 404 | 409 = 409) {
    super(message);
    this.status = status;
  }
}

export interface TournamentInput {
  name?: unknown;
  playerIds?: unknown;
  config?: unknown;
  /** Player ids in the organiser's seed order. */
  seedOrder?: unknown;
}

const today = () =>
  new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

/** Merges a partial config from a request onto the current one, section by section. */
function mergeConfig(current: TournamentConfig, input: unknown): TournamentConfig {
  const patch = (input ?? {}) as Partial<Record<keyof TournamentConfig, object>>;
  return {
    format: { ...current.format, ...patch.format },
    legs: { ...current.legs, ...patch.legs },
    x01: { ...current.x01, ...patch.x01 },
  };
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** A decided tournament match as the pure logic sees it. */
function resultOf(match: MatchRecord, events: ReturnType<Db["events"]>): Result | null {
  if (!match.closedAt || match.abandoned || !match.winner || !match.slot) return null;
  const [a, b] = match.playerIds as [string, string];
  if (match.walkover) {
    const legs = match.settings.legsToWin;
    return {
      slot: match.slot,
      players: [a, b],
      winner: match.winner,
      legs: match.winner === a ? [legs, 0] : [0, legs],
      walkover: true,
      stats: [
        { points: 0, darts: 0 },
        { points: 0, darts: 0 },
      ],
    };
  }
  const state = matchState(match.settings, events);
  const stats = dartStats(match.settings, events);
  return {
    slot: match.slot,
    players: [a, b],
    winner: match.winner,
    legs: [state.players[0]?.legsWon ?? 0, state.players[1]?.legsWon ?? 0],
    walkover: false,
    stats: [stats[0] ?? { points: 0, darts: 0 }, stats[1] ?? { points: 0, darts: 0 }],
  };
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

export function createTournaments(db: Db, stations: StationDirectory) {
  const listeners = new Set<() => void>();
  /** Tells the scheduler that something changed. */
  const changed = () => {
    for (const listener of listeners) listener();
  };

  function active(): TournamentRecord | undefined {
    return db.activeTournament();
  }

  const started = (match: MatchRecord) => match.closedAt !== null || db.events(match.id).length > 0;

  /** Whether any match of the tournament has been played (or started); then the format locks. */
  function anyPlayed(tournament: TournamentRecord) {
    return db.tournamentMatches(tournament.id).some((m) => !m.walkover && started(m));
  }

  /** Results of the tournament's decided matches; `instead` swaps in one match's log and record. */
  function results(
    tournament: TournamentRecord,
    instead?: { match: MatchRecord; events: StoredEvent[] },
  ): Result[] {
    return db.tournamentMatches(tournament.id).flatMap((m) => {
      const own = instead?.match.id === m.id ? instead : null;
      const result = own
        ? resultOf(own.match, own.events)
        : resultOf(m, m.walkover ? [] : db.events(m.id));
      return result ? [result] : [];
    });
  }

  /**
   * Why a correction to a tournament match can't be made, or null if it can. A finished match
   * must keep a winner, and nothing that has started or been played may end up with other
   * players; in a finished tournament the winner can't change at all.
   */
  function correctionProblem(match: MatchRecord, events: StoredEvent[]): string | null {
    const tournament = match.tournamentId ? db.getTournament(match.tournamentId) : undefined;
    if (!tournament || tournament.status === "draft" || !match.closedAt || match.abandoned)
      return null;
    const winnerIndex = matchState(match.settings, events).winner;
    const winner = winnerIndex === null ? null : (match.playerIds[winnerIndex] ?? null);
    if (winner === null) return "That would leave the match without a winner.";
    if (tournament.status === "finished" && winner !== match.winner) {
      return "The tournament is over; a correction can't change who won.";
    }
    const after = plan(
      tournament.config,
      db.entrants(tournament.id),
      results(tournament, { match: { ...match, winner }, events }),
    );
    const planned = new Map(after.matches.map((m) => [m.slot, m]));
    const name = (id: string) => db.getPlayer(id)?.name ?? "?";
    for (const other of db.tournamentMatches(tournament.id)) {
      if (other.id === match.id || other.abandoned || !started(other)) continue;
      const wanted = other.slot ? planned.get(other.slot) : undefined;
      if (wanted?.players && sameSet(wanted.players, other.playerIds)) continue;
      const who = other.playerIds.map(name).join(" vs ");
      const what = other.closedAt ? "has already been played" : "has already started";
      return `It would change ${other.label ?? "a later match"} (${who}), which ${what}.`;
    }
    return null;
  }

  /** After a correction: rebuild whatever depends on the result. */
  function corrected(match: MatchRecord) {
    const tournament = match.tournamentId ? db.getTournament(match.tournamentId) : undefined;
    if (tournament?.status !== "running") return;
    sync();
    changed();
  }

  const settingsFor = (config: TournamentConfig, phase: MatchPhase) => ({
    ...defaultX01Settings,
    ...config.x01,
    legsToWin: config.legs[phase],
    rulesVersion: RULES_VERSION,
  });

  /**
   * Brings the running tournament's matches in line with its plan: creates the matches that can
   * be played (queued, no station), walkovers for withdrawn players, removes queued matches the
   * plan no longer has, and finishes the tournament once there's a champion. Returns the plan.
   */
  function sync(): Plan | null {
    const tournament = active();
    if (tournament?.status !== "running") return null;
    const entrants = db.entrants(tournament.id);
    const withdrawn = new Set(entrants.filter((e) => e.withdrawn).map((e) => e.playerId));
    const seedOf = (id: string) => entrants.find((e) => e.playerId === id)?.seed ?? 999;
    let current = plan(tournament.config, entrants, results(tournament));
    for (let pass = 0; pass < 100; pass++) {
      let touched = false;
      const planned = new Map(current.matches.map((m) => [m.slot, m]));
      for (const match of db.tournamentMatches(tournament.id)) {
        if (match.closedAt || started(match)) continue;
        const wanted = match.slot ? planned.get(match.slot) : undefined;
        if (wanted?.players && sameSet(wanted.players, match.playerIds)) continue;
        for (const station of stations.list()) station.drop(match.id);
        db.deleteMatch(match.id);
        touched = true;
      }
      const existing = db.tournamentMatches(tournament.id);
      for (const wanted of current.matches) {
        if (!wanted.players) continue;
        if (existing.some((m) => m.slot === wanted.slot && !m.abandoned)) continue;
        const id = randomUUID();
        db.createMatch({
          id,
          station: null,
          settings: settingsFor(tournament.config, wanted.phase),
          playerIds: wanted.players,
          tournamentId: tournament.id,
          slot: wanted.slot,
          label: wanted.label,
        });
        const out = wanted.players.filter((p) => withdrawn.has(p));
        if (out.length > 0) {
          const [a, b] = wanted.players;
          // Both withdrawn: it doesn't matter who goes on, they lose their next match anyway.
          const winner = out.length === 2 ? (seedOf(a) < seedOf(b) ? a : b) : out[0] === a ? b : a;
          db.closeAsWalkover(id, winner);
        }
        touched = true;
      }
      if (!touched) break;
      current = plan(tournament.config, entrants, results(tournament));
    }
    if (current.champion && current.placings) {
      db.saveTournament({
        ...tournament,
        status: "finished",
        finishedAt: new Date().toISOString(),
        placings: current.placings,
      });
    }
    return current;
  }

  function checkPlayers(raw: unknown): string[] {
    if (!Array.isArray(raw) || !raw.every((p) => typeof p === "string")) {
      throw new TournamentError("playerIds must be a list of player ids", 400);
    }
    if (new Set(raw).size !== raw.length)
      throw new TournamentError("a player can only enter once", 400);
    for (const id of raw) {
      const player = db.getPlayer(id);
      if (!player) throw new TournamentError("no such player", 400);
      if (player.archived) throw new TournamentError(`${player.name} is archived`, 400);
    }
    return raw;
  }

  /**
   * Seed order for these players: whoever was already in keeps their place; newcomers with a
   * rating go in by rating, unseeded ones at a random spot among the unseeded at the end.
   */
  function seedOrder(playerIds: string[], previous: string[]): string[] {
    const rating = new Map(playerIds.map((id) => [id, ratingOf(db, id)]));
    const order = previous.filter((id) => playerIds.includes(id));
    const newcomers = playerIds.filter((id) => !order.includes(id));
    const rated = newcomers
      .filter((id) => rating.get(id) !== null)
      .sort((a, b) => (rating.get(b) ?? 0) - (rating.get(a) ?? 0));
    for (const id of rated) {
      const r = rating.get(id) ?? 0;
      const at = order.findIndex(
        (other) => (rating.get(other) ?? null) === null || (rating.get(other) ?? 0) < r,
      );
      order.splice(at === -1 ? order.length : at, 0, id);
    }
    for (const id of shuffle(newcomers.filter((id) => rating.get(id) === null))) {
      const firstUnseeded = order.findIndex((other) => rating.get(other) === null);
      const from = firstUnseeded === -1 ? order.length : firstUnseeded;
      order.splice(from + Math.floor(Math.random() * (order.length - from + 1)), 0, id);
    }
    return order;
  }

  function entrantsFor(order: string[], config: TournamentConfig, previous: Entrant[]): Entrant[] {
    const groups = snakeGroups(order, Math.max(1, config.format.groups));
    return order.map((playerId, seed) => ({
      playerId,
      seed,
      group: groups.findIndex((g) => g.includes(playerId)),
      withdrawn: previous.find((e) => e.playerId === playerId)?.withdrawn ?? false,
    }));
  }

  /** The plan as it stands, for a running or finished tournament. */
  function currentPlan(tournament: TournamentRecord): Plan {
    return (
      (tournament.status === "running" ? sync() : null) ??
      plan(tournament.config, db.entrants(tournament.id), results(tournament))
    );
  }

  /** What /admin shows, and the plan behind it (null while there's no progress), built once. */
  function shown(): { view: TournamentAdminView; plan: Plan | null } {
    // A finished tournament stays on show until the next one is created.
    const tournament = active() ?? db.tournaments().find((t) => t.status === "finished");
    if (!tournament) {
      return {
        view: {
          tournament: null,
          entrants: [],
          groups: [],
          estimateMinutes: null,
          problems: [],
          progress: null,
        },
        plan: null,
      };
    }
    const entrants = db.entrants(tournament.id);
    const groupCount = Math.max(1, ...entrants.map((e) => e.group + 1));
    const groups = Array.from({ length: groupCount }, (_, g) =>
      entrants.filter((e) => e.group === g).map((e) => e.playerId),
    );
    const problems = configProblems(tournament.config, entrants.length);
    const estimate =
      problems.length === 0
        ? estimateMinutes(
            tournament.config,
            entrants.length,
            legMinutes(db, tournament.config.x01.startScore),
            stations.list().length,
          )
        : null;
    const { id, name, status, config, startedAt, finishedAt } = tournament;
    const shownPlan = status === "draft" ? null : currentPlan(tournament);
    const view: TournamentAdminView = {
      tournament: { id, name, status, config, startedAt, finishedAt },
      entrants: entrants.map((e) => ({
        ...e,
        name: db.getPlayer(e.playerId)?.name ?? "?",
        photo: db.getPlayer(e.playerId)?.photo ?? null,
        rating: ratingOf(db, e.playerId),
      })),
      groups,
      estimateMinutes: estimate,
      problems,
      progress: shownPlan
        ? progressView(db, stations, db.getTournament(id) ?? tournament, shownPlan)
        : null,
    };
    return { view, plan: shownPlan };
  }

  const view = (): TournamentAdminView => shown().view;

  /** Matches sent back from a station: the scheduler won't give them straight back to it. */
  const sentBack = new Map<string, number>();

  function running(): TournamentRecord {
    const tournament = active();
    if (tournament?.status !== "running") throw new TournamentError("no running tournament", 404);
    return tournament;
  }

  /** An open match of the running tournament. */
  function openMatch(matchId: string): MatchRecord {
    const tournament = running();
    const match = db.getMatch(matchId);
    if (!match || match.tournamentId !== tournament.id || match.closedAt) {
      throw new TournamentError("no such open tournament match", 404);
    }
    return match;
  }

  const stationOf = (match: MatchRecord) =>
    match.station === null ? undefined : stations.get(match.station);

  /** Takes a match off its station, if it hasn't started there. */
  function takeOff(match: MatchRecord) {
    const station = stationOf(match);
    if (!station) return;
    if (!station.release()) throw new TournamentError("the match has already started");
    sentBack.set(match.id, station.id);
  }

  function pauseStation(stationId: number, paused: boolean) {
    running();
    if (!stations.get(stationId)) throw new TournamentError("no such station", 404);
    db.setStationPaused(stationId, paused);
    changed();
  }

  /** Held matches are skipped; holding one that waits on a station takes it off. */
  function hold(matchId: string, held: boolean) {
    const match = openMatch(matchId);
    if (held) takeOff(match);
    db.setHeld(matchId, held);
    changed();
  }

  function pin(matchId: string, stationId: number | null) {
    openMatch(matchId);
    if (stationId !== null && !stations.get(stationId))
      throw new TournamentError("no such station", 404);
    db.setPinnedStation(matchId, stationId);
    changed();
  }

  function sendBack(matchId: string) {
    const match = openMatch(matchId);
    if (match.station === null) throw new TournamentError("the match isn't on a station");
    takeOff(match);
    changed();
  }

  /** A queued match onto a station now, out of order; a match waiting there goes back. */
  function playNow(matchId: string, stationId: number) {
    const match = openMatch(matchId);
    const station = stations.get(stationId);
    if (!station) throw new TournamentError("no such station", 404);
    if (match.station !== null) throw new TournamentError("the match is already on a station");
    const waiting = station.view().match;
    if (waiting) {
      if (waiting.state.phase !== "notStarted")
        throw new TournamentError(`${station.view().name} is in use`);
      station.release();
    }
    const busy = db.busyPlayerIds();
    const playing = match.playerIds.filter((p) => busy.has(p));
    if (playing.length > 0) {
      throw new TournamentError(
        `${playing.map((p) => db.getPlayer(p)?.name).join(" and ")} still playing`,
      );
    }
    if (match.held) db.setHeld(matchId, false);
    station.take(matchId);
    placed(matchId, stationId);
    changed();
  }

  function entrantOf(tournament: TournamentRecord, playerId: string) {
    const entrant = db.entrants(tournament.id).find((e) => e.playerId === playerId);
    if (!entrant) throw new TournamentError("the player isn't in the tournament", 404);
    return entrant;
  }

  /**
   * The player loses every remaining match by walkover: a match they're playing is abandoned,
   * the rest are taken off stations and out of the queue, and sync recreates them as walkovers.
   * Results already played stand.
   */
  function withdraw(playerId: string) {
    const tournament = running();
    const entrant = entrantOf(tournament, playerId);
    if (entrant.withdrawn) throw new TournamentError("the player has already withdrawn");
    db.setEntrants(
      tournament.id,
      db
        .entrants(tournament.id)
        .map((e) => (e.playerId === playerId ? { ...e, withdrawn: true } : e)),
    );
    for (const match of db.tournamentMatches(tournament.id)) {
      if (match.closedAt || !match.playerIds.includes(playerId)) continue;
      const station = stationOf(match);
      if (station && db.events(match.id).length > 0) {
        void station.command({ type: "abandonMatch" });
      } else {
        station?.drop(match.id);
        db.deleteMatch(match.id);
      }
    }
    sync();
    changed();
  }

  /** A player who arrives during the group phase joins the smallest group. */
  function addLate(playerId: string) {
    const tournament = running();
    const [id] = checkPlayers([playerId]);
    const entrants = db.entrants(tournament.id);
    if (entrants.some((e) => e.playerId === id))
      throw new TournamentError("the player is already in");
    if (currentPlan(tournament).groupPhaseDone) {
      throw new TournamentError("the knockout has started; no late arrivals now");
    }
    const groupCount = Math.max(1, ...entrants.map((e) => e.group + 1));
    const sizes = Array.from(
      { length: groupCount },
      (_, g) => entrants.filter((e) => e.group === g).length,
    );
    const group = sizes.indexOf(Math.min(...sizes));
    const seed = Math.max(-1, ...entrants.map((e) => e.seed)) + 1;
    db.setEntrants(tournament.id, [
      ...entrants,
      { playerId: id as string, seed, group, withdrawn: false },
    ]);
    sync();
    changed();
  }

  /** Ends the tournament without a champion: open matches are abandoned. */
  function endEarly() {
    const tournament = running();
    for (const match of db.tournamentMatches(tournament.id)) {
      if (match.closedAt) continue;
      if (match.station !== null && db.events(match.id).length > 0) {
        void stationOf(match)?.command({ type: "abandonMatch" });
        continue;
      }
      stationOf(match)?.drop(match.id);
      db.closeMatch(match.id, { abandoned: true });
    }
    db.saveTournament({ ...tournament, status: "finished", finishedAt: new Date().toISOString() });
    changed();
  }

  /** The scheduler put a match on a station: whatever was sent back from there is free again. */
  function placed(matchId: string, stationId: number) {
    sentBack.delete(matchId);
    for (const [id, from] of sentBack) if (from === stationId) sentBack.delete(id);
  }

  const avoids = (matchId: string, stationId: number) => sentBack.get(matchId) === stationId;

  function create(input: TournamentInput): TournamentAdminView {
    if (active()) throw new TournamentError("there is already an active tournament");
    const playerIds = checkPlayers(input.playerIds ?? []);
    const config = mergeConfig(defaultTournamentConfig, input.config);
    const tournament: TournamentRecord = {
      id: randomUUID(),
      name: String(input.name ?? "").trim() || today(),
      status: "draft",
      config,
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      placings: null,
    };
    db.createTournament(tournament);
    db.setEntrants(tournament.id, entrantsFor(seedOrder(playerIds, []), config, []));
    return view();
  }

  /** The active tournament, if its players and format may still change. */
  function editable(): TournamentRecord {
    const tournament = active();
    if (!tournament) throw new TournamentError("no active tournament", 404);
    if (tournament.status === "running" && anyPlayed(tournament)) {
      throw new TournamentError("a match has been played; only withdrawals and late arrivals now");
    }
    return tournament;
  }

  function update(input: TournamentInput): TournamentAdminView {
    const tournament = editable();
    const previous = db.entrants(tournament.id);
    const config = mergeConfig(tournament.config, input.config);
    const name =
      input.name === undefined ? tournament.name : String(input.name).trim() || tournament.name;
    let order = previous.map((e) => e.playerId);
    if (input.playerIds !== undefined) order = seedOrder(checkPlayers(input.playerIds), order);
    if (input.seedOrder !== undefined) {
      const wanted = input.seedOrder;
      const same =
        Array.isArray(wanted) &&
        wanted.length === order.length &&
        [...wanted].sort().join() === [...order].sort().join();
      if (!same)
        throw new TournamentError("the seed order has to contain exactly the entrants", 400);
      order = wanted as string[];
    }
    if (tournament.status === "running") {
      const problems = configProblems(config, order.length);
      if (problems.length > 0) throw new TournamentError(problems.join(" "));
    }
    db.saveTournament({ ...tournament, name, config });
    db.setEntrants(tournament.id, entrantsFor(order, config, previous));
    sync();
    changed();
    return view();
  }

  function discard() {
    const tournament = editable();
    if (tournament.status !== "draft") throw new TournamentError("only a draft can be discarded");
    db.deleteTournament(tournament.id);
  }

  function start(): TournamentAdminView {
    const tournament = editable();
    if (tournament.status !== "draft")
      throw new TournamentError("the tournament is already running");
    const problems = configProblems(tournament.config, db.entrants(tournament.id).length);
    if (problems.length > 0) throw new TournamentError(problems.join(" "));
    db.saveTournament({ ...tournament, status: "running", startedAt: new Date().toISOString() });
    sync();
    changed();
    return view();
  }

  return {
    view,
    create,
    update,
    discard,
    start,
    sync,
    pauseStation,
    hold,
    pin,
    sendBack,
    playNow,
    endEarly,
    withdraw,
    addLate,
    /** Matches asks this before and after a correction (TOUR-14). */
    shown,
    resultGuard: { problem: correctionProblem, changed: corrected } satisfies ResultGuard,
    placed,
    avoids,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type Tournaments = ReturnType<typeof createTournaments>;

export function registerTournaments(app: FastifyInstance, tournaments: Tournaments) {
  /** Runs a change, answering its errors with their status. */
  function attempt(reply: FastifyReply, change: () => unknown) {
    try {
      return change();
    } catch (error) {
      if (error instanceof TournamentError) {
        return reply.code(error.status).send({ error: error.message });
      }
      throw error;
    }
  }

  app.post<{ Body: TournamentInput }>("/api/admin/tournament", async (request, reply) =>
    attempt(reply, () => reply.code(201).send(tournaments.create(request.body ?? {}))),
  );
  app.patch<{ Body: TournamentInput }>("/api/admin/tournament", async (request, reply) =>
    attempt(reply, () => tournaments.update(request.body ?? {})),
  );
  app.delete("/api/admin/tournament", async (_request, reply) =>
    attempt(reply, () => {
      tournaments.discard();
      return reply.code(204).send();
    }),
  );
  app.post("/api/admin/tournament/start", async (_request, reply) =>
    attempt(reply, () => tournaments.start()),
  );
  app.post<{ Body: { playerId?: unknown } }>(
    "/api/admin/tournament/withdraw",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.withdraw(String(request.body?.playerId ?? ""));
        return tournaments.view();
      }),
  );
  app.post<{ Body: { playerId?: unknown } }>("/api/admin/tournament/late", async (request, reply) =>
    attempt(reply, () => {
      tournaments.addLate(String(request.body?.playerId ?? ""));
      return tournaments.view();
    }),
  );
  app.post("/api/admin/tournament/end", async (_request, reply) =>
    attempt(reply, () => {
      tournaments.endEarly();
      return tournaments.view();
    }),
  );
  app.post<{ Params: { id: string }; Body: { paused?: unknown } }>(
    "/api/admin/tournament/stations/:id/pause",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.pauseStation(Number(request.params.id), request.body?.paused !== false);
        return tournaments.view();
      }),
  );
  app.post<{ Params: { id: string }; Body: { held?: unknown } }>(
    "/api/admin/tournament/matches/:id/hold",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.hold(request.params.id, request.body?.held !== false);
        return tournaments.view();
      }),
  );
  app.post<{ Params: { id: string }; Body: { station?: unknown } }>(
    "/api/admin/tournament/matches/:id/pin",
    async (request, reply) =>
      attempt(reply, () => {
        const station = request.body?.station;
        tournaments.pin(
          request.params.id,
          station === null || station === undefined ? null : Number(station),
        );
        return tournaments.view();
      }),
  );
  app.post<{ Params: { id: string } }>(
    "/api/admin/tournament/matches/:id/send-back",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.sendBack(request.params.id);
        return tournaments.view();
      }),
  );
  app.post<{ Params: { id: string }; Body: { station?: unknown } }>(
    "/api/admin/tournament/matches/:id/play-now",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.playNow(request.params.id, Number(request.body?.station));
        return tournaments.view();
      }),
  );
}

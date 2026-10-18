// The active tournament: setting it up in /admin (draft, seeds, groups, estimate) and starting
// it. Running it, matches and the scheduler, builds on this (.scratch/tournaments/spec.md).

import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { TournamentAdminView } from "./api.ts";
import type { Db, TournamentRecord } from "./db.ts";
import { estimateMinutes, legMinutes } from "./estimate.ts";
import { ratingOf } from "./ratings.ts";
import type { StationDirectory } from "./stations.ts";
import { snakeGroups } from "./tournament/groups.ts";
import { configProblems } from "./tournament/plan.ts";
import {
  defaultTournamentConfig,
  type Entrant,
  type TournamentConfig,
} from "./tournament/types.ts";

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

export function createTournaments(db: Db, stations: StationDirectory) {
  function active(): TournamentRecord | undefined {
    return db.activeTournament();
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

  function view(): TournamentAdminView {
    const tournament = active();
    if (!tournament) {
      return { tournament: null, entrants: [], groups: [], estimateMinutes: null, problems: [] };
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
    return {
      tournament: { id, name, status, config, startedAt, finishedAt },
      entrants: entrants.map((e) => ({
        ...e,
        name: db.getPlayer(e.playerId)?.name ?? "?",
        rating: ratingOf(db, e.playerId),
      })),
      groups,
      estimateMinutes: estimate,
      problems,
    };
  }

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

  function editable(): TournamentRecord {
    const tournament = active();
    if (!tournament) throw new TournamentError("no active tournament", 404);
    if (tournament.status !== "draft") {
      throw new TournamentError(
        "the tournament has started; only withdrawals and late arrivals now",
      );
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
    db.saveTournament({ ...tournament, name, config });
    db.setEntrants(tournament.id, entrantsFor(order, config, previous));
    return view();
  }

  function discard() {
    const tournament = editable();
    db.deleteTournament(tournament.id);
  }

  function start(): TournamentAdminView {
    const tournament = editable();
    const problems = configProblems(tournament.config, db.entrants(tournament.id).length);
    if (problems.length > 0) throw new TournamentError(problems.join(" "));
    db.saveTournament({ ...tournament, status: "running", startedAt: new Date().toISOString() });
    return view();
  }

  return { view, create, update, discard, start };
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

  app.get("/api/admin/tournament", async () => tournaments.view());
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
}

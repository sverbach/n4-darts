// The organiser's match routes in /admin: put a match on a station, end one, the history, one
// match's detail (also live), and corrections.

import type { FastifyInstance, FastifyReply } from "fastify";
import type { MatchSettingsInput } from "../api.ts";
import type { ChangeFeed } from "../live/live.ts";
import { streamView } from "../live/liveRoutes.ts";
import { CommandError } from "../stations/station.ts";
import type { StationDirectory } from "../stations/stations.ts";
import { MatchError, type Matches } from "./matches.ts";

const STATUS = { invalid: 400, missing: 404, refused: 409 } as const;

/** Runs a request, answering its refusal with a status. */
async function attempt<T>(reply: FastifyReply, run: () => T): Promise<T | FastifyReply> {
  try {
    return run();
  } catch (error) {
    if (error instanceof MatchError) {
      return reply.code(STATUS[error.reason]).send({ error: error.message });
    }
    throw error;
  }
}

/** Without `matches` (no database), only putting a match on a station and ending one work. */
export function registerMatches(
  app: FastifyInstance,
  stations: StationDirectory,
  matches?: Matches,
  feed?: ChangeFeed,
) {
  app.post<{ Body: { station?: unknown; playerIds?: unknown; settings?: MatchSettingsInput } }>(
    "/api/admin/matches",
    async (request, reply) => {
      const { station: stationId, playerIds, settings } = request.body ?? {};
      if (!Array.isArray(playerIds) || !playerIds.every((p) => typeof p === "string")) {
        return reply.code(400).send({ error: "playerIds must be a list of player ids" });
      }
      const station = stations.get(Number(stationId));
      if (!station) return reply.code(404).send({ error: "no such station" });
      try {
        return reply.code(201).send(station.assign({ playerIds, settings }));
      } catch (error) {
        if (error instanceof CommandError) return reply.code(409).send({ error: error.message });
        throw error;
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/stations/:id/abandon",
    async (request, reply) => {
      const station = stations.get(Number(request.params.id));
      if (!station) return reply.code(404).send({ error: "no such station" });
      return station.command({ type: "abandonMatch" });
    },
  );

  if (!matches) return;

  app.get("/api/admin/matches", async () => matches.history());

  app.get<{ Params: { id: string } }>("/api/admin/matches/:id", async (request, reply) =>
    attempt(reply, () => matches.detail(request.params.id)),
  );

  app.get<{ Params: { id: string } }>("/api/admin/matches/:id/live", (request, reply) => {
    if (!feed) return reply.code(404).send({ error: "no such match" });
    let view: () => unknown;
    try {
      view = matches.follow(request.params.id);
    } catch (error) {
      if (error instanceof MatchError) return reply.code(404).send({ error: error.message });
      throw error;
    }
    streamView(request, reply, feed.subscribe, view, {
      kind: "match detail",
      label: request.params.id,
    });
  });

  app.post<{ Params: { id: string }; Body: { dartId?: unknown; segment?: unknown } }>(
    "/api/admin/matches/:id/corrections",
    async (request, reply) =>
      attempt(reply, () =>
        matches.correct(request.params.id, request.body?.dartId, request.body?.segment),
      ),
  );
}

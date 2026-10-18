// The organiser creates matches in /admin and puts them on a free station (no queue: dispatch
// is the scheduler's job, later). The station then runs the match exactly like a quick match.

import type { FastifyInstance } from "fastify";
import type { MatchSettingsInput } from "./api.ts";
import { CommandError, type Station } from "./station.ts";

export function registerMatches(app: FastifyInstance, stations: Map<number, Station>) {
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
}

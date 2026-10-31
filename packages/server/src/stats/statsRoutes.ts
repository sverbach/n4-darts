// Long-term stats, open to everyone: the leaderboard and a player's profile.

import type { FastifyInstance } from "fastify";
import type { Stats } from "./stats.ts";

export function registerStats(app: FastifyInstance, stats: Stats) {
  app.get("/api/players/stats", async () => stats.leaderboard());
  app.get<{ Params: { id: string } }>("/api/players/:id/stats", async (request, reply) => {
    const profile = stats.profile(request.params.id);
    return profile ?? reply.code(404).send({ error: "no such player" });
  });
}

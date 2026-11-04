// Long-term stats, open to everyone: the leaderboard and a player's profile.

import type { FastifyInstance } from "fastify";
import { parse, TextIdParams } from "../parse.ts";
import type { Stats } from "./stats.ts";

export function registerStats(app: FastifyInstance, stats: Stats) {
  app.get("/api/players/stats", async () => stats.leaderboard());
  app.get("/api/players/:id/stats", async (request, reply) => {
    const profile = stats.profile(parse(TextIdParams, request.params).id);
    return profile ?? reply.code(404).send({ error: "no such player" });
  });
}

// The player list's routes. Listing and adding a player are open (a new player can join at the
// board, docs/adr/0004); everything else is under /api/admin.

import type { FastifyInstance, FastifyReply } from "fastify";
import type { AdminPlayer } from "../api.ts";
import type { Db } from "../db.ts";
import { ratingOf } from "../ratings/ratings.ts";
import { MAX_PHOTO_BYTES, PlayerError, type Players } from "./players.ts";

const STATUS = { invalid: 400, taken: 409, missing: 404, "in-use": 409 } as const;

/** Runs a change, answering its refusal with a status. */
async function attempt<T>(reply: FastifyReply, change: () => T): Promise<T | FastifyReply> {
  try {
    return change();
  } catch (error) {
    if (error instanceof PlayerError) {
      return reply.code(STATUS[error.reason]).send({ error: error.message });
    }
    throw error;
  }
}

export function registerPlayers(app: FastifyInstance, players: Players, db: Db) {
  app.get("/api/players", async () => players.list());

  app.post<{ Body: { name?: unknown } }>("/api/players", async (request, reply) =>
    attempt(reply, () => reply.code(201).send(players.add(request.body?.name))),
  );

  app.get(
    "/api/admin/players",
    async (): Promise<AdminPlayer[]> =>
      players.listAll().map((p) => ({ ...p, rating: ratingOf(db, p.id) })),
  );

  app.post<{ Body: { name?: unknown } }>("/api/admin/players", async (request, reply) =>
    attempt(reply, () => reply.code(201).send(players.add(request.body?.name))),
  );

  app.patch<{ Params: { id: string }; Body: { name?: unknown; archived?: unknown } }>(
    "/api/admin/players/:id",
    async (request, reply) =>
      attempt(reply, () => players.update(request.params.id, request.body ?? {})),
  );

  // Photos: the browser crops and shrinks them to a small square JPEG before uploading.
  app.addContentTypeParser(
    "image/jpeg",
    { parseAs: "buffer", bodyLimit: MAX_PHOTO_BYTES },
    (_request, body, done) => done(null, body),
  );

  app.get<{ Params: { id: string }; Querystring: { v?: string } }>(
    "/api/players/:id/photo",
    async (request, reply) => {
      const photo = players.photo(request.params.id);
      if (!photo) return reply.code(404).send({ error: "no photo" });
      // A versioned URL never changes; without a version, always ask again.
      const cache =
        request.query.v === photo.version ? "public, max-age=31536000, immutable" : "no-cache";
      return reply.type("image/jpeg").header("cache-control", cache).send(Buffer.from(photo.jpeg));
    },
  );

  app.put<{ Params: { id: string }; Body: Buffer }>(
    "/api/admin/players/:id/photo",
    async (request, reply) =>
      attempt(reply, () => players.setPhoto(request.params.id, request.body)),
  );

  app.delete<{ Params: { id: string } }>("/api/admin/players/:id/photo", async (request, reply) =>
    attempt(reply, () => players.deletePhoto(request.params.id)),
  );

  app.delete<{ Params: { id: string } }>("/api/admin/players/:id", async (request, reply) =>
    attempt(reply, () => {
      players.remove(request.params.id);
      return reply.code(204).send();
    }),
  );
}

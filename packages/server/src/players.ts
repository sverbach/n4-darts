// The persistent player list (GLOSSARY.md: Player). Listing is open, so stations can offer a
// picker; changes go through /admin.

import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { AdminPlayer, MatchPlayer, Player } from "./api.ts";
import type { Db } from "./db.ts";

/** Trimmed, inner whitespace collapsed; empty means invalid. */
const cleanName = (name: unknown) =>
  String(name ?? "")
    .trim()
    .replace(/\s+/g, " ");

/** A player as matches and views show them: name and photo version. */
export function matchPlayer(db: Db, id: string): MatchPlayer {
  const player = db.getPlayer(id);
  return { id, name: player?.name ?? "?", photo: player?.photo ?? null };
}

/** Photos arrive as 512×512 JPEGs of about 50 KB; anything far bigger isn't one of ours. */
export const MAX_PHOTO_BYTES = 1024 * 1024;

const isJpeg = (data: Buffer) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;

/** `ratingOf` is handed in: the organiser's list shows the rating, but it's Ratings' to compute. */
export function registerPlayers(
  app: FastifyInstance,
  db: Db,
  ratingOf: (playerId: string) => number | null,
) {
  /** Answers 400/409 and returns null if the name can't be used (by anyone but `self`). */
  function usableName(raw: unknown, reply: FastifyReply, self?: string): string | null {
    const name = cleanName(raw);
    if (!name) {
      void reply.code(400).send({ error: "a player needs a name" });
      return null;
    }
    const taken = db.playerNamed(name);
    if (taken && taken.id !== self) {
      void reply.code(409).send({ error: `there is already a player called ${taken.name}` });
      return null;
    }
    return name;
  }

  app.get("/api/players", async () => db.players());

  // Open, like the rest of the station (docs/adr/0004): a new player can join at the board.
  app.post<{ Body: { name?: unknown } }>("/api/players", async (request, reply) =>
    add(request.body?.name, reply),
  );

  app.get(
    "/api/admin/players",
    async (): Promise<AdminPlayer[]> =>
      db.players({ includeArchived: true }).map((p) => ({ ...p, rating: ratingOf(p.id) })),
  );

  function add(raw: unknown, reply: FastifyReply) {
    const name = usableName(raw, reply);
    if (!name) return reply;
    const player: Player = { id: randomUUID(), name, archived: false, photo: null };
    db.addPlayer(player);
    return reply.code(201).send(player);
  }

  app.post<{ Body: { name?: unknown } }>("/api/admin/players", async (request, reply) =>
    add(request.body?.name, reply),
  );

  app.patch<{ Params: { id: string }; Body: { name?: unknown; archived?: unknown } }>(
    "/api/admin/players/:id",
    async (request, reply) => {
      const player = db.getPlayer(request.params.id);
      if (!player) return reply.code(404).send({ error: "no such player" });
      const { name, archived } = request.body ?? {};
      const next = { ...player };
      if (name !== undefined) {
        const usable = usableName(name, reply, player.id);
        if (!usable) return reply;
        next.name = usable;
      }
      if (archived !== undefined) next.archived = archived === true;
      db.updatePlayer(next);
      return next;
    },
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
      const photo = db.photo(request.params.id);
      if (!photo) return reply.code(404).send({ error: "no photo" });
      // A versioned URL never changes; without a version, always ask again.
      const cache =
        request.query.v === photo.version ? "public, max-age=31536000, immutable" : "no-cache";
      return reply.type("image/jpeg").header("cache-control", cache).send(Buffer.from(photo.jpeg));
    },
  );

  app.put<{ Params: { id: string }; Body: Buffer }>(
    "/api/admin/players/:id/photo",
    async (request, reply) => {
      const player = db.getPlayer(request.params.id);
      if (!player) return reply.code(404).send({ error: "no such player" });
      const body = request.body;
      if (!Buffer.isBuffer(body) || !isJpeg(body)) {
        return reply.code(400).send({ error: "the photo must be a JPEG" });
      }
      db.setPhoto(player.id, body);
      return db.getPlayer(player.id);
    },
  );

  app.delete<{ Params: { id: string } }>("/api/admin/players/:id/photo", async (request, reply) => {
    const player = db.getPlayer(request.params.id);
    if (!player) return reply.code(404).send({ error: "no such player" });
    db.deletePhoto(player.id);
    return db.getPlayer(player.id);
  });

  // A player with matches keeps their history: archive them instead.
  app.delete<{ Params: { id: string } }>("/api/admin/players/:id", async (request, reply) => {
    const player = db.getPlayer(request.params.id);
    if (!player) return reply.code(404).send({ error: "no such player" });
    if (db.playerHasMatches(player.id)) {
      return reply.code(409).send({ error: `${player.name} has played matches; archive instead` });
    }
    db.deletePlayer(player.id);
    return reply.code(204).send();
  });
}

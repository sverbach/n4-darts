// The player list's routes. Listing and adding a player are open (a new player can join at the
// board, docs/adr/0004); everything else is under /api/admin.

import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { type AdminPlayer, NewPlayerInput, PlayerChangesInput } from "../api.ts";
import type { ChangeFeed } from "../live/live.ts";
import { liveView } from "../live/liveRoutes.ts";
import { FileBody, parse, TextIdParams } from "../parse.ts";
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

/**
 * `ratingOf` is handed in: the organiser's list shows the rating, but it's Ratings' to compute.
 * Both lists are also streams (`/live`), resent after any change from the feed.
 */
export function registerPlayers(
  app: FastifyInstance,
  players: Players,
  ratingOf: (playerId: string) => number | null,
  feed: ChangeFeed,
) {
  const adminList = (): AdminPlayer[] =>
    players.listAll().map((p) => ({ ...p, rating: ratingOf(p.id) }));

  app.get("/api/players", async () => players.list());
  liveView(app, "/api/players/live", () => ({
    subscribe: feed.subscribe,
    view: () => players.list(),
    kind: "players",
  }));

  app.post("/api/players", async (request, reply) => {
    const { name } = parse(NewPlayerInput, request.body);
    return attempt(reply, () => reply.code(201).send(players.add(name)));
  });

  app.get("/api/admin/players", async () => adminList());
  liveView(app, "/api/admin/players/live", () => ({
    subscribe: feed.subscribe,
    view: adminList,
    kind: "admin players",
  }));

  app.post("/api/admin/players", async (request, reply) => {
    const { name } = parse(NewPlayerInput, request.body);
    return attempt(reply, () => reply.code(201).send(players.add(name)));
  });

  app.patch("/api/admin/players/:id", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    const changes = parse(PlayerChangesInput, request.body);
    return attempt(reply, () => players.update(id, changes));
  });

  // Photos: the browser crops and shrinks them to a small square JPEG before uploading.
  app.addContentTypeParser(
    "image/jpeg",
    { parseAs: "buffer", bodyLimit: MAX_PHOTO_BYTES },
    (_request, body, done) => done(null, body),
  );

  registerPlayerPhoto(app, players);

  app.put("/api/admin/players/:id/photo", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    const jpeg = parse(FileBody, request.body);
    return attempt(reply, () => players.setPhoto(id, jpeg));
  });

  app.delete("/api/admin/players/:id/photo", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    return attempt(reply, () => players.deletePhoto(id));
  });

  app.delete("/api/admin/players/:id", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    return attempt(reply, () => {
      players.remove(id);
      return reply.code(204).send();
    });
  });
}

/** `v` is the photo's version, from `Player.photo`. */
const PhotoQuery = z.object({ v: z.string().exactOptional() });

/** A player's photo: open to everyone, also on the public site. */
export function registerPlayerPhoto(app: FastifyInstance, players: Pick<Players, "photo">) {
  app.get("/api/players/:id/photo", async (request, reply) => {
    const photo = players.photo(parse(TextIdParams, request.params).id);
    if (!photo) return reply.code(404).send({ error: "no photo" });
    // A versioned URL never changes; without a version, always ask again.
    const { v } = parse(PhotoQuery, request.query);
    const cache = v === photo.version ? "public, max-age=31536000, immutable" : "no-cache";
    return reply.type("image/jpeg").header("cache-control", cache).send(Buffer.from(photo.jpeg));
  });
}

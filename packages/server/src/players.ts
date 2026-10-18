// The persistent player list (GLOSSARY.md: Player). Listing is open, so stations can offer a
// picker; changes go through /admin.

import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { Player } from "./api.ts";
import type { Db } from "./db.ts";

/** Trimmed, inner whitespace collapsed; empty means invalid. */
const cleanName = (name: unknown) =>
  String(name ?? "")
    .trim()
    .replace(/\s+/g, " ");

export function registerPlayers(app: FastifyInstance, db: Db) {
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

  app.get("/api/admin/players", async () => db.players({ includeArchived: true }));

  app.post<{ Body: { name?: unknown } }>("/api/admin/players", async (request, reply) => {
    const name = usableName(request.body?.name, reply);
    if (!name) return reply;
    const player: Player = { id: randomUUID(), name, archived: false };
    db.addPlayer(player);
    return reply.code(201).send(player);
  });

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

  // A player who has played matches is archived instead; that check arrives with player-linked
  // matches (ticket 04).
  app.delete<{ Params: { id: string } }>("/api/admin/players/:id", async (request, reply) => {
    if (!db.getPlayer(request.params.id)) return reply.code(404).send({ error: "no such player" });
    db.deletePlayer(request.params.id);
    return reply.code(204).send();
  });
}

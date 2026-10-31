// The persistent player list (GLOSSARY.md: Player). Listing is open, so stations can offer a
// picker; changes go through /admin. The routes are in playersRoutes.ts.

import { randomUUID } from "node:crypto";
import type { MatchPlayer, Player } from "../api.ts";
import type { Db } from "../db.ts";

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

/** Why a change to the player list was refused. */
export class PlayerError extends Error {
  readonly reason: "invalid" | "taken" | "missing" | "in-use";
  constructor(message: string, reason: "invalid" | "taken" | "missing" | "in-use") {
    super(message);
    this.reason = reason;
  }
}

export function createPlayers(db: Db) {
  /** The cleaned name, if nobody but `self` has it yet. */
  function usableName(raw: unknown, self?: string): string {
    const name = cleanName(raw);
    if (!name) throw new PlayerError("a player needs a name", "invalid");
    const taken = db.playerNamed(name);
    if (taken && taken.id !== self) {
      throw new PlayerError(`there is already a player called ${taken.name}`, "taken");
    }
    return name;
  }

  function existing(id: string): Player {
    const player = db.getPlayer(id);
    if (!player) throw new PlayerError("no such player", "missing");
    return player;
  }

  return {
    /** Active players, for the pickers. */
    list: () => db.players(),
    /** Everyone, archived players too, for /admin. */
    listAll: () => db.players({ includeArchived: true }),

    add(name: unknown): Player {
      const player: Player = {
        id: randomUUID(),
        name: usableName(name),
        archived: false,
        photo: null,
      };
      db.addPlayer(player);
      return player;
    },

    update(id: string, changes: { name?: unknown; archived?: unknown }): Player {
      const next = { ...existing(id) };
      if (changes.name !== undefined) next.name = usableName(changes.name, id);
      if (changes.archived !== undefined) next.archived = changes.archived === true;
      db.updatePlayer(next);
      return next;
    },

    photo: (id: string) => db.photo(id),

    setPhoto(id: string, jpeg: unknown) {
      const player = existing(id);
      if (!Buffer.isBuffer(jpeg) || !isJpeg(jpeg)) {
        throw new PlayerError("the photo must be a JPEG", "invalid");
      }
      db.setPhoto(player.id, jpeg);
      return db.getPlayer(player.id);
    },

    deletePhoto(id: string) {
      const player = existing(id);
      db.deletePhoto(player.id);
      return db.getPlayer(player.id);
    },

    /** A player with matches keeps their history: archive them instead. */
    remove(id: string) {
      const player = existing(id);
      if (db.playerHasMatches(player.id)) {
        throw new PlayerError(`${player.name} has played matches; archive instead`, "in-use");
      }
      db.deletePlayer(player.id);
    },
  };
}

export type Players = ReturnType<typeof createPlayers>;

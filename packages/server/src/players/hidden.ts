// Players who opted out of the public site (public-stats 03): the public site shows them as
// "Player", without a photo, a profile or an id that leads to one. The room's own pages don't.

import type { Player } from "../api.ts";
import type { Db } from "../db.ts";

export const HIDDEN_NAME = "Player";

/** The database as the public site reads it: hidden players under the neutral name, no photo. */
export function withHiddenPlayers(db: Db): Db {
  const shown = (p: Player): Player => (p.public ? p : { ...p, name: HIDDEN_NAME, photo: null });
  return {
    ...db,
    players: (options) => db.players(options).map(shown),
    getPlayer: (id) => {
      const player = db.getPlayer(id);
      return player && shown(player);
    },
    playerNamed: (name) => {
      const player = db.playerNamed(name);
      return player && shown(player);
    },
    photo: (id) => (db.getPlayer(id)?.public === false ? undefined : db.photo(id)),
  };
}

/** Each hidden player's id, and the stand-in the public site answers with instead. */
export function hiddenIds(db: Db): Map<string, string> {
  return new Map(
    db
      .players({ includeArchived: true })
      .filter((p) => !p.public)
      .map((p, i) => [p.id, `hidden-${i + 1}`]),
  );
}

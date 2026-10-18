// Players, matches and the matches' append-only event logs (docs/adr/0002).

import { DatabaseSync } from "node:sqlite";
import type { MatchEvent, X01Settings } from "@n4/engine";
import type { Player } from "./api.ts";

export interface MatchRecord {
  id: string;
  /** Station the match is played on; a match can exist without one. */
  station: number | null;
  settings: X01Settings;
  /** Display names in throwing order. */
  players: string[];
  /** Set when the match is over or abandoned; the station is free again. */
  closedAt: string | null;
}

/** An engine event plus whatever the server records alongside it (e.g. board coordinates). */
export type StoredEvent = MatchEvent & Record<string, unknown>;

export interface Db {
  /** Alphabetical; archived players only when asked for. */
  players(options?: { includeArchived?: boolean }): Player[];
  getPlayer(id: string): Player | undefined;
  /** The player with this name, ignoring case, if any. */
  playerNamed(name: string): Player | undefined;
  addPlayer(player: Player): void;
  updatePlayer(player: Player): void;
  deletePlayer(id: string): void;
  createMatch(match: Omit<MatchRecord, "closedAt">): void;
  getMatch(id: string): MatchRecord | undefined;
  /** The station's current match, if any. */
  openMatchOn(station: number): MatchRecord | undefined;
  closeMatch(id: string): void;
  append(matchId: string, event: StoredEvent): void;
  events(matchId: string): StoredEvent[];
  close(): void;
}

interface MatchRow {
  id: string;
  station: number | null;
  settings: string;
  players: string;
  closed_at: string | null;
}

interface PlayerRow {
  id: string;
  name: string;
  archived: number;
}

const toPlayer = (row: PlayerRow): Player => ({
  id: row.id,
  name: row.name,
  archived: row.archived === 1,
});

/** Names are unique ignoring case, including non-ASCII letters (SQLite's NOCASE is ASCII only). */
const nameKey = (name: string) => name.toLocaleLowerCase("und");

const toRecord = (row: MatchRow): MatchRecord => ({
  id: row.id,
  station: row.station,
  settings: JSON.parse(row.settings),
  players: JSON.parse(row.players),
  closedAt: row.closed_at,
});

/** Opens (and if needed creates) the database; `:memory:` for tests. */
export function openDb(path: string): Db {
  const db = new DatabaseSync(path);
  db.exec(`
    pragma journal_mode = wal;
    create table if not exists players (
      id text primary key,
      name text not null,
      name_key text not null unique,
      archived integer not null default 0,
      created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ'))
    );
    create table if not exists matches (
      id text primary key,
      station integer,
      settings text not null,
      players text not null,
      created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ')),
      closed_at text
    );
    create table if not exists match_events (
      match_id text not null references matches(id),
      seq integer not null,
      at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ')),
      event text not null,
      primary key (match_id, seq)
    );
  `);

  const selectPlayers = db.prepare("select * from players where archived = 0 or ?");
  const selectPlayer = db.prepare("select * from players where id = ?");
  const selectPlayerByKey = db.prepare("select * from players where name_key = ?");
  const insertPlayer = db.prepare(
    "insert into players (id, name, name_key, archived) values (?, ?, ?, ?)",
  );
  const updatePlayerStmt = db.prepare(
    "update players set name = ?, name_key = ?, archived = ? where id = ?",
  );
  const deletePlayerStmt = db.prepare("delete from players where id = ?");

  const insertMatch = db.prepare(
    "insert into matches (id, station, settings, players) values (?, ?, ?, ?)",
  );
  const selectMatch = db.prepare("select * from matches where id = ?");
  const selectOpen = db.prepare(
    "select * from matches where station = ? and closed_at is null order by created_at desc limit 1",
  );
  const closeStmt = db.prepare(
    "update matches set closed_at = strftime('%Y-%m-%dT%H:%M:%fZ') where id = ? and closed_at is null",
  );
  const insertEvent = db.prepare(`
    insert into match_events (match_id, seq, event)
    values (?, (select coalesce(max(seq), 0) + 1 from match_events where match_id = ?), ?)
  `);
  const selectEvents = db.prepare("select event from match_events where match_id = ? order by seq");

  return {
    players(options = {}) {
      const rows = selectPlayers.all(options.includeArchived ? 1 : 0) as unknown as PlayerRow[];
      return rows.map(toPlayer).sort((a, b) => a.name.localeCompare(b.name));
    },
    getPlayer(id) {
      const row = selectPlayer.get(id) as PlayerRow | undefined;
      return row && toPlayer(row);
    },
    playerNamed(name) {
      const row = selectPlayerByKey.get(nameKey(name)) as PlayerRow | undefined;
      return row && toPlayer(row);
    },
    addPlayer(player) {
      insertPlayer.run(player.id, player.name, nameKey(player.name), player.archived ? 1 : 0);
    },
    updatePlayer(player) {
      updatePlayerStmt.run(player.name, nameKey(player.name), player.archived ? 1 : 0, player.id);
    },
    deletePlayer(id) {
      deletePlayerStmt.run(id);
    },
    createMatch(match) {
      insertMatch.run(
        match.id,
        match.station,
        JSON.stringify(match.settings),
        JSON.stringify(match.players),
      );
    },
    getMatch(id) {
      const row = selectMatch.get(id) as MatchRow | undefined;
      return row && toRecord(row);
    },
    openMatchOn(station) {
      const row = selectOpen.get(station) as MatchRow | undefined;
      return row && toRecord(row);
    },
    closeMatch(id) {
      closeStmt.run(id);
    },
    append(matchId, event) {
      insertEvent.run(matchId, matchId, JSON.stringify(event));
    },
    events(matchId) {
      return (selectEvents.all(matchId) as { event: string }[]).map((row) => JSON.parse(row.event));
    },
    close() {
      db.close();
    },
  };
}

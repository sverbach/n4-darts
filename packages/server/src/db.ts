// Players, matches and the matches' append-only event logs (docs/adr/0002).

import { DatabaseSync } from "node:sqlite";
import type { MatchEvent, X01Settings } from "@n4/engine";
import type { Player } from "./api.ts";

export interface MatchRecord {
  id: string;
  /** Station the match is played on; a match can exist without one. */
  station: number | null;
  settings: X01Settings;
  /** Player ids in throwing order. */
  playerIds: string[];
  /** Id of the player who won; follows the log (an undo can take a win back). */
  winner: string | null;
  /** Closed without a result; never counts for anything. */
  abandoned: boolean;
  /** Set when the match is over or abandoned; the station is free again. */
  closedAt: string | null;
}

/** A station as configured in /admin. */
export interface StationConfig {
  id: number;
  name: string;
  /** Board Manager base URL, e.g. `http://192.168.1.139:3180`. */
  boardUrl: string;
}

/** An engine event plus whatever the server records alongside it (e.g. board coordinates). */
export type StoredEvent = MatchEvent & Record<string, unknown>;

export interface Db {
  stationConfigs(): StationConfig[];
  getStationConfig(id: number): StationConfig | undefined;
  /** Adds the station, or replaces the one with the same id. */
  saveStation(config: StationConfig): void;
  deleteStation(id: number): void;
  /** Whether stations were ever seeded from `STATIONS`; it only happens once per database. */
  stationsSeeded(): boolean;
  markStationsSeeded(): void;
  /** Alphabetical; archived players only when asked for. */
  players(options?: { includeArchived?: boolean }): Player[];
  getPlayer(id: string): Player | undefined;
  /** The player with this name, ignoring case, if any. */
  playerNamed(name: string): Player | undefined;
  addPlayer(player: Player): void;
  updatePlayer(player: Player): void;
  deletePlayer(id: string): void;
  /** Whether the player is in any match, open or closed. */
  playerHasMatches(id: string): boolean;
  createMatch(match: Pick<MatchRecord, "id" | "station" | "settings" | "playerIds">): void;
  getMatch(id: string): MatchRecord | undefined;
  /** The station's current match, if any. */
  openMatchOn(station: number): MatchRecord | undefined;
  /** Changes the throwing order; only before the match has started. */
  setOrder(id: string, playerIds: string[]): void;
  setWinner(id: string, playerId: string | null): void;
  closeMatch(id: string, options?: { abandoned?: boolean }): void;
  /** Closed matches (finished or abandoned), most recently closed first. */
  closedMatches(limit?: number): MatchRecord[];
  /** Removes a match and its log entirely, e.g. one that was set up but never started. */
  deleteMatch(id: string): void;
  append(matchId: string, event: StoredEvent): void;
  events(matchId: string): StoredEvent[];
  close(): void;
}

/**
 * Bumped when the schema changes incompatibly. Version 0 is the walking skeleton's, whose test
 * matches only had player names: they're dropped, not migrated (players-and-matches spec).
 */
const SCHEMA_VERSION = 1;

interface MatchRow {
  id: string;
  station: number | null;
  settings: string;
  winner: string | null;
  abandoned: number;
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

/** Opens (and if needed creates) the database; `:memory:` for tests. */
export function openDb(path: string): Db {
  const db = new DatabaseSync(path);
  db.exec("pragma journal_mode = wal; pragma foreign_keys = on;");
  const { user_version: version } = db.prepare("pragma user_version").get() as {
    user_version: number;
  };
  if (version < 1) db.exec("drop table if exists match_events; drop table if exists matches;");
  db.exec(`
    create table if not exists meta (
      key text primary key,
      value text not null
    );
    create table if not exists stations (
      id integer primary key,
      name text not null,
      board_url text not null
    );
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
      created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ')),
      winner text references players(id),
      abandoned integer not null default 0,
      closed_at text
    );
    create table if not exists match_players (
      match_id text not null references matches(id) on delete cascade,
      position integer not null,
      player_id text not null references players(id),
      primary key (match_id, position)
    );
    create index if not exists match_players_by_player on match_players(player_id);
    create table if not exists match_events (
      match_id text not null references matches(id) on delete cascade,
      seq integer not null,
      at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ')),
      event text not null,
      primary key (match_id, seq)
    );
    pragma user_version = ${SCHEMA_VERSION};
  `);

  const selectStations = db.prepare("select * from stations order by id");
  const selectStation = db.prepare("select * from stations where id = ?");
  const upsertStation = db.prepare(
    "insert into stations (id, name, board_url) values (?, ?, ?) on conflict(id) do update set name = excluded.name, board_url = excluded.board_url",
  );
  const deleteStationStmt = db.prepare("delete from stations where id = ?");
  const selectMeta = db.prepare("select value from meta where key = ?");
  const upsertMeta = db.prepare(
    "insert into meta (key, value) values (?, ?) on conflict(key) do update set value = excluded.value",
  );
  const toStation = (row: { id: number; name: string; board_url: string }): StationConfig => ({
    id: row.id,
    name: row.name,
    boardUrl: row.board_url,
  });

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
  const selectPlayerMatch = db.prepare("select 1 from match_players where player_id = ? limit 1");

  const insertMatch = db.prepare("insert into matches (id, station, settings) values (?, ?, ?)");
  const insertMatchPlayer = db.prepare(
    "insert into match_players (match_id, position, player_id) values (?, ?, ?)",
  );
  const deleteMatchPlayers = db.prepare("delete from match_players where match_id = ?");
  const selectMatchPlayers = db.prepare(
    "select player_id from match_players where match_id = ? order by position",
  );
  const selectMatch = db.prepare("select * from matches where id = ?");
  const selectOpen = db.prepare(
    "select * from matches where station = ? and closed_at is null order by created_at desc limit 1",
  );
  const winnerStmt = db.prepare("update matches set winner = ? where id = ?");
  const closeStmt = db.prepare(
    "update matches set closed_at = strftime('%Y-%m-%dT%H:%M:%fZ'), abandoned = ? where id = ? and closed_at is null",
  );
  const deleteMatchStmt = db.prepare("delete from matches where id = ?");
  const selectClosed = db.prepare(
    "select * from matches where closed_at is not null order by closed_at desc, rowid desc limit ?",
  );
  const insertEvent = db.prepare(`
    insert into match_events (match_id, seq, event)
    values (?, (select coalesce(max(seq), 0) + 1 from match_events where match_id = ?), ?)
  `);
  const selectEvents = db.prepare("select event from match_events where match_id = ? order by seq");

  /** Runs `fn` in a transaction. */
  function transaction(fn: () => void) {
    db.exec("begin");
    try {
      fn();
      db.exec("commit");
    } catch (error) {
      db.exec("rollback");
      throw error;
    }
  }

  function writeOrder(id: string, playerIds: string[]) {
    deleteMatchPlayers.run(id);
    for (const [position, playerId] of playerIds.entries()) {
      insertMatchPlayer.run(id, position, playerId);
    }
  }

  const toRecord = (row: MatchRow): MatchRecord => ({
    id: row.id,
    station: row.station,
    settings: JSON.parse(row.settings),
    playerIds: (selectMatchPlayers.all(row.id) as { player_id: string }[]).map((r) => r.player_id),
    winner: row.winner,
    abandoned: row.abandoned === 1,
    closedAt: row.closed_at,
  });

  return {
    stationConfigs() {
      return (selectStations.all() as { id: number; name: string; board_url: string }[]).map(
        toStation,
      );
    },
    getStationConfig(id) {
      const row = selectStation.get(id) as
        | { id: number; name: string; board_url: string }
        | undefined;
      return row && toStation(row);
    },
    saveStation(config) {
      upsertStation.run(config.id, config.name, config.boardUrl);
    },
    deleteStation(id) {
      deleteStationStmt.run(id);
    },
    stationsSeeded() {
      return selectMeta.get("stations_seeded") !== undefined;
    },
    markStationsSeeded() {
      upsertMeta.run("stations_seeded", new Date().toISOString());
    },
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
    playerHasMatches(id) {
      return selectPlayerMatch.get(id) !== undefined;
    },
    createMatch(match) {
      transaction(() => {
        insertMatch.run(match.id, match.station, JSON.stringify(match.settings));
        writeOrder(match.id, match.playerIds);
      });
    },
    getMatch(id) {
      const row = selectMatch.get(id) as MatchRow | undefined;
      return row && toRecord(row);
    },
    openMatchOn(station) {
      const row = selectOpen.get(station) as MatchRow | undefined;
      return row && toRecord(row);
    },
    setOrder(id, playerIds) {
      transaction(() => writeOrder(id, playerIds));
    },
    setWinner(id, playerId) {
      winnerStmt.run(playerId, id);
    },
    closeMatch(id, options = {}) {
      closeStmt.run(options.abandoned ? 1 : 0, id);
    },
    closedMatches(limit = 200) {
      return (selectClosed.all(limit) as unknown as MatchRow[]).map(toRecord);
    },
    deleteMatch(id) {
      deleteMatchStmt.run(id);
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

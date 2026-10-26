// Players, matches and the matches' append-only event logs (docs/adr/0002).

import { DatabaseSync } from "node:sqlite";
import type { MatchEvent, X01Settings } from "@n4/engine";
import type { Player, PlayerInput } from "./api.ts";
import type { Entrant, Placing, TournamentConfig } from "./tournament/types.ts";

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
  /** The tournament the match belongs to, and its place in it (e.g. a group fixture). */
  tournamentId: string | null;
  slot: string | null;
  /** Shown at the station, e.g. "Group A · match 4". */
  label: string | null;
  /** Won without being played (the opponent withdrew); never counts for stats. */
  walkover: boolean;
  /** Held back by the organiser: the scheduler skips it. */
  held: boolean;
  /** Only goes to this station. */
  pinnedStation: number | null;
  /**
   * How long each leg took, in minutes, for the duration estimate (estimate.ts). Worked out once
   * the match is over and stored; null until then, and again whenever its log changes.
   */
  legMinutes: number[] | null;
}

export type NewMatch = Pick<MatchRecord, "id" | "station" | "settings" | "playerIds"> &
  Partial<Pick<MatchRecord, "tournamentId" | "slot" | "label">>;

export type TournamentStatus = "draft" | "running" | "finished";

export interface TournamentRecord {
  id: string;
  name: string;
  status: TournamentStatus;
  config: TournamentConfig;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  /** Set when the tournament is finished. */
  placings: Placing[] | null;
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
  addPlayer(player: PlayerInput): void;
  updatePlayer(player: PlayerInput): void;
  /** Also removes their photo. */
  deletePlayer(id: string): void;
  /** Stores (or replaces) the player's photo, a JPEG. */
  setPhoto(playerId: string, jpeg: Uint8Array): void;
  photo(playerId: string): { jpeg: Uint8Array; version: string } | undefined;
  deletePhoto(playerId: string): void;
  /** Whether the player is in any match, open or closed. */
  playerHasMatches(id: string): boolean;
  createMatch(match: NewMatch): void;
  /** Puts a match on a station, or takes it off (back to the queue). */
  setStation(id: string, station: number | null): void;
  setHeld(id: string, held: boolean): void;
  setPinnedStation(id: string, station: number | null): void;
  /** Closes a match as won by walkover. */
  closeAsWalkover(id: string, winner: string): void;
  tournamentMatches(tournamentId: string): MatchRecord[];
  /** Players in an open match that's on a station. */
  busyPlayerIds(): Set<string>;
  /** When each player's most recent match closed. */
  lastClosedAt(): Map<string, string>;
  isStationPaused(id: number): boolean;
  setStationPaused(id: number, paused: boolean): void;
  createTournament(tournament: TournamentRecord): void;
  saveTournament(tournament: TournamentRecord): void;
  getTournament(id: string): TournamentRecord | undefined;
  /** Removes a tournament and its entrants (a discarded draft). */
  deleteTournament(id: string): void;
  /** The draft or running tournament, if any; there's at most one. */
  activeTournament(): TournamentRecord | undefined;
  /** All tournaments, newest first. */
  tournaments(): TournamentRecord[];
  entrants(tournamentId: string): Entrant[];
  setEntrants(tournamentId: string, entrants: Entrant[]): void;
  /** The match's events with when they were recorded. */
  timedEvents(matchId: string): { at: string; event: StoredEvent }[];
  getMatch(id: string): MatchRecord | undefined;
  /** The station's current match, if any. */
  openMatchOn(station: number): MatchRecord | undefined;
  /** Changes the throwing order; only before the match has started. */
  setOrder(id: string, playerIds: string[]): void;
  setWinner(id: string, playerId: string | null): void;
  closeMatch(id: string, options?: { abandoned?: boolean }): void;
  /** Stores a match's leg durations; a cache, so it isn't announced as a change. */
  setLegMinutes(id: string, minutes: number[]): void;
  /** The player's completed matches (closed, not abandoned), most recently closed first. */
  completedMatchesOf(playerId: string, limit: number): MatchRecord[];
  /** Closed matches (finished or abandoned), most recently closed first. */
  closedMatches(limit?: number): MatchRecord[];
  /** Removes a match and its log entirely, e.g. one that was set up but never started. */
  deleteMatch(id: string): void;
  /** Appends to the match's log; `at` defaults to now (tests pass their own). */
  append(matchId: string, event: StoredEvent, at?: string): void;
  events(matchId: string): StoredEvent[];
  /** Writes a consistent copy of the whole database to `path` (which must not exist yet). */
  backupTo(path: string): void;
  /** Called after every write; `matchId` names the match it touched, if any. */
  onChange(listener: (change: DbChange) => void): () => void;
  close(): void;
}

export interface DbChange {
  matchId: string | null;
}

/** Writes that take a match id as their first argument. */
const MATCH_WRITES = [
  "setStation",
  "setHeld",
  "setPinnedStation",
  "closeAsWalkover",
  "setOrder",
  "setWinner",
  "closeMatch",
  "deleteMatch",
  "append",
] as const;
const OTHER_WRITES = [
  "saveStation",
  "deleteStation",
  "addPlayer",
  "updatePlayer",
  "deletePlayer",
  "createMatch",
  "setStationPaused",
  "createTournament",
  "saveTournament",
  "deleteTournament",
  "setEntrants",
  "setPhoto",
  "deletePhoto",
] as const;

/**
 * Bumped when the schema changes incompatibly. Version 0 is the walking skeleton's, whose test
 * matches only had player names: they're dropped, not migrated (players-and-matches spec).
 */
const SCHEMA_VERSION = 4;

interface MatchRow {
  id: string;
  station: number | null;
  settings: string;
  winner: string | null;
  abandoned: number;
  closed_at: string | null;
  tournament_id: string | null;
  slot: string | null;
  label: string | null;
  walkover: number;
  held: number;
  pinned_station: number | null;
  leg_minutes: string | null;
}

interface TournamentRow {
  id: string;
  name: string;
  status: TournamentStatus;
  config: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  placings: string | null;
}

/** Columns added to `matches` in schema version 2 (tournaments). */
const MATCH_COLUMNS_V2 = {
  tournament_id: "text",
  slot: "text",
  label: "text",
  walkover: "integer not null default 0",
  held: "integer not null default 0",
  pinned_station: "integer",
};

/** Columns added to `matches` in schema version 4. */
const MATCH_COLUMNS_V4 = {
  leg_minutes: "text",
};

interface PlayerRow {
  id: string;
  name: string;
  archived: number;
  photo: string | null;
}

const toPlayer = (row: PlayerRow): Player => ({
  id: row.id,
  name: row.name,
  archived: row.archived === 1,
  photo: row.photo,
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
    create table if not exists tournaments (
      id text primary key,
      name text not null,
      status text not null,
      config text not null,
      created_at text not null,
      started_at text,
      finished_at text,
      placings text
    );
    create table if not exists tournament_players (
      tournament_id text not null references tournaments(id) on delete cascade,
      player_id text not null references players(id),
      seed integer not null,
      group_index integer not null,
      withdrawn integer not null default 0,
      primary key (tournament_id, player_id)
    );
    create table if not exists player_photos (
      player_id text primary key references players(id) on delete cascade,
      jpeg blob not null,
      updated_at text not null
    );
    create table if not exists paused_stations (
      id integer primary key
    );
    create table if not exists match_events (
      match_id text not null references matches(id) on delete cascade,
      seq integer not null,
      at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ')),
      event text not null,
      primary key (match_id, seq)
    );
  `);
  const matchColumns = new Set(
    (db.prepare("pragma table_info(matches)").all() as { name: string }[]).map((c) => c.name),
  );
  for (const [name, type] of Object.entries({ ...MATCH_COLUMNS_V2, ...MATCH_COLUMNS_V4 })) {
    if (!matchColumns.has(name)) db.exec(`alter table matches add column ${name} ${type}`);
  }
  db.exec(`
    create index if not exists matches_by_tournament on matches(tournament_id);
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

  const playerColumns =
    "select p.*, ph.updated_at as photo from players p left join player_photos ph on ph.player_id = p.id";
  const selectPlayers = db.prepare(`${playerColumns} where p.archived = 0 or ?`);
  const selectPlayer = db.prepare(`${playerColumns} where p.id = ?`);
  const selectPlayerByKey = db.prepare(`${playerColumns} where p.name_key = ?`);
  const upsertPhoto = db.prepare(`
    insert into player_photos (player_id, jpeg, updated_at) values (?, ?, ?)
    on conflict (player_id) do update set jpeg = excluded.jpeg, updated_at = excluded.updated_at
  `);
  const selectPhoto = db.prepare("select jpeg, updated_at from player_photos where player_id = ?");
  const deletePhotoStmt = db.prepare("delete from player_photos where player_id = ?");
  const insertPlayer = db.prepare(
    "insert into players (id, name, name_key, archived) values (?, ?, ?, ?)",
  );
  const updatePlayerStmt = db.prepare(
    "update players set name = ?, name_key = ?, archived = ? where id = ?",
  );
  const deletePlayerStmt = db.prepare("delete from players where id = ?");
  const selectPlayerMatch = db.prepare("select 1 from match_players where player_id = ? limit 1");

  const insertMatch = db.prepare(
    "insert into matches (id, station, settings, tournament_id, slot, label) values (?, ?, ?, ?, ?, ?)",
  );
  const setStationStmt = db.prepare("update matches set station = ? where id = ?");
  const setHeldStmt = db.prepare("update matches set held = ? where id = ?");
  const setPinnedStmt = db.prepare("update matches set pinned_station = ? where id = ?");
  const walkoverStmt = db.prepare(
    "update matches set winner = ?, walkover = 1, closed_at = strftime('%Y-%m-%dT%H:%M:%fZ') where id = ? and closed_at is null",
  );
  const selectTournamentMatches = db.prepare(
    "select * from matches where tournament_id = ? order by created_at, rowid",
  );
  const selectBusy = db.prepare(`
    select distinct p.player_id from match_players p join matches m on m.id = p.match_id
    where m.closed_at is null and m.station is not null
  `);
  const selectLastClosed = db.prepare(`
    select p.player_id, max(m.closed_at) as closed_at from match_players p
    join matches m on m.id = p.match_id where m.closed_at is not null group by p.player_id
  `);
  const selectPaused = db.prepare("select 1 from paused_stations where id = ?");
  const insertPaused = db.prepare("insert or ignore into paused_stations (id) values (?)");
  const deletePaused = db.prepare("delete from paused_stations where id = ?");
  const insertTournament = db.prepare(
    "insert into tournaments (id, name, status, config, created_at, started_at, finished_at, placings) values (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const updateTournament = db.prepare(
    "update tournaments set name = ?, status = ?, config = ?, started_at = ?, finished_at = ?, placings = ? where id = ?",
  );
  const selectTournament = db.prepare("select * from tournaments where id = ?");
  const deleteTournamentStmt = db.prepare("delete from tournaments where id = ?");
  const selectActiveTournament = db.prepare(
    "select * from tournaments where status in ('draft', 'running') order by created_at desc limit 1",
  );
  const selectTournaments = db.prepare(
    "select * from tournaments order by created_at desc, rowid desc",
  );
  const selectEntrants = db.prepare(
    "select * from tournament_players where tournament_id = ? order by seed",
  );
  const deleteEntrants = db.prepare("delete from tournament_players where tournament_id = ?");
  const insertEntrant = db.prepare(
    "insert into tournament_players (tournament_id, player_id, seed, group_index, withdrawn) values (?, ?, ?, ?, ?)",
  );
  const selectTimedEvents = db.prepare(
    "select at, event from match_events where match_id = ? order by seq",
  );
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
  const updateLegMinutes = db.prepare("update matches set leg_minutes = ? where id = ?");
  // A new event can change when legs ended (e.g. a correction), so the stored durations go.
  const clearLegMinutes = db.prepare(
    "update matches set leg_minutes = null where id = ? and leg_minutes is not null",
  );
  const selectCompletedOf = db.prepare(`
    select m.* from matches m join match_players p on p.match_id = m.id
    where p.player_id = ? and m.closed_at is not null and m.abandoned = 0 and m.walkover = 0
    order by m.closed_at desc, m.rowid desc limit ?
  `);
  const selectClosed = db.prepare(
    "select * from matches where closed_at is not null order by closed_at desc, rowid desc limit ?",
  );
  const insertEvent = db.prepare(`
    insert into match_events (match_id, seq, event, at)
    values (?, (select coalesce(max(seq), 0) + 1 from match_events where match_id = ?), ?,
      coalesce(?, strftime('%Y-%m-%dT%H:%M:%fZ')))
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
    tournamentId: row.tournament_id,
    slot: row.slot,
    label: row.label,
    walkover: row.walkover === 1,
    held: row.held === 1,
    pinnedStation: row.pinned_station,
    legMinutes: row.leg_minutes === null ? null : JSON.parse(row.leg_minutes),
  });

  const toTournament = (row: TournamentRow): TournamentRecord => ({
    id: row.id,
    name: row.name,
    status: row.status,
    config: JSON.parse(row.config),
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    placings: row.placings ? JSON.parse(row.placings) : null,
  });

  const store: Omit<Db, "onChange"> = {
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
    setPhoto(playerId, jpeg) {
      // Milliseconds, so a quick replace still gets a new version.
      upsertPhoto.run(playerId, jpeg, new Date().toISOString());
    },
    photo(playerId) {
      const row = selectPhoto.get(playerId) as { jpeg: Uint8Array; updated_at: string } | undefined;
      return row && { jpeg: row.jpeg, version: row.updated_at };
    },
    deletePhoto(playerId) {
      deletePhotoStmt.run(playerId);
    },
    playerHasMatches(id) {
      return selectPlayerMatch.get(id) !== undefined;
    },
    createMatch(match) {
      transaction(() => {
        insertMatch.run(
          match.id,
          match.station,
          JSON.stringify(match.settings),
          match.tournamentId ?? null,
          match.slot ?? null,
          match.label ?? null,
        );
        writeOrder(match.id, match.playerIds);
      });
    },
    setStation(id, station) {
      setStationStmt.run(station, id);
    },
    setHeld(id, held) {
      setHeldStmt.run(held ? 1 : 0, id);
    },
    setPinnedStation(id, station) {
      setPinnedStmt.run(station, id);
    },
    closeAsWalkover(id, winner) {
      walkoverStmt.run(winner, id);
    },
    tournamentMatches(tournamentId) {
      return (selectTournamentMatches.all(tournamentId) as unknown as MatchRow[]).map(toRecord);
    },
    busyPlayerIds() {
      return new Set((selectBusy.all() as { player_id: string }[]).map((r) => r.player_id));
    },
    lastClosedAt() {
      const rows = selectLastClosed.all() as { player_id: string; closed_at: string }[];
      return new Map(rows.map((r) => [r.player_id, r.closed_at]));
    },
    isStationPaused(id) {
      return selectPaused.get(id) !== undefined;
    },
    setStationPaused(id, paused) {
      if (paused) insertPaused.run(id);
      else deletePaused.run(id);
    },
    createTournament(t) {
      insertTournament.run(
        t.id,
        t.name,
        t.status,
        JSON.stringify(t.config),
        t.createdAt,
        t.startedAt,
        t.finishedAt,
        t.placings && JSON.stringify(t.placings),
      );
    },
    saveTournament(t) {
      updateTournament.run(
        t.name,
        t.status,
        JSON.stringify(t.config),
        t.startedAt,
        t.finishedAt,
        t.placings && JSON.stringify(t.placings),
        t.id,
      );
    },
    getTournament(id) {
      const row = selectTournament.get(id) as TournamentRow | undefined;
      return row && toTournament(row);
    },
    deleteTournament(id) {
      deleteTournamentStmt.run(id);
    },
    activeTournament() {
      const row = selectActiveTournament.get() as TournamentRow | undefined;
      return row && toTournament(row);
    },
    tournaments() {
      return (selectTournaments.all() as unknown as TournamentRow[]).map(toTournament);
    },
    entrants(tournamentId) {
      const rows = selectEntrants.all(tournamentId) as {
        player_id: string;
        seed: number;
        group_index: number;
        withdrawn: number;
      }[];
      return rows.map((r) => ({
        playerId: r.player_id,
        seed: r.seed,
        group: r.group_index,
        withdrawn: r.withdrawn === 1,
      }));
    },
    setEntrants(tournamentId, entrants) {
      transaction(() => {
        deleteEntrants.run(tournamentId);
        for (const e of entrants) {
          insertEntrant.run(tournamentId, e.playerId, e.seed, e.group, e.withdrawn ? 1 : 0);
        }
      });
    },
    timedEvents(matchId) {
      return (selectTimedEvents.all(matchId) as { at: string; event: string }[]).map((row) => ({
        at: row.at,
        event: JSON.parse(row.event),
      }));
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
    completedMatchesOf(playerId, limit) {
      return (selectCompletedOf.all(playerId, limit) as unknown as MatchRow[]).map(toRecord);
    },
    closedMatches(limit = 200) {
      return (selectClosed.all(limit) as unknown as MatchRow[]).map(toRecord);
    },
    deleteMatch(id) {
      deleteMatchStmt.run(id);
    },
    append(matchId, event, at) {
      insertEvent.run(matchId, matchId, JSON.stringify(event), at ?? null);
      clearLegMinutes.run(matchId);
    },
    setLegMinutes(id, minutes) {
      updateLegMinutes.run(JSON.stringify(minutes), id);
    },
    events(matchId) {
      return (selectEvents.all(matchId) as { event: string }[]).map((row) => JSON.parse(row.event));
    },
    backupTo(path) {
      db.prepare("vacuum into ?").run(path);
    },
    close() {
      db.close();
    },
  };
  return withChanges(store);
}

/** Announces every write to the listeners, after it happened. */
function withChanges(store: Omit<Db, "onChange">): Db {
  const listeners = new Set<(change: DbChange) => void>();
  const announce = (change: DbChange) => {
    for (const listener of listeners) listener(change);
  };
  const db: Db = {
    ...store,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  for (const name of MATCH_WRITES) {
    const write = store[name] as (id: string, ...rest: unknown[]) => void;
    (db[name] as typeof write) = (id, ...rest) => {
      write(id, ...rest);
      announce({ matchId: id });
    };
  }
  for (const name of OTHER_WRITES) {
    const write = store[name] as (...args: unknown[]) => void;
    (db[name] as typeof write) = (...args) => {
      write(...args);
      announce({ matchId: name === "createMatch" ? (args[0] as NewMatch).id : null });
    };
  }
  return db;
}

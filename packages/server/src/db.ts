// Matches and their append-only event logs (docs/adr/0002).

import { DatabaseSync } from "node:sqlite";
import type { MatchEvent, X01Settings } from "@n4/engine";

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

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { openDb } from "./db.ts";

describe("database", () => {
  it("drops the walking skeleton's matches but keeps players", () => {
    const path = join(mkdtempSync(join(tmpdir(), "n4-db-")), "old.db");
    const old = new DatabaseSync(path);
    old.exec(`
      create table players (id text primary key, name text not null, name_key text not null unique,
        archived integer not null default 0, created_at text not null default '');
      insert into players (id, name, name_key) values ('ann', 'Ann', 'ann');
      create table matches (id text primary key, station integer, settings text not null,
        players text not null, created_at text not null default '', closed_at text);
      insert into matches (id, station, settings, players) values ('m1', 1, '{}', '["Ann","Bob"]');
      create table match_events (match_id text not null, seq integer not null, at text not null default '',
        event text not null, primary key (match_id, seq));
      insert into match_events (match_id, seq, event) values ('m1', 1, '{"type":"MatchStarted","firstPlayer":0}');
    `);
    old.close();

    const db = openDb(path);
    expect(db.openMatchOn(1)).toBeUndefined();
    expect(db.events("m1")).toEqual([]);
    expect(db.getPlayer("ann")?.name).toBe("Ann");
    db.close();

    // Opening again keeps what's there now.
    const again = openDb(path);
    again.createMatch({
      id: "m2",
      station: 1,
      settings: {
        startScore: 301,
        inRule: "straight",
        outRule: "straight",
        legsToWin: 1,
        rulesVersion: 1,
      },
      playerIds: ["ann"],
    });
    again.close();
    expect(openDb(path).openMatchOn(1)?.playerIds).toEqual(["ann"]);
  });
});

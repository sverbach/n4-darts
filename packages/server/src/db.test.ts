import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { openDb } from "./db.ts";
import { defaultTournamentConfig } from "./tournament/types.ts";

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

describe("tournament data", () => {
  const settings = {
    startScore: 301,
    inRule: "straight",
    outRule: "straight",
    legsToWin: 1,
    rulesVersion: 1,
  } as const;

  it("upgrades a version 1 database, keeping its matches", () => {
    const path = join(mkdtempSync(join(tmpdir(), "n4-db-")), "v1.db");
    const v1 = new DatabaseSync(path);
    v1.exec(`
      create table players (id text primary key, name text not null, name_key text not null unique,
        archived integer not null default 0, created_at text not null default '');
      insert into players (id, name, name_key) values ('ann', 'Ann', 'ann');
      create table matches (id text primary key, station integer, settings text not null,
        created_at text not null default '', winner text, abandoned integer not null default 0, closed_at text);
      insert into matches (id, station, settings) values ('m1', 1, '${JSON.stringify(settings)}');
      create table match_players (match_id text not null, position integer not null, player_id text not null,
        primary key (match_id, position));
      insert into match_players values ('m1', 0, 'ann');
      pragma user_version = 1;
    `);
    v1.close();

    const db = openDb(path);
    expect(db.openMatchOn(1)).toMatchObject({
      id: "m1",
      playerIds: ["ann"],
      tournamentId: null,
      walkover: false,
      held: false,
      pinnedStation: null,
    });
    db.close();
  });

  it("stores tournaments, entrants and tournament matches", () => {
    const db = openDb(":memory:");
    for (const id of ["ann", "bob"]) db.addPlayer({ id, name: id, archived: false });
    const tournament = {
      id: "t1",
      name: "Friday",
      status: "draft" as const,
      config: defaultTournamentConfig,
      createdAt: "2026-10-18T18:00:00.000Z",
      startedAt: null,
      finishedAt: null,
      placings: null,
    };
    db.createTournament(tournament);
    db.setEntrants("t1", [
      { playerId: "bob", seed: 1, group: 0, withdrawn: false },
      { playerId: "ann", seed: 0, group: 0, withdrawn: true },
    ]);
    db.createMatch({
      id: "m1",
      station: null,
      settings,
      playerIds: ["ann", "bob"],
      tournamentId: "t1",
      slot: "g:0:ann:bob",
      label: "Group A",
    });

    expect(db.activeTournament()).toEqual(tournament);
    expect(db.entrants("t1").map((e) => [e.playerId, e.withdrawn])).toEqual([
      ["ann", true],
      ["bob", false],
    ]);
    expect(db.tournamentMatches("t1")[0]).toMatchObject({ slot: "g:0:ann:bob", label: "Group A" });

    db.saveTournament({
      ...tournament,
      status: "finished",
      placings: [{ playerId: "ann", from: 1, to: 1 }],
    });
    expect(db.activeTournament()).toBeUndefined();
    expect(db.getTournament("t1")?.placings).toEqual([{ playerId: "ann", from: 1, to: 1 }]);

    expect(db.busyPlayerIds()).toEqual(new Set());
    db.setStation("m1", 2);
    expect(db.busyPlayerIds()).toEqual(new Set(["ann", "bob"]));
    db.closeAsWalkover("m1", "bob");
    expect(db.getMatch("m1")).toMatchObject({ winner: "bob", walkover: true });
    expect(db.completedMatchesOf("bob", 10)).toEqual([]);
    db.close();
  });
});

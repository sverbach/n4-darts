import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type Db, openDb } from "../db.ts";
import { backupIfDue, backupName } from "./backups.ts";

let db: Db | undefined;
afterEach(() => {
  db?.close();
  db = undefined;
});

const HOUR = 60 * 60 * 1000;
const quiet = { log: () => {} };

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "n4-backups-"));
  db = openDb(join(dir, "n4-darts.db"));
  db.addPlayer({ id: "ann", name: "Ann", archived: false });
  return { db, backups: join(dir, "backups") };
}

describe("backups", () => {
  it("writes one on a fresh start, and the copy holds the data", () => {
    const { db, backups } = setup();
    const now = new Date(2026, 9, 20, 23, 15);
    expect(backupIfDue(db, backups, { ...quiet, now: () => now })).toBe(true);

    expect(readdirSync(backups)).toEqual(["n4-darts-2026-10-20-2315.db"]);
    const copy = openDb(join(backups, backupName(now)));
    expect(copy.players().map((p) => p.name)).toEqual(["Ann"]);
    copy.close();
  });

  it("writes none while the newest is less than a day old", () => {
    const { db, backups } = setup();
    const start = new Date(2026, 9, 20, 12, 0).getTime();
    backupIfDue(db, backups, { ...quiet, now: () => new Date(start) });

    expect(backupIfDue(db, backups, { ...quiet, now: () => new Date(start + 23 * HOUR) })).toBe(
      false,
    );
    expect(backupIfDue(db, backups, { ...quiet, now: () => new Date(start + 25 * HOUR) })).toBe(
      true,
    );
    expect(readdirSync(backups)).toHaveLength(2);
  });

  it("keeps only the newest 30", () => {
    const { db, backups } = setup();
    const start = new Date(2026, 0, 1, 3, 0).getTime();
    for (let day = 0; day < 33; day++) {
      backupIfDue(db, backups, { ...quiet, now: () => new Date(start + day * 24 * HOUR) });
    }
    const names = readdirSync(backups).sort();
    expect(names).toHaveLength(30);
    expect(names[0]).toBe("n4-darts-2026-01-04-0300.db");
    expect(names.at(-1)).toBe("n4-darts-2026-02-02-0300.db");
  });
});

// Nightly backups (display-and-stats spec): a dated copy of the database in DATA_DIR/backups,
// written when the newest one is more than a day old (checked at start and then every hour, so a
// server that isn't running at night still gets one a day). The newest 30 are kept.

import { existsSync, mkdirSync, readdirSync, rmSync, statSync, utimesSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "../db.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const NAME = /^n4-darts-\d{4}-\d{2}-\d{2}-\d{4}\.db$/;

export interface BackupOptions {
  keep?: number;
  /** How often to check whether a backup is due. */
  checkMs?: number;
  now?: () => Date;
  log?: (message: string) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** `n4-darts-2026-10-20-2315.db`, in local time. */
export const backupName = (at: Date) =>
  `n4-darts-${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}.db`;

/** The backups in `dir`, oldest first. */
export function backupsIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => NAME.test(name))
    .sort(
      (a, b) => statSync(join(dir, a)).mtimeMs - statSync(join(dir, b)).mtimeMs || (a < b ? -1 : 1),
    );
}

/** Backs up if the newest backup is more than a day old; then prunes. True if it wrote one. */
export function backupIfDue(db: Db, dir: string, options: BackupOptions = {}): boolean {
  const now = options.now?.() ?? new Date();
  const log = options.log ?? console.log;
  mkdirSync(dir, { recursive: true });
  const existing = backupsIn(dir);
  const newest = existing.at(-1);
  if (newest && now.getTime() - statSync(join(dir, newest)).mtimeMs < DAY_MS) return false;

  const path = join(dir, backupName(now));
  if (existsSync(path)) return false;
  db.backupTo(path);
  utimesSync(path, now, now); // Its age is what decides the next one.
  log(`backup written: ${path}`);
  for (const old of backupsIn(dir).slice(0, -(options.keep ?? 30))) rmSync(join(dir, old));
  return true;
}

/** Runs `backupIfDue` now and then every `checkMs`; a failure is logged, never thrown. */
export function startBackups(db: Db, dir: string, options: BackupOptions = {}) {
  const run = () => {
    try {
      backupIfDue(db, dir, options);
    } catch (error) {
      console.error("backup failed:", error);
    }
  };
  run();
  const timer = setInterval(run, options.checkMs ?? 60 * 60 * 1000);
  timer.unref?.();
  return { stop: () => clearInterval(timer) };
}

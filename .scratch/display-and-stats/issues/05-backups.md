# Nightly backups

Status: done
Type: task

- On server start, if the newest file in `DATA_DIR/backups/` is older than 24 h (or there is none), write a backup; then every 24 h while running.
- A backup is `VACUUM INTO 'DATA_DIR/backups/n4-darts-YYYY-MM-DD-HHmm.db'` (consistent while the server runs). Afterwards delete all but the newest 30.
- Log each backup; a failed backup logs an error and doesn't stop the server.
- README: where backups are (in Docker: the `n4-data` volume), and how to restore one (stop the server, copy the file over `n4-darts.db`, remove `-wal`/`-shm`, start).

## Acceptance

- Tests: a backup on a fresh start; none when a recent one exists; only 30 kept; the copy opens and holds the data.

## Comments

**2026-10-20, done.** `backups.ts`: `backupIfDue` writes `VACUUM INTO DATA_DIR/backups/n4-darts-YYYY-MM-DD-HHmm.db` (via the new `db.backupTo`) when the newest backup is more than a day old, sets the file's time to the backup time, and keeps the newest 30. `startBackups` (main) runs it at start and then checks hourly, so a server that's off at night still gets one a day; a failure is logged and the server carries on. README: where backups are, and how to restore (Docker and without).
- Tests: a fresh start writes one and the copy opens with the data; none within a day, one after; 33 days leave the newest 30.
- Checked in Docker: the container writes `/data/backups/…` at start (as the `node` user); the README's restore steps work. File names are in server time, which is UTC in Docker unless `TZ` is set (noted in the README).

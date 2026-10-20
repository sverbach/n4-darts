# Nightly backups

Status: ready-for-agent
Type: task

- On server start, if the newest file in `DATA_DIR/backups/` is older than 24 h (or there is none), write a backup; then every 24 h while running.
- A backup is `VACUUM INTO 'DATA_DIR/backups/n4-darts-YYYY-MM-DD-HHmm.db'` (consistent while the server runs). Afterwards delete all but the newest 30.
- Log each backup; a failed backup logs an error and doesn't stop the server.
- README: where backups are (in Docker: the `n4-data` volume), and how to restore one (stop the server, copy the file over `n4-darts.db`, remove `-wal`/`-shm`, start).

## Acceptance

- Tests: a backup on a fresh start; none when a recent one exists; only 30 kept; the copy opens and holds the data.

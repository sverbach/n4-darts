# The server's read-only public mode

Status: done
Type: task

## What to do

- `N4_PUBLIC=1` starts the server as the public process: it registers only the public read routes (leaderboard, profiles, photos, tournaments, matches, the public session), opens the database read-only, and starts no stations, board gateway, scheduler or backups.
- The route set is defined in the code in one place, so a new route is private unless added there.

## Acceptance

- A test walks every registered route of the normal app and checks the public app answers 404 for each one not on the public list, and that no `POST`/`PUT`/`PATCH`/`DELETE` and no `/live` route exists.
- The public process runs next to the normal one on the same database file without locking it (test with both open).

## Comments

2026-11-03: Built. `N4_PUBLIC=1` makes `main.ts` open the database read-only (`openDb(path, { readOnly: true })`: no migration; refuses a database whose schema version differs, so the room's server must have opened it first) and start `buildPublicApp` (`app.ts`): the one place the public routes are registered. No stations, gateway, scheduler or backups. The photo route moved to `registerPlayerPhoto` so both apps share it. The public process gets no change events from the room's server, so Stats clears its per-match cache when `pragma data_version` changes (`Db.dataVersion()`); without that a correction made in the room never reached the public stats. Tests (`testing/integration/publicApp.test.ts`): the public route list exactly, every other route of the room's app 404s publicly, both processes on one file (reads follow writes, writes refused), a correction reaches the public leaderboard, a fresh database is refused. Tried against the dev database next to `pnpm dev:sim`.

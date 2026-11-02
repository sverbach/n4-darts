# The server's read-only public mode

Status: needs-triage
Type: task

## What to do

- `N4_PUBLIC=1` starts the server as the public process: it registers only the public read routes (leaderboard, profiles, photos, tournaments, matches, the public session), opens the database read-only, and starts no stations, board gateway, scheduler or backups.
- The route set is defined in the code in one place, so a new route is private unless added there.

## Acceptance

- A test walks every registered route of the normal app and checks the public app answers 404 for each one not on the public list, and that no `POST`/`PUT`/`PATCH`/`DELETE` and no `/live` route exists.
- The public process runs next to the normal one on the same database file without locking it (test with both open).

# The views get the queue from Scheduling, not from Tournaments

Status: needs-triage
Type: task

Scheduling depends on Tournaments: `scheduler.ts` takes `Tournaments` to get the next ready match. But `tournamentView.ts` (Tournaments) imports `queueOf` from `scheduler.ts` to fill `progress.queue`, which /admin shows as the queue and `/display` as "Up next". So the modules form a loop: `tournaments.ts` → `tournamentView.ts` → `scheduler.ts` → `tournaments.ts` (`docs/architecture/building-blocks.md`, Observations). It's the same pattern as the awards in ticket 02, and it gets the same fix: the views add the queue from Scheduling. Then the dependency points one way only: Scheduling → Tournaments.

No behaviour changes. This is a refactor.

## Decisions

- **Tournaments drops the queue.** `progressView` no longer imports `scheduler.ts` and leaves `queue` empty (`[]`), with a comment that the views add it, as with `awards`.
- **Scheduling adds it.** `scheduler.ts` exports a function next to `queueOf`, e.g. `withQueue(db, view, plan)`, that fills `progress.queue` with the same entries as today (match id, label, players, ready, held, pinned station). A finished tournament keeps an empty queue.
- **The plan.** `queueOf` needs the tournament's plan for the order. Tournaments exposes it read-only for the active tournament (e.g. `tournaments.plan()`), built the way `view()` builds it now. Don't call it twice per view if it can be avoided: `sync()` isn't free.
- **Where it's applied.** In the same places as `withAwards`: the `tournament()` function in `app.ts` (`GET /api/admin/tournament` and its live stream) and `displayView`. `withQueue` needs the players' names and photos (`matchPlayer`); Scheduling importing `players.ts` is fine.
- **API shape stays.** `TournamentProgress.queue` keeps its type, so the web package doesn't change. Like the awards, the tournament's action responses then carry an empty queue. The web reads the tournament only from the live stream.

## Acceptance

- `tournamentView.ts` and `tournaments.ts` have no import from `scheduler.ts`.
- /admin shows the same queue and /display the same "Up next" as before: existing tests, plus an assertion in `tournament.e2e.test.ts` or `overrides.test.ts` that the admin view and `/api/display` list the queued matches while the tournament runs, if no test covers that yet. Check that it fails when `withQueue` does nothing.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:**
  - `docs/architecture/building-blocks.md`: drop the `tview --> scheduler` arrow, add a `scheduler --> players` arrow if `withQueue` uses `matchPlayer`, update the Scheduling and Tournaments rows of the module table, and remove the "Tournaments and Scheduling depend on each other" observation.
  - `docs/architecture/functions.md`: check that the diagram still holds (Live views → Scheduling "up next" already says this).

## Comments

# The views get a tournament's awards from Stats, not from Tournaments

Status: done
Type: task

Stats depends on Tournaments (placings, a tournament's matches), but in the code Tournaments also depends on Stats: `createTournaments(db, stations, stats)` hands `stats` to `progressView` in `packages/server/src/tournamentView.ts`, which fills `awards` with `stats.awards(tournament.id)`. That's the second loop in `docs/architecture/functions.md` (Observations). At the business level only Live views needs the awards, so the views should get them from Stats themselves. Then Tournaments no longer needs Stats.

No behaviour changes. This is a refactor.

## Decisions

- **Tournaments drops Stats.** `createTournaments` and `progressView` lose the `stats` parameter. `tournaments.ts` and `tournamentView.ts` no longer import `stats.ts`.
- **The views add the awards.** Where a view is put together from both:
  - `/api/display` and its live stream: `displayView` already has `stats`, so it calls `stats.awards(...)` itself instead of reading `progress.awards`.
  - `/api/admin/tournament` and its live stream (the organiser's tournament page, `TournamentRun.tsx`): the route adds the awards to the view next to `tournaments.view()`, e.g. a small function in `app.ts` or a `withAwards(view, stats)` helper.
- **Same rule as now.** Awards only once the tournament is finished with placings; otherwise `null`.
- **API shape stays.** `TournamentProgress.awards` and `DisplayView.awards` keep their type, so the web package doesn't change. If moving `awards` out of `TournamentProgress` reads cleaner, that's fine too, as long as the pages show the same thing.

## Acceptance

- `tournaments.ts` and `tournamentView.ts` have no import from `stats.ts`.
- The projector and the organiser's tournament page show the awards after the final exactly as before (existing tests, plus one if no test covers awards on the admin view).
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:** in `docs/architecture/functions.md`, the "Awards sit in Stats, but belong to a tournament" observation drops the paragraph about the loop in the code and the suggested fix, keeping only that awards live in Stats and are shown by Live views.

## Comments

2026-10-31: Confirmed by the user as written.

2026-10-31: Built. `Stats.withAwards(view)` fills `progress.awards` of a finished tournament with a champion; `progressView` leaves it `null`. `createTournaments` and `progressView` no longer take `stats`, and `tournaments.ts` / `tournamentView.ts` don't import `stats.ts`. `GET /api/admin/tournament` moved from `registerTournaments` to `app.ts`, next to its live stream, so both go through `withAwards`; `displayView` applies it too. The tournament's action responses (create, start, withdraw…) now carry `awards: null`, which is fine because the web reads the tournament only from the live stream. The API types are unchanged. New assertions in `tournament.e2e.test.ts`: after the final, `/api/admin/tournament` and `/api/display` both have the awards (checked to fail when `withAwards` does nothing). All checks pass. `docs/architecture/functions.md`: awards observation shortened.

# The organiser's player list gets the rating without Players depending on Ratings

Status: done
Type: task

`functions.md` has Players depending on nothing, but `players.ts` imports `ratingOf` from `ratings.ts`, because `GET /api/admin/players` shows each player's rating (`docs/architecture/building-blocks.md`, Observations). The rating isn't Players' business; the list only shows it. Players should get the rating handed in, as Matches gets its `ResultGuard` (ticket 01). Then Players depends on nothing again.

No behaviour changes. This is a refactor.

## Decisions

- **Hand the rating in.** `registerPlayers(app, db, ratingOf)` takes a function `(playerId: string) => number | null`. `app.ts` passes `(id) => ratingOf(db, id)`. `players.ts` no longer imports `ratings.ts`.
- **Required, not optional.** The list always shows a rating; there's no caller without one. Tests that call `registerPlayers` directly, if any, pass `() => null` or the real one.
- **API shape stays.** `AdminPlayer.rating` keeps its type, so the web package doesn't change.

## Acceptance

- `players.ts` has no import from `ratings.ts`.
- The organiser's player list shows the same ratings as before (existing tests in `players.test.ts`, plus one if none checks the rating on `GET /api/admin/players`).
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:** in `docs/architecture/building-blocks.md`, drop the `players --> ratings` arrow and remove the "Players depends on Ratings" observation. `functions.md` needs no change (Players already depends on nothing).

## Comments

2026-10-31: Confirmed by the user as written.

2026-10-31: Built. `registerPlayers(app, db, ratingOf)`; `app.ts` passes `(id) => ratingOf(db, id)`, and `players.ts` no longer imports `ratings.ts`. No new test: `ratings.test.ts` ("shows in the admin player list") already checks the rating on `GET /api/admin/players`, and no test calls `registerPlayers` directly. All checks pass. `building-blocks.md`: arrow and observation removed.

# Rating from match logs

Status: done
Type: task

A player's rating: 3-dart average over their last 10 completed matches (spec: "Rating").

- Pure function over a match's settings + event log: per player, points scored and darts thrown. Busts count their darts for zero points; darts thrown after the visit was over (`ignored`) don't count; corrections apply. Put it next to the engine (it's game logic) or in a small `stats` module in `packages/engine`.
- Server: rating per player from their last 10 closed, non-abandoned matches of any kind (quick, `/admin`, tournament; 2–8 players). Walkovers won't exist until ticket 07; write the query so a walkover flag can exclude them.
- Show the rating in `/admin/players` (e.g. "avg 42.3", or "–" for unseeded).

## Acceptance

- Unit tests: averages with busts, ignored darts, corrections, a checkout on the first dart, multi-player matches.
- Test: only the last 10 completed matches count; abandoned ones don't.

## Comments

**2026-10-18, done.** `packages/engine/src/stats.ts`: `dartStats(settings, events)` (points and darts per player from the folded state: busts count their darts for 0, ignored darts left out, corrections applied) and `threeDartAverage(stats[])`. Server `ratings.ts`: `ratingOf(db, playerId)` over `db.completedMatchesOf(playerId, 10)` (closed, not abandoned; walkovers get excluded when they exist, ticket 07). `GET /api/admin/players` returns `AdminPlayer` with `rating`; `/admin/players` shows it ("–" when unseeded).

# Stats: numbers per player

Status: done
Type: task

- Per completed match and player (engine or server, pure): darts, points, 3-dart average, first-9 average (first three visits of each leg), darts thrown at a one-dart finish and how many hit it (double-out only), checkouts and the highest, 180s, 140+, 100+ visits, legs played and won, fewest darts in a won leg, match won. Same counting rules as the rating (busts count their darts for zero, darts after the visit was over don't count).
- Which matches count: completed, not abandoned, not walkovers, any kind and player count.
- Cache per closed match (in memory or a table), invalidated when the match is corrected.
- `GET /api/players/stats` (public): the leaderboard rows (players with at least one counted match, archived hidden, sorted by rating): name, rating, average, matches, wins, 180s, highest checkout.
- `GET /api/players/:id/stats` (public): the profile: everything above summed up, rating, average per day played, tournaments (date, name, placing, from finished tournaments' placings), the last 20 matches (date, opponents, result, the player's average); tournaments played and won, best placing.

## Acceptance

- Unit tests for each number on hand-written event logs (incl. a bust, a correction, a 3-player match, a non-double-out match for checkout %).
- API tests: a walkover and an abandoned match don't count; a correction changes the numbers.

## Comments

**2026-10-20, done.** Engine: `matchStats(settings, events)` (`packages/engine/src/stats.ts`) per player: darts and points (same rules as `dartStats`), first 9 (first three visits of each leg), darts at a one-dart finish and hits (double-out only: a double ≤ 40 or the bull), highest checkout, 180 / 140–179 / 100–139 visits, legs played and won, best leg, won. Server `stats.ts`: `createStats(db)` caches each match's numbers until the database reports a change to that match (`db.onChange`), sums them per player over counted matches (`completedMatchesOf`: closed, not abandoned, not walkovers), and serves `GET /api/players/stats` (leaderboard: players with a counted match, archived hidden, by rating) and `GET /api/players/:id/stats` (profile: totals, rating, average per evening, finished tournaments with placings, tournaments won, best placing, last 20 matches). Types `StatTotals`, `LeaderboardRow`, `PlayerProfile` in `api.ts`.
- Choices: a match's day is when it started, shifted 6 h back so an evening past midnight counts to the day it began; tournaments count when finished with placings (an ended-early one has none); in a match of 3+ "legs against" is the best opponent's.
- Tests: engine (buckets and first 9, checkout attempts/hits with double and straight out, a bust, legs in a 3-player match, a correction) and API (leaderboard order and archived players, walkovers and abandoned matches left out, a correction changes the numbers, a full profile).

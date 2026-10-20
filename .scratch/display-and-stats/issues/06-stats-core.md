# Stats: numbers per player

Status: ready-for-agent
Type: task

- Per completed match and player (engine or server, pure): darts, points, 3-dart average, first-9 average (first three visits of each leg), darts thrown at a one-dart finish and how many hit it (double-out only), checkouts and the highest, 180s, 140+, 100+ visits, legs played and won, fewest darts in a won leg, match won. Same counting rules as the rating (busts count their darts for zero, darts after the visit was over don't count).
- Which matches count: completed, not abandoned, not walkovers, any kind and player count.
- Cache per closed match (in memory or a table), invalidated when the match is corrected.
- `GET /api/players/stats` (public): the leaderboard rows (players with at least one counted match, archived hidden, sorted by rating): name, rating, average, matches, wins, 180s, highest checkout.
- `GET /api/players/:id/stats` (public): the profile: everything above summed up, rating, average per day played, tournaments (date, name, placing, from finished tournaments' placings), the last 20 matches (date, opponents, result, the player's average); tournaments played and won, best placing.

## Acceptance

- Unit tests for each number on hand-written event logs (incl. a bust, a correction, a 3-player match, a non-double-out match for checkout %).
- API tests: a walkover and an abandoned match don't count; a correction changes the numbers.

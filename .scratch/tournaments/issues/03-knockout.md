# Knockout brackets (pure)

Status: ready-for-agent
Type: task
Blocked by: 02

Pure bracket logic, tested on its own.

- Seeding advancers from final group tables: all group winners (by points, leg difference, average), then runners-up, and so on; with one group, the final positions. Everyone advances with one group by default, otherwise top N per group.
- Single elimination: size = next power of two; byes to the top seeds; usual positions (1 v 8, 4 v 5, …); swaps within a rank so players from the same group don't meet in round 1 where avoidable.
- Double elimination: standard losers bracket (first-round losers meet; later losers drop in placed to avoid rematches); grand final; bracket reset if enabled and the losers-bracket player wins. Byes produce no loser.
- Advancing: given results, which matches are ready and who plays them; a walkover counts as a result. Legs per match: winners / losers / final setting.
- Final placings: 1, 2, 3, 4, then shared places by the round a player went out.

## Acceptance

- Unit tests: brackets for 2–16 advancers (single and double), byes, same-group avoidance, a full double-elimination run with and without bracket reset, placings.

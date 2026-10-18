# Knockout brackets (pure)

Status: done
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

## Comments

**2026-10-18, done.** `tournament/knockout.ts`: `seedAdvancers(tables, advancePerGroup)` (winners, then runners-up, … by points, leg difference, average), `bracketOrder(size)` (1 8 4 5 2 7 3 6), and `knockout(advancers, elimination, bracketReset, results)` which defines every bracket slot from sources (a seed, the winner or loser of another slot) and resolves participants from the results: a player, a bye (nobody will come; the other side advances without a match) or pending. Slots: `w{round}.{n}`, `l{round}.{n}`, `gf`, and `gf2` appears only when the losers-bracket player wins the grand final with bracket reset on. Each slot has a phase (which legs setting), a label and a queue order. Same-group first-round meetings are swapped away within a rank; winners-bracket losers drop into the losers bracket reversed every other round (tested: no rematches in the first two losers rounds for 8 and 16). Placings by stage (`placingsFromStages`), so semi-final losers in single elimination share 3rd.

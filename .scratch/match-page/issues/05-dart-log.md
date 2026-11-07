# Match page: the dart log

Status: done
Type: task
Blocked by: 01

- 2 players: per leg a scoresheet, one row per round, both players' visits side by side (darts and score), the names once on top. Busts and the checkout marked as now.
- 3+ players: the leg list as now, but each visit row with the player's series mark and the full name on its own line instead of the cut-off name column.
- The admin match detail keeps its own log (corrections) unchanged.

Acceptance: checked at 390 px with 2 players and 4; nothing cut off; all checks pass.

## Comments

2026-11-07: Done. `Scoresheet.tsx` for 2 players: a panel per leg (the last open), the round number, both players' darts as text and the visit's total in its own column, "Bust" in red, "Out" on the checkout. 3+ players: `MatchLegs` got an optional `who` (the chip and the full name on a line of its own); admin doesn't pass it and keeps its log. Checked at 390 px with 2 and 3 players: nothing cut off.

All four checked together: typecheck, lint, 833 unit tests, build, e2e (41), the visual suite (9; the match page baseline retaken), and the impeccable detector (0 findings after snapping four font sizes to the type ramp).

# The station's pill and visit line show the takeout

Status: needs-triage
Type: task
Blocked by: 01, 03

## What to do

- `BoardStatus` on the station page: while `takeout` is true, the pill reads "Takeout…" (neutral). After 10 s of the same takeout it turns amber, "Takeout stuck", with a "Reset board" button beside it (the board menu's reset, with its confirmation if it has one). When the takeout ends the pill goes back to the board's status.
- Visit panel: "Taking out…" instead of "Remove darts" while the takeout runs (the line keeps its height).
- The 10 s run on the page from when the flag turned true.

## Acceptance

- Browser test with the simulator's held takeout (03): "Takeout…" appears, then after 10 s "Takeout stuck" and Reset board; pressing it clears the board and the pill returns to "Board online".
- `docs/ui-pages.md` (station, board status) and DESIGN.md (status pill) updated.

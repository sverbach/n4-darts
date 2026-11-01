# The station's pill and visit line show the takeout

Status: done
Type: task
Blocked by: 01, 03

## What to do

- `BoardStatus` on the station page: while `takeout` is true, the pill reads "Takeout…" (neutral). After 10 s of the same takeout it turns amber, "Takeout stuck", with a "Reset board" button beside it (the board menu's reset, with its confirmation if it has one). When the takeout ends the pill goes back to the board's status.
- Visit panel: "Taking out…" instead of "Remove darts" while the takeout runs (the line keeps its height).
- The 10 s run on the page from when the flag turned true.

## Acceptance

- Browser test with the simulator's held takeout (03): "Takeout…" appears, then after 10 s "Takeout stuck" and Reset board; pressing it clears the board and the pill returns to "Board online".
- `docs/ui-pages.md` (station, board status) and DESIGN.md (status pill) updated.

## Comments

2026-11-01: Confirmed by the user.

2026-11-01: Built. `BoardMenu` takes `takeout`: while it's true (and the board online and the server connected) the pill reads "Takeout…" (neutral); after 10 s of the same takeout it turns amber, "Takeout stuck", with a "Reset board" button beside it that runs the menu's reset (no confirmation, as in the menu). A board menu message (e.g. "Board reset") still takes the pill's place for its few seconds. The visit line reads "Taking out…" while the takeout runs, at the same height. Browser test in `station.spec.ts` with the simulator's held takeout: "Takeout…" and "Taking out…", no Reset board yet; "Takeout stuck" and Reset board after 10 s; pressing it brings back "Board online". Visual suite unchanged (no takeout in its fixture). `docs/ui-pages.md` and DESIGN.md (status pill) updated. Not verified on a real board: what Reset does during a real stuck takeout (the API notes say it clears the visit and returns to "Throw").

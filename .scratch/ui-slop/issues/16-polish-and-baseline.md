# Final polish, new visual baseline, re-critique

Status: done
Type: task
Blocked by: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15

## What to do

- `/impeccable polish` over the changed pages: alignment, states, focus, the details the tickets left.
- Check on the real kiosk laptop and projector (as the design-system spec did).
- Re-run `/impeccable critique` on `packages/web/src` and note the score here (first run: 27/40).
- Remaining items from the critique's minor observations: the chart axis "07 Nov" in mixed case, the muted "M" column on the display and admin players, "Not enough darts yet" vs label-style empty states, the "✓" glyph in match detail (labelled icon), the 1px dashed "+ ADD" tile's contrast at distance, the draft's seed rating for Bob (29.2) vs 39.0 on the players page (verify it's a different metric or fix), "Refreshes every 0 seconds" in diagnostics after live-lists 04.

## Acceptance

- The re-critique shows no P1 issues.
- Visual baseline updated and checked.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

2026-11-01: Partly done. Polish: checkouts marked "Out" (labelled, not a glyph), plain count columns, a visible dashed Add tile, the heatmap's empty note a sentence; the design sidecar refreshed from DESIGN.md; the whole visual baseline retaken (`--update-snapshots=all`, so sub-threshold changes are in too). Verified: the draft's seed rating (Bob 29.2) and /players (39.0) use the same calculation; the visual suite shoots the draft after a quick match in which Bob scores 3 in three darts, so it's the fixture's timing, not a bug. Diagnostics already reads "every 2 seconds".

Re-critique (`packages/web/.impeccable/critique/2026-11-01T09-16-50Z__src.md`): 27/40 again, with 3 P1s, so the acceptance "no P1 issues" is not met. The repeats, spacing, type and pill problems from the first run are gone (detector: 1 false positive); what's left is a second layer: violet used as a label colour (station names, ranks, Rating/Pts columns, award values, match labels), the same match shown in several places on the knockout projector and admin, and the score still not filling its card. Open: those, plus the check on the real kiosk laptop and projector (needs the user in the room).

2026-11-01: Closed: what's left (the re-critique's P1s and P2s, the room check, a further re-critique) moved to `.scratch/ui-slop-2/`.

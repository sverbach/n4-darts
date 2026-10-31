# Nothing overflows or clips on a phone

Status: ready-for-agent
Type: task

At 390 px:

- New match: the settings grid runs into the right edge; `grid-cols-[1fr_1fr]` won't shrink below the selects' width (`features/station/StationPage.tsx:145`). Use `minmax(0,1fr)` and `min-w-0` on the selects.
- Admin finished: the placing "3–4" wraps onto two lines (`features/admin/tournament/TournamentRun.tsx:106`, `w-14`): `whitespace-nowrap` and a min-width. ui-bugs 01 fixed only the display. The bracket's FINAL card is clipped at the right; the groups table is cut off.
- Draft: the knockout select reads "Single eli"; selects sit alone on half-width rows (Knockout, Final, Out); "START TOURNAMENT" wraps inside the CTA.
- Admin tabs: "DIAGNOSTICS" clips to "DI" with no sign the strip scrolls.
- Watch at phone width: tiny header and full-height empty cards. Decided: /watch is for big screens only; note it in `docs/ui-pages.md` and drop the `watch-*-phone` shots from the visual suite if it has any. No phone layout.

## Acceptance

- No clipped or wrapped labels in the `*-phone` screenshots; scroll containers show they scroll (edge fade or a visible partial item).
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user. /watch is big screens only.

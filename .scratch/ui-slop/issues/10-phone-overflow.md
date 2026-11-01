# Nothing overflows or clips on a phone

Status: done
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

2026-11-01: Built. New match: the settings grid uses `minmax(0,1fr)` and the selects `min-w-0`, so nothing runs into the edge (the legs select now clips its own text, "First to 1 l…", inside its box). Admin placings "3–4" stay on one line (done with 05). Draft: knockout options "Double" / "Single" (the label says Knockout); an odd last select takes the whole row on a phone; the CTA reads "Start" (named "Start tournament" for screen readers, so tests and assistive tech keep the full name). Admin tabs: the header grid column can shrink (`minmax(0,1fr)`), so the strip scrolls inside itself. New `scroll-x` utility (replaces `table-scroll`): a sideways-scrolling row shows a soft light edge on the side with more, gone at the end (background `local`/`scroll` layers, no JS); used on the admin tabs, the admin group tables and bracket rows, the leaderboard and diagnostics tables. The edge is faint enough to sit under the visual suite's colour threshold, so those shots didn't change; checked in the browser (the right edge brightens to #2b2b2a…#3a). /watch: big screens only, noted in `docs/ui-pages.md`; the visual suite no longer shoots it at phone width (two shots removed).

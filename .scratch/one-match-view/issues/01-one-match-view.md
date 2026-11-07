# One match view: admin's history links to /matches/:id, corrections only at the station

Status: done
Type: task

The user noticed (2026-11-07) that a match opened from `/admin/matches` looks different from the same match on `/matches/:id`. Admin's own match view isn't needed: in practice darts are always corrected at the station during the match, never afterwards.

## Decisions (2026-11-07)

- **Admin's match list stays:** the stations (with live and party matches) and the history (abandoned matches too).
- **A finished match in the history links to `/matches/:id`.** Abandoned matches (no page) are listed but not links.
- **A running match's "Details" becomes "Watch"**, a link to `/watch/n`.
- **Admin's match detail view goes, and so do corrections after the fact**: the detail and live-detail routes, `POST /api/admin/matches/:id/corrections`, `matches.correct`/`follow`, and the "may this result change?" guard (`ResultGuard`, the tournament's `correctionProblem`), which only existed for them.
- **Corrections at the station stay as they are.**
- **Docs:** the requirements (MATCH-05 and TOUR-14 dropped or reworded, QS-02), the runtime view, the decision log, the glossary's Correction, PRODUCT.md, README.

## Acceptance

- The history's rows open `/matches/:id`; abandoned rows don't link; "Watch" opens `/watch/n`.
- The removed routes answer 404; nothing else changes for the station.
- All checks pass, with the tests for admin corrections removed and the e2e tournament test without its correction step.

## Comments

2026-11-07: Done.
- **Server:** the admin detail, live-detail and correction routes are gone, and so are `matches.correct`/`follow`/`detail`, `ResultGuard`, the tournament's `correctionProblem`/`corrected`, `CorrectionInput` and the `MatchDetail` type. `createMatches(db)` keeps `history` and `page`. `MatchSummary` gained `walkover`, so the history knows which rows have no page. `MatchPage` is now defined on its own.
- **Web:** `MatchHistory` rows are links to `/matches/:id`, except abandoned matches and walkovers (plain rows, no arrow; "Walkover" and "No winner" instead of "No winner (corrected)"). The station row's "Details" became a "Watch" link to `/watch/n`. `MatchDetailView` and its dart styles are gone. Station corrections are unchanged.
- **Tests:** `testing/integration/resultChanges.test.ts` and the admin-correction tests were removed (matches, party modes, live detail, the "added" check through the detail route). The e2e tournament test now opens the match from the history instead of correcting a dart; the history test counts list items, since abandoned rows aren't buttons any more; the visual suite lost its admin match detail shot, and the history list looks the same.
- **Docs:** ui-pages (`/admin/matches`), glossary (Correction), requirements (MATCH-05 and TOUR-14 dropped, QS-02 dropped), the building blocks, runtime and crosscutting views, the decision log (a "One match view" entry, the old "Result changes" entry marked dropped), PRODUCT.md, README.
- typecheck, lint, 816 unit tests, build, e2e (41) and the visual suite (9) pass.

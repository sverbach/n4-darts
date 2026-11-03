# A match's page, read-only

Status: done
Type: task

## What to do

- API: `GET /api/matches/:id` for a finished match (players, settings, legs and visits, no correction data).
- Web: `/matches/:id` in the stats frame: the result line, legs collapsed but the last, visits dart by dart (as admin's match detail, without correcting). Linked from a profile's last matches and from a tournament's bracket and results.

## Acceptance

- API test; visual suite gets the page at phone and kiosk width.

## Comments

2026-11-03: Built. API: `GET /api/matches/:id` (`Matches.page`, `MatchPage` type: players, settings, winner, legs won, closed at, the engine state with every leg and visit; no originals, no added darts, no station). 404 for an open, abandoned or walkover match or an unknown id. On the LAN and in the public app. Web: `/matches/:id` in the stats frame (`features/stats/MatchPage.tsx`). The legs and visits moved from admin's match detail into `components/MatchLegs.tsx`, which takes how to draw a dart (admin: the correction button; here: the value); admin's snapshots are unchanged. Linked from a profile's last matches, a tournament's bracket (`MatchCard` takes an `href`) and its group results. Tests: `matches.test.ts` (page, 404s), the public redaction in `publicApp.test.ts`, visual suite (match at phone and kiosk). docs/ui-pages.md updated.

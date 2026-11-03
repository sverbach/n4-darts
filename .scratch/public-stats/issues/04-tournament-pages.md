# Past tournaments: a list and a page each

Status: done
Type: task

Only /display and admin show a finished tournament today, and only the latest.

## What to do

- API: `GET /api/tournaments` (finished ones: name, date, champion) and `GET /api/tournaments/:id` (placings, awards, groups with tables and results, bracket).
- Web: `/tournaments` and `/tournaments/:id`, in the stats pages' frame: placings and awards like /display's finished view, the groups and the bracket below. Linked from a profile's tournaments list and from /players.
- Available on the LAN and (in 06) publicly.

## Acceptance

- API tests; visual suite gets the two pages at phone and kiosk width.

## Comments

2026-11-03: Built. API: `GET /api/tournaments` (finished ones, newest first: name, date, champion) and `GET /api/tournaments/:id` (placings, awards, groups with tables and results, bracket; 404 for an unknown or unfinished one), from `tournaments/past.ts` with the awards from Stats (`pastWithAwards` in app.ts), on the LAN and in the public app. A finished tournament's view no longer works out the expected end, which wrote leg durations: the public database is read-only. `resultOf` moved to `tournaments/results.ts`. Web: `/tournaments` and `/tournaments/:id` in the stats frame (`features/stats/TournamentPages.tsx`; the frame and row styles moved to `frame.tsx`). Placings, group tables and the bracket moved from admin into `components/TournamentResults.tsx` and are shared; admin's snapshots are unchanged. Linked from /players ("Tournaments ▶") and a profile's tournaments. Hidden player ids were also inside match slots (`g:0:<id>:<id>`), so the public app now replaces them anywhere in an answer. Tests: `past.test.ts`, the public tournament redaction in `publicApp.test.ts`, visual suite (tournaments, tournament at phone and kiosk; players changed for the link). docs/ui-pages.md updated.

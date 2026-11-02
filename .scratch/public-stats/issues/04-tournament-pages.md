# Past tournaments: a list and a page each

Status: needs-triage
Type: task

Only /display and admin show a finished tournament today, and only the latest.

## What to do

- API: `GET /api/tournaments` (finished ones: name, date, champion) and `GET /api/tournaments/:id` (placings, awards, groups with tables and results, bracket).
- Web: `/tournaments` and `/tournaments/:id`, in the stats pages' frame: placings and awards like /display's finished view, the groups and the bracket below. Linked from a profile's tournaments list and from /players.
- Available on the LAN and (in 06) publicly.

## Acceptance

- API tests; visual suite gets the two pages at phone and kiosk width.

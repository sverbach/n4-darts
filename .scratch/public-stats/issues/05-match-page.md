# A match's page, read-only

Status: ready-for-agent
Type: task

## What to do

- API: `GET /api/matches/:id` for a finished match (players, settings, legs and visits, no correction data).
- Web: `/matches/:id` in the stats frame: the result line, legs collapsed but the last, visits dart by dart (as admin's match detail, without correcting). Linked from a profile's last matches and from a tournament's bracket and results.

## Acceptance

- API test; visual suite gets the page at phone and kiosk width.

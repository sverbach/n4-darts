# The match history live

Status: ready-for-agent
Type: task

/admin matches shows the history list (`features/admin/matches/MatchHistory.tsx`) from `/api/admin/matches`, fetched once. A match that finishes while the organiser looks at it only shows after a reload (`../spec.md`). The match detail is already live (`/api/admin/matches/:id/live`).

## What to do

- Server: `/api/admin/matches/live`, on the change feed with `streamView`, behind the PIN.
- Web: `MatchHistory` reads it with `useLive`; remove the one-shot route if nothing else uses it.

## Acceptance

- A match finished at a station appears in an open history without a reload; a correction that changes a result shows too.
- A server test for the stream; a browser test for the finished match appearing.
- The visual suite passes unchanged.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/05-building-block-view.md` and wherever the routes are listed.

## Comments

2026-10-31: Confirmed by the user.

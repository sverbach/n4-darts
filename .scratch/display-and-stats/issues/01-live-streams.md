# Live streams for the tournament

Status: done
Type: task

- A change feed on the server: one place that announces "something changed" whenever a station's view changes, a match is appended to or closed, or the tournament changes (start, sync, overrides, withdrawals, corrections).
- Public `GET /api/display/live` (SSE): the display view on connect and after every change, debounced (one push per turn of the event loop at most). The display view: the tournament (name, phase, played of total) or none; per station a short scoreboard (label, names, legs won, remaining scores, who's throwing, current visit's darts); up next (first 5 of the queue: label, names); group tables; bracket; placings once finished. Shared types in `api.ts`.
- Admin `GET /api/admin/tournament/live` (SSE, behind the PIN): the same `TournamentAdminView` the GET returns, pushed on every change.
- Admin `GET /api/admin/matches/:id/live` (SSE, behind the PIN): the match detail, pushed when that match changes.
- Streams clean up on disconnect, keep-alive like the station stream.

## Acceptance

- Tests: a dart thrown at a station pushes a new display view; a tournament override pushes a new admin view; the admin streams refuse without the PIN; a disconnected client is unsubscribed.

## Comments

**2026-10-20, done.** The database announces every write (`db.onChange`, with the match id when there is one); `live.ts` has the change feed (database writes plus station views, collapsed to one call per turn of the event loop, so a station's own state is up to date by then) and `streamView`, which sends the view on connect and after each change only if it's different. Streams: `GET /api/display/live` (public; also `GET /api/display`), `GET /api/admin/tournament/live`, `GET /api/admin/matches/:id/live` (both behind the PIN by the existing `/api/admin/*` guard); the station stream uses `streamView` too. `DisplayView` / `ScoreCard` / `DisplayStation` in `api.ts`, built in `display.ts`; a draft counts as no tournament, a finished one stays until the next is created.
- Tests in `live.test.ts`: a dart pushes the display view, a draft pushes the admin view, a correction pushes the match detail, the PIN guard, unsubscribing on disconnect.

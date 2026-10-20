# Live streams for the tournament

Status: ready-for-agent
Type: task

- A change feed on the server: one place that announces "something changed" whenever a station's view changes, a match is appended to or closed, or the tournament changes (start, sync, overrides, withdrawals, corrections).
- Public `GET /api/display/live` (SSE): the display view on connect and after every change, debounced (one push per turn of the event loop at most). The display view: the tournament (name, phase, played of total) or none; per station a short scoreboard (label, names, legs won, remaining scores, who's throwing, current visit's darts); up next (first 5 of the queue: label, names); group tables; bracket; placings once finished. Shared types in `api.ts`.
- Admin `GET /api/admin/tournament/live` (SSE, behind the PIN): the same `TournamentAdminView` the GET returns, pushed on every change.
- Admin `GET /api/admin/matches/:id/live` (SSE, behind the PIN): the match detail, pushed when that match changes.
- Streams clean up on disconnect, keep-alive like the station stream.

## Acceptance

- Tests: a dart thrown at a station pushes a new display view; a tournament override pushes a new admin view; the admin streams refuse without the PIN; a disconnected client is unsubscribed.

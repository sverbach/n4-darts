# Diagnostics page

Status: done
Type: task

A page in `/admin` (behind the PIN) that shows whether the server keeps up during an evening, so a slow evening can be explained from data instead of guesses.

Background: on 2026-10-21 every dart took longer and longer to show up, up to 5+ s, and `/live` requests hung for 25+ s. The cause turned out to be the reverse proxy (darts.niver.ch), not the app: via the local IP there was no delay. The simulator couldn't reproduce it; this page would have shown it.

## What it shows (live, refreshing by itself)

- **Event loop:** delay p50/p99/max over the last minute (`perf_hooks.monitorEventLoopDelay`), i.e. how long the server is blocked.
- **Live streams:** open connections per kind (station, watch, display, admin tournament, stations, match detail), with their client address and user agent, how long each has been open, and how many updates it has had.
- **Views:** for each kind, how long computing it takes (average and max) and how often per minute.
- **Database:** writes per minute and the slowest write.
- **Boards:** per station, online/offline, WebSocket reconnects since start, time since the last message, and the last command's round-trip time (reset, start, stop).
- **Darts:** time from the board's message to the station's update being written to its streams, last 20 darts.
- **Request headers of this page:** whether it came through a proxy (`x-forwarded-*`, `via`), so proxy setups are visible.

## Acceptance

- The page works at 390 px and 1440 px in the new design.
- The numbers are checked against the simulator, including a simulated slow view and a blocked event loop.
- Collecting the numbers costs next to nothing when nobody has the page open.

## Comments

2026-10-26: Built. `/admin/diagnostics` is a fifth admin tab that polls `GET /api/admin/diagnostics` (behind the PIN) every 2 s. The recorder is `packages/server/src/diagnostics.ts`.
- **Cost when nobody looks.** Always on: an entry per open stream, an update counter, and a timestamp per board message and dart. The event-loop monitor and the view and write timings only run while the page has been polled in the last 2 minutes, so they start fresh when it's opened.
- **Event loop.** `monitorEventLoopDelay` at 10 ms; each sample includes that interval, so it's subtracted (idle ≈ 1 ms, a 100 ms block ≈ 97 ms).
- **Views** include the `JSON.stringify` of the view, since that's part of the cost per change.
- **Streams.** `streamView` now takes a `{ kind, label }`. `/watch` asks for `?view=watch`, so it shows as "watch" rather than "station".
- **Darts.** The gateway stamps each detected dart with when the board's message arrived. The station reports the time once the dart is recorded and its streams are written.
- **Boards.** Reconnects, the last message, and the last command's round trip come from the gateway.
- **Phone nav.** The admin tabs are one row that scrolls sideways, and the current tab scrolls into view.

Checked against the simulator at 1440 px and 390 px: station, watch and display open, and 6 darts at 1–2 ms each. Tests cover the PIN, stream listing (kinds, client via `x-forwarded-for`, user agent, updates), dart timing via the simulator, board stats with a stop command, proxy headers, a slow view (30 ms), a blocked event loop (120 ms), the last-20 limit, and nothing recorded before the page is opened.

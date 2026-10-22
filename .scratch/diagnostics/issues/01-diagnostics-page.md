# Diagnostics page

Status: ready-for-agent
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

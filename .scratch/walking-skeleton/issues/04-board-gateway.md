# Board gateway

Status: ready-for-agent
Type: task
Blocked by: 03

In `packages/server`: one client per configured board. Knows nothing about games.

- Diff each snapshot against the previous one → `DartDetected(index, segment, coords, bouncer)`, `DartRevised(index, …)` when an earlier dart changes, `TakeoutStarted`, `TakeoutFinished`, `BoardReset`, `BoardStopped`, `BoardStarted`.
- Connection state → `BoardOnline` / `BoardOffline`; reconnect with backoff; on reconnect fetch `GET /api/state` and diff, so darts are never lost or duplicated.
- Commands: `start()`, `stop()`, `reset()`.
- Station → board address from config (env/JSON is fine for now; `/admin` comes later).

## Acceptance

Tests against the in-process simulator: a full visit, a revised dart, a takeout after 2 darts, a reset, a disconnect mid-visit with a dart thrown while disconnected (detected exactly once after reconnect).

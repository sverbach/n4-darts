# Board gateway

Status: done
Type: task
Blocked by: 03

In `packages/server`: one client per configured board. Knows nothing about games.

- Diff each snapshot against the previous one → `DartDetected(index, segment, coords, bouncer)`, `DartRevised(index, …)` when an earlier dart changes, `TakeoutStarted`, `TakeoutFinished`, `BoardReset`, `BoardStopped`, `BoardStarted`.
- Connection state → `BoardOnline` / `BoardOffline`; reconnect with backoff; on reconnect fetch `GET /api/state` and diff, so darts are never lost or duplicated.
- Commands: `start()`, `stop()`, `reset()`.
- Station → board address from config (env/JSON is fine for now; `/admin` comes later).

## Acceptance

Tests against the in-process simulator: a full visit, a revised dart, a takeout after 2 darts, a reset, a disconnect mid-visit with a dart thrown while disconnected (detected exactly once after reconnect).

## Comments

**2026-10-18, done.** `createBoardGateway()` and the pure `diffSnapshots()` in `packages/server/src/board/gateway.ts`, using Node's built-in WebSocket client. 8 tests against the simulator. Behaviour worth knowing for ticket 05:
- First connect is a baseline: darts already on the board are not reported (the match log has them).
- After a reconnect, `BoardOnline` comes first, then whatever was missed: darts not seen yet, or `TakeoutFinished` if the old visit's darts are gone.
- `TakeoutFinished` only fires when darts were actually on the board, so a stray takeout can never skip a player's turn.
- Darts cleared by anything other than a takeout are reported as `BoardReset`; the server can't tell a reset it sent from one someone pressed on the laptop.
- Node's WebSocket client can fire `error` without `close` on a refused handshake; the gateway treats either one, or a 5 s connect timeout, as offline.
- Known gap: a change in the milliseconds between the board answering the sync request and its response arriving is missed until the next message.

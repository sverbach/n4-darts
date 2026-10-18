# Match event log and live server

Status: ready-for-agent
Type: task
Blocked by: 02, 04

In `packages/server`:

- SQLite table holding each match's append-only event log (ADR-0002). A match without a tournament must be possible.
- Wire station 1: gateway events for board 1 → append to the active match's log (ignored when no leg is running), fold through the engine.
- On `TakeoutFinished` / leg start / manual next player: send `reset` to the board when needed to keep it in sync.
- Realtime push of the full derived state to every connected client of `/station/1` over a WebSocket; commands from clients (start leg, correct dart, next player, undo visit) are appended as events.
- On startup: rebuild in-progress matches from their logs and resync with the board.

## Acceptance

- Integration test with the simulator: play a full leg, correct a dart, kill/restart the server mid-leg, finish the leg; final state identical to an uninterrupted run.

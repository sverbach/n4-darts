# Match event log and live server

Status: done
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

## Comments

**2026-10-18, done.** `db.ts` (built-in `node:sqlite`, no native deps), `station.ts` (board events + commands → match log), `stations.ts` (config + wiring), `app.ts` routes: `GET /api/stations[/:id]`, `POST /api/stations/:id/commands`, `GET /api/stations/:id/live` (Server-Sent Events instead of a WebSocket: browsers reconnect by themselves and no extra dependency). Stations come from env `STATIONS=1=http://192.168.1.139:3180,2=...` until `/admin` exists; data in `DATA_DIR` (`/data` in Docker). Integration tests in `station.test.ts` against the simulator, including two server restarts mid-visit. Notes:
- After a restart the station matches the board's darts to the logged visit by exact coordinates; anything else means a takeout happened while the server was down.
- Commands that reset the board wait for the reset (3 s timeout), so a fresh match can't pick up leftover darts.
- Darts are stored with the board's name, coordinates and bouncer flag next to the engine fields, for stats later.
- Not handled yet: a reset pressed on the laptop mid-visit (darts stay logged; the board forgets them). Needs the "darts lost" prompt from the architecture doc.

# Board simulator

Status: done
Type: task
Blocked by: 01

`tools/board-sim`: a fake Board Manager serving the API documented in `docs/board-manager-api.md` (v2.0.2 shape): `GET /api/state`, `GET /api/version`, `ws /api/events`, `PUT /api/start`, `PUT /api/stop`, `POST /api/reset`. Emits full snapshots exactly like the real one, including the `Takeout` status after 3 darts and `Manual reset`, `Stopping`/`Stopped`, `Starting`/`Started`.

Driving it:
- A small control API (e.g. `POST /sim/dart {"name":"T20"}`, `POST /sim/takeout`, `POST /sim/disconnect`) for tests and manual play.
- Replay mode: play back a recording such as `prototypes/recordings/2026-10-18-board1.txt` with its original timing (or sped up).

Usable both as a CLI (`pnpm sim --port 3180`) and in-process from tests.

## Acceptance

- `prototypes/listen-board.ps1 -BoardHost localhost` against the sim shows the same message shapes as the real board.
- Tests can script a visit and a takeout and observe the snapshots.

## Comments

**2026-10-18, done.** `createBoardSim()` in `tools/board-sim/src/sim.ts`, CLI `pnpm sim -- --port 3180 [--replay <file> --speed 10]`, control API `POST /sim/{dart,revise,takeout,offline,online}`. Verified with `prototypes/listen-board.ps1` against the CLI: same endpoints and message shapes as the real board. Notes:
- Simulated darts get ±0.01 coordinate scatter, like real throws; without it the gateway can't tell "same dart" from "takeout and a new dart in the same spot" after a reconnect.
- Darts after the third are ignored until takeout, and stop/start clear the darts. Both are assumptions about the real board (not observed yet).
- Bullseye naming (`bed: "Double"`, `name: "Bull"`) is a guess until ticket 07 captures the real values.

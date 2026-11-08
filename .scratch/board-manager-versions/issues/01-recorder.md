# The board recorder and its checklist

Status: ready-for-agent
Type: task

See `../spec.md`.

## What to do

- `tools/board-recorder` (Node, no Windows-only parts), run as `pnpm board:record <board-url> [name]`.
- Before listening: save `GET /api/version`, `/api/config` and `/api/state`.
- Save every WebSocket message as `HH:MM:SS.mmm {json}`, one per line (the simulator's `parseRecording` format), plus `# step: <name>` lines for the checklist.
- The checklist, one step at a time in the terminal (Enter for the next, `s` to skip, `q` to stop): single inner, single outer, double, treble, outer bull, bull, off-board miss, bounce-out, takeout after 1 dart, after 2, after 3, manual reset (sent by the recorder), stop and start (sent by the recorder), calibrate (sent by the recorder).
- Output to `recordings/<version>/<date>-<name>.txt`; move `prototypes/recordings/` there and update its users (`tools/board-sim` tests). Remove `prototypes/listen-board.ps1`.
- `parseRecording` skips `#` lines.
- Tested against the simulator.

## Acceptance

- A recording against the simulator has the version header, every message and the step markers, and the simulator replays it.
- All checks pass.

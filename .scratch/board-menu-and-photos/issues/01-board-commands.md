# Board commands and the stopped state

Status: done
Type: task

- Gateway: `calibrate()` (`POST /api/config/calibration/auto`, a longer timeout than the other commands); start/stop/reset exist.
- Station: `boardRunning` in `StationView` (from the snapshot on connect and `BoardStarted` / `BoardStopped`); a board command method that sends start / stop / calibrate / reset to its board and answers with an error message if the board refuses or is unreachable. A reset sent this way counts as the station's own (like "next player"), so it doesn't end a visit.
- Route: `POST /api/stations/:id/board` with `{ action: "start" | "stop" | "calibrate" | "reset" }` (public, like station commands).
- Board simulator: `POST /api/config/calibration/auto` (status "Calibrating" for a moment, then back to "Throw"); the sim page shows it.

## Acceptance

- Tests against the simulator: each action reaches the board; stop shows `boardRunning: false` live and start brings it back; calibrate answers; an offline board gives an error.

## Comments

**2026-10-20, done.** Gateway `calibrate()` (`POST /api/config/calibration/auto`, 60 s timeout); the station's `BoardControl` gained optional `start` / `stop` / `calibrate`, wired to the gateway in the registry. `StationView.boardRunning` and `StationAdminView.boardRunning` (from the snapshot on connect and `BoardStarted` / `BoardStopped`). `station.boardCommand(action)` and `POST /api/stations/:id/board` `{ action }` (400 for an unknown action, 502 with "The board didn't answer" / "Calibration failed: …" when the board refuses or is unreachable). Simulator: `POST /api/config/calibration/auto` reports status "Calibrating" for `calibrationMs` (default 1.5 s) and answers when done; a guess until checked on the real board.
- Changed from the ticket: a reset from the menu is not counted as the station's own. It behaves like a reset pressed on the laptop, so a visit waiting for takeout ends (the cleared board won't see a takeout); mid-visit the visit carries on.
- Tests against the simulator: stop/start with `boardRunning` following, calibrate and reset reaching the board, an offline board's error, an unknown action.

# Board commands and the stopped state

Status: ready-for-agent
Type: task

- Gateway: `calibrate()` (`POST /api/config/calibration/auto`, a longer timeout than the other commands); start/stop/reset exist.
- Station: `boardRunning` in `StationView` (from the snapshot on connect and `BoardStarted` / `BoardStopped`); a board command method that sends start / stop / calibrate / reset to its board and answers with an error message if the board refuses or is unreachable. A reset sent this way counts as the station's own (like "next player"), so it doesn't end a visit.
- Route: `POST /api/stations/:id/board` with `{ action: "start" | "stop" | "calibrate" | "reset" }` (public, like station commands).
- Board simulator: `POST /api/config/calibration/auto` (status "Calibrating" for a moment, then back to "Throw"); the sim page shows it.

## Acceptance

- Tests against the simulator: each action reaches the board; stop shows `boardRunning: false` live and start brings it back; calibrate answers; an offline board gives an error.

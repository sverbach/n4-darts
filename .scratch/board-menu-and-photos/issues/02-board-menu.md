# Board menu on the station page and in admin

Status: done
Type: task
Blocked by: 01

- `/station/n`: a menu button next to the board status opens Stop/Start detection, Calibrate, Reset board. Stop and Calibrate confirm first ("Clear the board, then calibrate?"). Calibrate shows "Calibrating…" until it answers, then "Calibrated" or the error. The status shows "Board stopped" when detection isn't running.
- `/admin` → Stations: the same menu per station (shared component).
- Works with touch and keyboard; closes on outside tap or Escape.

## Acceptance

- Checked in a browser at phone width and on a laptop-sized window against the simulator: each action, the stopped state, an offline board's error.

## Comments

**2026-10-20, done.** `BoardMenu.tsx`: the board status (online, stopped, offline; "Server offline" on the station when the live connection drops) with a ⋮ button opening Stop/Start detection (by the board's state), Calibrate and Reset board. Stop and Calibrate confirm first; while a command runs the button is disabled; "Calibrating…" shows until the board answers, then the result ("Calibrated", "Detection stopped", or the error) replaces the status for 5 s. Closes on an outside tap or Escape. Used in the station bar and in each `/admin` → Stations row.
- Checked in a browser at 390 px (station) and 1280 px (admin) against the simulator: stop → "Board stopped" and the sim stopped, start, calibrate (Calibrating… → Calibrated), Escape and outside tap, an offline board's "The board didn't answer".

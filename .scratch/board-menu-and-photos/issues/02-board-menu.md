# Board menu on the station page and in admin

Status: ready-for-agent
Type: task
Blocked by: 01

- `/station/n`: a menu button next to the board status opens Stop/Start detection, Calibrate, Reset board. Stop and Calibrate confirm first ("Clear the board, then calibrate?"). Calibrate shows "Calibrating…" until it answers, then "Calibrated" or the error. The status shows "Board stopped" when detection isn't running.
- `/admin` → Stations: the same menu per station (shared component).
- Works with touch and keyboard; closes on outside tap or Escape.

## Acceptance

- Checked in a browser at phone width and on a laptop-sized window against the simulator: each action, the stopped state, an offline board's error.

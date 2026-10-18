# Bare station page

Status: ready-for-agent
Type: task
Blocked by: 05

`/station/1` in `packages/web` (React + Vite). Functional, unstyled beyond basic readability; mobile friendly.

- Enter two player names, tap who throws first, start the leg.
- Live: both remaining scores, whose turn, current visit darts, "remove darts" when awaiting takeout, winner at the end.
- Tap a dart of the current visit → segment picker → correction.
- "Next player" button and "undo last visit".
- Board offline indicator.
- Two devices on `/station/1` at once stay in sync.

## Acceptance

- Playable on the laptop and on a phone against the simulator.

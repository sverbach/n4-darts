# Match page: the score race

Status: ready-for-agent
Type: task
Blocked by: 01

- A multi-series line chart on the shared pieces: x = visit number in the leg, y = remaining score, a line per player in their series colour, a legend with names (and the names at the lines' ends where they fit), busts as flat steps.
- Tap/hover tooltip for the nearest visit: "Visit 7 · schwembo · 105 scored · 96 left" (a bust says "Bust").
- A leg picker ("Leg 1 · 2 · 3") when there are several legs; the last leg first.

Acceptance: unit tests for the series built from a leg (including a bust and the checkout); checked at 390 and 1440 px with 2 and 4 players and several legs; all checks pass.

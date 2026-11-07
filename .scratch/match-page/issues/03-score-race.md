# Match page: the score race

Status: done
Type: task
Blocked by: 01

- A multi-series line chart on the shared pieces: x = visit number in the leg, y = remaining score, a line per player in their series colour, a legend with names (and the names at the lines' ends where they fit), busts as flat steps.
- Tap/hover tooltip for the nearest visit: "Visit 7 · schwembo · 105 scored · 96 left" (a bust says "Bust").
- A leg picker ("Leg 1 · 2 · 3") when there are several legs; the last leg first.

Acceptance: unit tests for the series built from a leg (including a bust and the checkout); checked at 390 and 1440 px with 2 and 4 players and several legs; all checks pass.

## Comments

2026-11-07: Done. `race.ts` (`raceOf`: per player, the remaining score per round of a leg, busts flat and marked; tested), `components/charts/RaceChart.tsx` (a linear round axis, y from 0 to the start score, a line per player in their series colour, filled squares, a hollow square for a bust, the names at the line ends nudged apart, a crosshair and a tooltip listing every player's visit for the round), `ScoreRace.tsx` (the leg picker as a fieldset of pressed buttons, the last leg first, and a legend with chips). The pointer handling moved to `usePointer.ts`, which `LineChart` uses too. Checked with 2 players over 1 and 3 legs, and with 3 players.

All four checked together: typecheck, lint, 833 unit tests, build, e2e (41), the visual suite (9; the match page baseline retaken), and the impeccable detector (0 findings after snapping four font sizes to the type ramp).

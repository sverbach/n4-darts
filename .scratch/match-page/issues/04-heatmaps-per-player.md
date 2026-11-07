# Match page: heatmaps per player

Status: done
Type: task
Blocked by: 01

- A `DensityHeatmap` per player with the player's name and series mark above it, two per row on a phone, more on desktop; one shared `HeatLegend`. Under 9 darts: "Too few darts".

Acceptance: checked at 390 and 1440 px; all checks pass.

## Comments

2026-11-07: Done. `MatchHeatmaps.tsx`: per player the chip and name, the `DensityHeatmap` (now with a `className` for its width) and the dart count, two per row on a phone and centred columns of up to 320 px on a kiosk, with one `HeatLegend`. Under 9 darts: "Too few darts". When nobody reaches 9 darts, the section is left out (a one-dart match looked empty otherwise).

All four checked together: typecheck, lint, 833 unit tests, build, e2e (41), the visual suite (9; the match page baseline retaken), and the impeccable detector (0 findings after snapping four font sizes to the type ramp).

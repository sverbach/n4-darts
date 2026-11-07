# Charts: d3 and the density heatmap

Status: ready-for-agent
Type: task

See the spec's decisions.

## What to do

- Add `d3-array`, `d3-contour` and `d3-scale` (later `d3-shape`) to `@n4/web` at exact versions at least two weeks old, with their `@types`.
- **Heat tokens** in `styles/theme.css`: about 7 steps, dark to deep red, orange and pale yellow, with lightness rising. Check the steps' lightness order (the dataviz validator's sequential check) against the panel surface.
- **`components/charts/`:** `DensityHeatmap` (the board, `contourDensity` over the darts' positions with the bandwidth about a treble field wide and about 7 thresholds, bands as SVG paths in the heat tokens, slightly see-through over a dimmed board) and `Legend` (a colour bar, "Fewer darts → More darts").
- The profile's "Where the darts land" uses it. The caption and the "Not enough darts yet" stay.
- **ADR 0013** "Charts: d3 for the maths, React for the drawing": the weighed options, and the consequences (no library DOM, tokens in JSX, exact versions, deterministic SVG for the visual suite).

## Acceptance

- A unit test: the density is computed for points in board coordinates (y up) and its hottest band sits where most darts are.
- Checked in the browser with a seeded player of 500 darts, at 390 px and 1440 px. The visual suite's profile shots change on purpose; check them, then take them as the new baseline.
- All checks pass.

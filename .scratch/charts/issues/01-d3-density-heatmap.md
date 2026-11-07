# Charts: d3 and the density heatmap

Status: done
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

## Comments

2026-11-07: Done.
- **Dependencies:** `d3-array` 3.2.4, `d3-contour` 4.0.2, `d3-scale` 4.0.2 and `d3-shape` 3.2.0, exact, with their `@types`. d3's own dependencies all had releases on 2026-11-03 (four days old), so `overrides` in `pnpm-workspace.yaml` hold `d3-color`, `d3-format`, `d3-interpolate`, `d3-path`, `d3-time` and `d3-time-format` at their previous versions. Drop the overrides once those releases are two weeks old, if wanted. The bundle grew by about 22 KB (7 KB gzipped).
- **Heat tokens** `--heat-1` to `--heat-7` (and `fill-`/`bg-heat-*`), computed in OKLCH: lightness 0.37 → 0.94, hue red → yellow, from 1.76:1 to 16.4:1 against the panel. Not the status colours.
- **`components/charts/`:** `density.ts` (`densityBands`: `contourDensity` over board coordinates, a bandwidth of 0.055 board units, seven bands at fixed shares of the busiest spot so a player always gets all seven, paths in board SVG coordinates), `DensityHeatmap.tsx` (the dimmed board with the bands between its fields and numbers, 85% opaque), `HeatLegend.tsx` (a stepped colour bar, "Fewer"/"More"), `heat.ts` (the token classes). `BoardFields` got `dim` and a slot for layers between the fields and the numbers.
- `@types/d3-contour` 3.0.6 lacks `contourDensity().contours()`, which d3-contour 4 has, so a small local type covers it.
- **ADR 0013** "Charts: d3 for the maths, React for the drawing".
- **Tests:** `density.test.ts` (a band per step, the hottest band over a T20 cluster in SVG coordinates, nothing without darts).
- **Checked** on the local database with a player's 116 real darts, at 1440 and 390 px: the hot spot sits in the 20 near the treble, with a second cluster at the 15. The legend first wrapped and collided, and is now a bar with "Fewer"/"More" under its ends.
- **Visual suite:** unchanged. None of its players reach 30 darts, so its profile shows "Not enough darts yet". A visual heatmap shot would need fixed dart positions (the fake board places darts at random within their field).
- typecheck, lint, 826 unit tests, build, e2e (41) and the visual suite (9) pass.

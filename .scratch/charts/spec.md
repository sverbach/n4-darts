# Charts with d3: a real heatmap, a better average chart

Status: done

The profile's two charts are hand-drawn SVG. The heatmap (500 blurred dots) turns into a blob once a player has thrown a lot, and the average per evening is a hand-built line. A charting library gives both a proper base, and future charts (head-to-head stats) build on the same pieces.

## Decisions (2026-11-07)

- **d3, only the calculating parts** (`d3-scale`, `d3-shape`, `d3-array`, `d3-contour`, at exact versions, bundled), **drawn by React**: d3 works out the scales, paths and density contours, and our components render the SVG with the theme's tokens. No library-made DOM, no canvas, no animation. That keeps it fully themeable, small, offline (ADR 0005) and pixel-stable for the visual suite. Observable Plot, Recharts, Nivo, ECharts, Vega and visx were weighed and left out (ADR to come).
- **Heatmap: a smooth density** (`contourDensity`) over the drawn board, not fields coloured by hits. It shows where in a field the darts land.
- **Which darts:** as now, the player's last 500 board-detected darts with coordinates, from X01 matches only (no party games, no hand-added or corrected darts, no bounce-outs).
- **Colours: a heat ramp**, explained by a legend. There are no numbers on the board.
- **Average chart:** improved, with dots and a hover/tap tooltip. It's **per day**, not per evening ("Average per day"), since quick plays happen during the day too.
- **Shared chart pieces** in the web app (axis, line, legend, tooltip), for the charts to come.

## Settled in grilling round 1 (2026-11-07)

1. **A warm heat ramp of its own**: dark where almost no darts went, through deep red and orange to a pale yellow where most went. It gets its own tokens (`--heat-*`), not the status colours: green and red already mean "good" and "offline/bust" in the app. Lightness rises monotonically, so it reads in greyscale and with colour vision deficiencies.
2. **About 7 colour bands** (density contours) over a dimmed board drawing, slightly see-through so the rings show. The smoothing is about a treble field's width, so T20 doesn't blur into the 1 and the 5.
3. **Legend:** a small colour bar, "Fewer darts → More darts", plus the caption "Last 500 darts".
4. **"Not enough darts yet"** below 30 darts, as now.
5. **Per day**, with a session past midnight still counting to the day it started (the 6-hour shift stays). "Average per evening" becomes "Average per day", and the API field `evenings` becomes `days`.
6. **The line chart:** a dot per day. On a computer, hovering anywhere shows a vertical line and a tooltip for the nearest day ("12 Nov 2026 · 48.3 avg · 3 matches"); on a phone, a tap does the same. The last value stays labelled. With many days the date labels thin out, and every day stays drawn.
7. **Shared pieces in `packages/web/src/components/charts/`.** ADR 0013: "Charts: d3 for the maths, React for the drawing".
8. **Only the profile** gets these charts for now, not /display.

## Tickets

1. `01-d3-density-heatmap.md`: d3 in, the heat tokens, the density heatmap with its legend, ADR 0013
2. `02-average-per-day.md`: per day on the server, the shared line-chart pieces, the improved chart with its tooltip
3. `03-docs.md`: UI pages, glossary, architecture

## Out of scope

- Head-to-head stats themselves (a separate feature, built on these pieces).
- Filters on the heatmap (per evening, per target).

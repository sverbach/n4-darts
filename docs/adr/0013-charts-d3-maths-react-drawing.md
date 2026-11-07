# Charts: d3 for the maths, React for the drawing

Charts use d3's calculating modules (`d3-scale`, `d3-shape`, `d3-array`, `d3-contour`) and nothing that draws: d3 works out scales, line paths and density contours, and our React components render them as SVG with the theme's tokens (`fill-heat-4`, `stroke-line-soft`, the pixel font). The shared pieces live in `packages/web/src/components/charts/`.

The first two charts were hand-drawn SVG: a heatmap of 500 blurred dots that turned into a blob once a player had thrown a lot, and a line built on a home-made scale helper. A proper density heatmap needs a kernel density estimate and contours, which nobody should write by hand, and more charts are coming (head-to-head stats).

We weighed:
- **Observable Plot:** less code per chart, but it builds its own DOM, so it's styled by overriding it rather than by writing it.
- **Recharts, Nivo:** quick to start, but they bring their own look, and the pixel font on our dark theme means fighting them.
- **ECharts, Vega:** heavy, drawn on canvas, and themed through config objects instead of our CSS tokens.
- **visx:** d3 wrapped as React components; decent, but a layer we don't need.

d3's modules won on fitting the theme completely (every element is our own JSX), on size (only what's used, bundled for offline use, ADR 0005), and on fitting ADR 0007: they're pure functions, not client state.

## Consequences

- **Charts are SVG with no animation and no canvas**, so the visual suite's screenshots stay pixel-stable.
- **Colours come from tokens.** Magnitude uses the heat ramp (`--heat-1` to `--heat-7`, lightness rising step by step), never the status colours, which keep meaning good, warning and bad.
- **Exact versions, at least two weeks old.** d3's own dependencies released too recently are held back with `overrides` in `pnpm-workspace.yaml` until they're old enough.
- **Some d3 typings lag behind the code** (`contourDensity().contours()` isn't in `@types/d3-contour` 3.0.6); a small local type covers what we use.
- **More to build by hand** than with a full chart library: axes, legends and tooltips are ours. They're written once, in `components/charts/`, and shared.

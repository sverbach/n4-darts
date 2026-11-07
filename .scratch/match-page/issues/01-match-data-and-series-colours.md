# Match page: the data and the series colours

Status: done
Type: task

- `MatchPage` (API) gains `stats`: per player in throwing order, the engine's `PlayerMatchStats` for the match (average, first 9, checkout hits/attempts, high out, best leg, 180s/140+/100+, darts), and `landed`: per player, the board positions of their board-detected darts (as the profile's heatmap: no bounce-outs, none added by hand, none corrected).
- Series colour tokens `--series-1` to `--series-8` (slot 1 the accent violet), checked with the dataviz validator (`--mode dark` against the panel). The Tailwind utilities come with them.

Acceptance: a server test for the new fields; the validator passes (or every warning is answered by the names next to the colour); all checks pass.

## Comments

2026-11-07: Done.
- `MatchPage.stats` (the engine's `matchStats`) and `MatchPage.landed` (`landedDarts`, now exported from `stats/stats.ts`), computed in `matches.page()`. A server test covers both.
- `--series-1` to `--series-8` with `--color-series-*`: the dataviz reference palette's dark steps, violet first (#9085e9, orange #d95926, aqua #199e70, blue #3987e5, yellow #c98500, magenta #d55181, green #008300, red #e66767). The accent #a68cff itself failed the lightness band (L 0.71, outside 0.48–0.67), so slot 1 is the reference's deeper violet. The validator passes on the panel (#0b0d0f): worst adjacent CVD ΔE 8.6, normal-vision 19.3, all ≥ 3:1; the first three also pass all-pairs (CVD 9.4).

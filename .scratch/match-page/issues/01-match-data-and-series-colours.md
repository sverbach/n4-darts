# Match page: the data and the series colours

Status: ready-for-agent
Type: task

- `MatchPage` (API) gains `stats`: per player in throwing order, the engine's `PlayerMatchStats` for the match (average, first 9, checkout hits/attempts, high out, best leg, 180s/140+/100+, darts), and `landed`: per player, the board positions of their board-detected darts (as the profile's heatmap: no bounce-outs, none added by hand, none corrected).
- Series colour tokens `--series-1` to `--series-8` (slot 1 the accent violet), checked with the dataviz validator (`--mode dark` against the panel). The Tailwind utilities come with them.

Acceptance: a server test for the new fields; the validator passes (or every warning is answered by the names next to the colour); all checks pass.

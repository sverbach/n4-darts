# Home shows what each station is doing

Status: ready-for-agent
Type: task

Home's stations are live since live-lists 03, but each tile shows only "STATION 1" and a Watch link. The Watch links also use a different fill from the tiles.

## What to do

- Each station tile shows its state from the stream it already reads: "Free", "Paused", or the match ("ANN VS BOB · 61 – 101"). Board offline as a warn pill.
- The Watch link styled like the tile's secondary action (one fill).

## Acceptance

- Home reflects a match starting and ending without a reload (browser test).
- `docs/ui-pages.md` (home) updated.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

# Home shows what each station is doing

Status: done
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

2026-11-01: Built. Each station tile shows what it's doing from the stream it already read (Free / the notice, "Ann vs Bob · waiting to start", the remaining scores, "Ann won"), a board pill only when the board needs a look (`BoardStatus quiet`), and the Watch link shares the tile's frame and fill. Browser test in `live.spec.ts`: a match starting and ending shows on an open home page.

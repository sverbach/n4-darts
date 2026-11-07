# /watch: a party game with five or more players runs off the screen

Status: needs-triage
Type: bug

In the party modes with a plain player list beside the target board (Around the Clock, Killer, Random Checkout), /watch lays the list out in a column next to the board (`WatchBoard` in `features/watch/WatchPage.tsx`). Each row is at least `min-h-pu-96` with `gap-pu-12`, so five rows (about 530 units) are already taller than the space between the header and the visit bar (about 480 units of the 720). From the fifth player on, the list runs under the visit bar and off the bottom, and the board grows with the row. Matches allow up to 8 players.

Found while building Random Checkout (`.scratch/more-party-modes/issues/01-random-checkout.md`), at 720p and 1080p with six players.

## What to do

- Make the list fit beside the board with up to 8 players on /watch: for example, compact rows from five players on (like `PlayerCards`' `many`), or two columns of rows.
- Keep the board's size, whatever the number of players.

## Acceptance

- Around the Clock, Killer and Random Checkout with 8 players fit on /watch at 1080p, 720p and kiosk, with nothing under the visit bar.
- Three players look as they do now.
- The visual suite passes, with any retaken screenshots listed in the comments.
- All checks pass.

# Watch and Display

Status: done
Type: task
Blocked by: 02

- **`/watch/n`** as D-Watch-*:
  - The header: logo, station, label, and the match settings or a red "Server offline" pill.
  - The scoreboard, the visit panel with a zero-padded total and "Ann to throw".
  - "Next" with large avatars, "Ann vs Lea" and the settings with "Waiting to start".
  - Game shot as on the station.
- **`/display`** as D-Display-*:
  - The header: logo, title, phase line and progress squares; idle: "Darts evening · <date>".
  - Station cards (live score rows, visit, next, free/paused/offline).
  - Up next, group tables with avatars, and the bracket with avatar rows.
  - Finished: champion with corner brackets, placings with avatars, and awards (title, who, big value).
- Both keep scaling to fit.

## Acceptance

- Compared with the mockups at 1920×1080 and 1280×720. Also checked at 1280×720 for `/display` and 1920×1080 for `/watch`, with nothing cut off.

## Comments

**2026-10-21, done.**
- **Sizing.** `styles/display.css` sizes both projector pages from one length, `--px` (one pixel of the 1920×1080 or 1280×720 mockup), so every screen shows the same layout. `Fit` still shrinks anything that would overflow.
- **`/display`.**
  - The header has the logo, the name, the phase line and progress squares (`Progress`). The idle header reads "Darts evening · date".
  - Station cards show live score rows with avatars, a visit row with dart tiles and the total, or a compact line ("Next · A vs B", Free, or Paused/Board offline in amber/red).
  - Up next rows; group tables and the leaderboard with avatars.
  - The bracket in "Winners bracket" / "Losers bracket" rows (just "Knockout" for single elimination), with avatar cards.
  - Finished: the champion panel, placings and award cards.
- **`/watch`.**
  - The header shows the station, the label, and the settings or "Server offline".
  - The station's player cards (`PlayerCards`, split out of `Scoreboard`), and the visit in one row: who, three darts (a cursor in the next slot), a zero-padded total, and "Remove darts" / "X to throw".
  - "Next" with large avatars; Game shot.
- **Server.** Tournament views now carry avatars: `TournamentMatchView.sides` (players with photos) and `photo` on group table rows. Tested in `photos.test.ts`.
- **`MatchCard`.** Shows avatars, and bracket columns wrap their cards in `.bracket-matches`.
- Checked by playing a whole tournament on the simulator: idle, groups, knockout and finished at 1920×1080 (finished also at 1280×720); `/watch` playing, next and game shot at 1280×720.

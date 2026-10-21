# Watch and Display

Status: ready-for-agent
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

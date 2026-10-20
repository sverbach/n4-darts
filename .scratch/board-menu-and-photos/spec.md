# Board menu and player photos

Status: ready-for-agent

## Goal

Players fix their board from the station page without leaving kiosk mode: stop or start detection, calibrate, reset. Every player can have a photo, uploaded by the organiser, shown wherever players appear.

Two small features before the design system pass. Read first: `docs/architecture.md`, `docs/board-manager-api.md`, `GLOSSARY.md`.

## In scope

- **Board menu** next to the board status on `/station/n`, and per station in `/admin` → Stations: Stop / Start detection (one button, by the board's state), Calibrate (`POST /api/config/calibration/auto`), Reset board. No PIN on the station (ADR-0004). Stop and Calibrate ask for confirmation. Calibrate shows "Calibrating…" until the board answers, then "Calibrated" or the error.
- **Board status** gets a third state: online, offline, and stopped (detection not running), from the board's `running` flag.
- **Player photos** in SQLite: the browser crops to a square and shrinks to 512×512 JPEG before upload (about 50 KB), so photos are in the nightly backups. Upload, replace and remove in `/admin` → Players (camera or gallery on a phone), with a square crop preview that can be dragged and zoomed. Admin only.
- **Where photos show**: large on the station scoreboard, `/watch`, the champion on `/display` and the profile; small on `/display`'s Now playing and Up next, the leaderboards, the admin Players list, the station's player picker and lineup. Without a photo: a coloured circle with initials.

## Out of scope

Players uploading their own photo, manual calibration, the design system styling.

## Done when

- On the real board, stop/start, calibrate and reset work from the station page in kiosk mode, and the status shows a stopped board.
- A photo taken on the organiser's phone shows up on the station, the projector and the profile.

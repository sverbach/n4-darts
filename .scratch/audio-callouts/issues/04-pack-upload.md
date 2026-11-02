# Uploading a darts-caller pack

Status: needs-triage
Type: task
Blocked by: 02

## What to do

- Admin (a "Sound" section): upload a zip in darts-caller's format; the server unpacks the known keys (`0`–`180`, `gameshot`, `matchshot`, `busted` and their `+n` variants, `.mp3`/`.wav`), ignores the rest, and stores the pack in the data volume. Shows the pack's name, how many keys it has and which of ours are missing (those fall back to the default pack).
- Choose the active pack (default or an uploaded one); delete an uploaded pack. The pages load files of the active pack from `/api/callouts/...`.
- A note in the admin UI: packs from other projects aren't ours to redistribute; upload only what you may use.

## Acceptance

- Server tests: a valid zip, a zip with unknown files, a broken zip, a too-large zip (limit e.g. 50 MB); a missing key falls back to the default.

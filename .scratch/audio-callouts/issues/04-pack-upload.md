# Uploading a darts-caller pack

Status: done
Type: task
Blocked by: 02

## What to do

- Admin (a "Sound" section): upload a zip in darts-caller's format; the server unpacks the known keys (`0`–`180`, `gameshot`, `matchshot`, `busted` and their `+n` variants, `.mp3`/`.wav`), ignores the rest, and stores the pack in the data volume. Shows the pack's name, how many keys it has and which of ours are missing (those fall back to the default pack).
- Choose the active pack (default or an uploaded one); delete an uploaded pack. The pages load files of the active pack from `/api/callouts/...`.
- A note in the admin UI: packs from other projects aren't ours to redistribute; upload only what you may use.

## Acceptance

- Server tests: a valid zip, a zip with unknown files, a broken zip, a too-large zip (limit e.g. 50 MB); a missing key falls back to the default.

## Comments

2026-11-02: Confirmed by the user.

2026-11-02: Built. Packs are files, not database rows: `DATA_DIR/callouts/<id>/` holds the recordings plus `pack.json`, and `active.json` records the choice. This keeps up to 50 MB per pack out of the 30 nightly database backups, and it's still in the data volume. The zip is read with `fflate` (MIT, no dependencies). Only names matching darts-caller's keys are unpacked (`0`–`180`, `gameshot`, `matchshot`, `busted`, a `+anything` variant, `.mp3`/`.wav`, any folder, `__MACOSX` skipped). They're stored as `key.ext` and `key+n.ext`, so a file name is never taken from the upload. Limits: a 50 MB zip (413, and the page says so before sending) and 200 MB unpacked. A broken zip, or one without calls, is refused with a message. `GET /api/callouts` returns every key's URLs, from the active pack or the default voice. The pages fetch it when sound turns on, and fall back to the built-in default if that fails. Files are served immutable under `/api/callouts/<id>/<file>`. Deleting the active pack switches back to the default. Admin → Sound lists the default voice and uploaded packs ("12 of 184 calls · the default voice says the rest", "In use", Use, Delete) and has an upload form with the licensing note. Server tests cover each case in the acceptance list. An end-to-end test uploads a one-key pack, uses it, and checks a 60 plays from the pack and a 3 from the default voice, then deletes it. The admin tab row now centres the current tab on a phone, because "Sound" landed under the fade at the right edge. Visual snapshots updated, and `admin-sound` added.

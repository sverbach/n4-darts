# Player photos: storage and API

Status: done
Type: task

- Schema v3: `player_photos (player_id primary key, jpeg blob, updated_at)`; deleting a player deletes the photo.
- `Player.photo`: null or a version string (the update time), so URLs can be cached: `GET /api/players/:id/photo?v=<version>` (public, `image/jpeg`, long cache when `v` is given, 404 without a photo).
- `PUT /api/admin/players/:id/photo` with an `image/jpeg` body (at most 1 MB; must start with the JPEG signature), `DELETE /api/admin/players/:id/photo`.
- Views that carry player names get the photo version where the UI needs it (match players, display cards, leaderboard rows, profile, queue entries).

## Acceptance

- Tests: upload, replace, fetch with headers, remove, refused for a non-JPEG / too big / unknown player, PIN required for changes, photo gone with the player, backups include it (schema in the copy).

## Comments

**2026-10-20, done.** Schema v3: `player_photos (player_id → players on delete cascade, jpeg blob, updated_at)`, created on start for older databases. `Player.photo` is the photo's version (its update time) or null; `db.setPhoto` / `photo` / `deletePhoto` (announced as changes, so live views refresh). Routes: `GET /api/players/:id/photo` (public; `cache-control: immutable` when `?v=` matches the current version, `no-cache` otherwise; 404 without a photo), `PUT /api/admin/players/:id/photo` (`image/jpeg` body, at most 1 MB, must start with the JPEG signature; answers with the player), `DELETE /api/admin/players/:id/photo`. Views carry the version: `MatchPlayer.photo` (station, match detail, queue, display Up next now with players instead of names), score cards, placings, leaderboard rows and the profile, through a shared `matchPlayer(db, id)`.
- Tests: upload, versioned and unversioned fetch, replace, remove; a non-JPEG (400), another content type (415), too big (413), an unknown player (404); PIN needed to change but not to see; deleted with the player; included in a backup.

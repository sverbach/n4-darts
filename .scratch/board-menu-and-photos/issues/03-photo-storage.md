# Player photos: storage and API

Status: ready-for-agent
Type: task

- Schema v3: `player_photos (player_id primary key, jpeg blob, updated_at)`; deleting a player deletes the photo.
- `Player.photo`: null or a version string (the update time), so URLs can be cached: `GET /api/players/:id/photo?v=<version>` (public, `image/jpeg`, long cache when `v` is given, 404 without a photo).
- `PUT /api/admin/players/:id/photo` with an `image/jpeg` body (at most 1 MB; must start with the JPEG signature), `DELETE /api/admin/players/:id/photo`.
- Views that carry player names get the photo version where the UI needs it (match players, display cards, leaderboard rows, profile, queue entries).

## Acceptance

- Tests: upload, replace, fetch with headers, remove, refused for a non-JPEG / too big / unknown player, PIN required for changes, photo gone with the player, backups include it (schema in the copy).

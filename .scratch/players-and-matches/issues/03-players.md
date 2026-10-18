# Players

Status: done
Type: task
Blocked by: 02

- `players` table: id, name, archived flag, created at. Names unique ignoring case.
- Admin API and `/admin` players page: list, add, rename, archive / unarchive, delete.
- Delete is refused for a player who has matches (until ticket 04 there are none, but write the check against the match table it will use, or add it in 04).
- Public read-only endpoint listing active (non-archived) players, for station pickers.

## Acceptance

- Tests: duplicate name (any case) rejected, rename shows everywhere, archived players drop out of the active list.

## Comments

**2026-10-18, done.** `players` table in `db.ts` (unique `name_key` = lower-cased name, so "Älex"/"älex" clash too; NOCASE would be ASCII only). `players.ts`: public `GET /api/players` (active only), `GET|POST /api/admin/players`, `PATCH /api/admin/players/:id` (`name`, `archived`), `DELETE /api/admin/players/:id`. Names are trimmed with inner spaces collapsed; an archived player's name stays taken. `buildApp` takes `db` now. Web: `/admin/players` with add, rename, archive/restore, delete, and an "Archived (n)" section. Checked in a browser at phone width.
- Not done here: refusing to delete a player who has matches, since matches don't reference players yet. Moved to ticket 04.

# Players

Status: ready-for-agent
Type: task
Blocked by: 02

- `players` table: id, name, archived flag, created at. Names unique ignoring case.
- Admin API and `/admin` players page: list, add, rename, archive / unarchive, delete.
- Delete is refused for a player who has matches (until ticket 04 there are none, but write the check against the match table it will use, or add it in 04).
- Public read-only endpoint listing active (non-archived) players, for station pickers.

## Acceptance

- Tests: duplicate name (any case) rejected, rename shows everywhere, archived players drop out of the active list.

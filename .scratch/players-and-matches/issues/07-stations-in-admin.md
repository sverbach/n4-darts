# Stations configured in /admin

Status: ready-for-agent
Type: task
Blocked by: 02

- `stations` table: number, name, Board Manager URL.
- On startup, if the table is empty, seed it once from `STATIONS`; afterwards the env var is ignored (log that).
- `/admin` stations page: add, edit (name, URL), remove, with a live online/offline indicator per board.
- Changes take effect without a restart: adding starts a gateway, editing the URL reconnects, removing closes it. Removing a station with an assigned or running match is refused.
- Station pages use the name where they show the station.

## Acceptance

- Tests against the simulator: add a station and it goes online; change its URL to a second simulator and it reconnects; seeding from `STATIONS` happens only on an empty table.

# Stations configured in /admin

Status: done
Type: task
Blocked by: 02

- `stations` table: number, name, Board Manager URL.
- On startup, if the table is empty, seed it once from `STATIONS`; afterwards the env var is ignored (log that).
- `/admin` stations page: add, edit (name, URL), remove, with a live online/offline indicator per board.
- Changes take effect without a restart: adding starts a gateway, editing the URL reconnects, removing closes it. Removing a station with an assigned or running match is refused.
- Station pages use the name where they show the station.

## Acceptance

- Tests against the simulator: add a station and it goes online; change its URL to a second simulator and it reconnects; seeding from `STATIONS` happens only on an empty table.

## Comments

**2026-10-18, done.** `stations` and `meta` tables. `createStationRegistry` (in `stations.ts`) starts a station + board gateway per configured station and applies `add` / `update` / `remove` immediately; changing a board address swaps only the gateway, so the station's match and live viewers stay. `STATIONS` seeds the table once per database (a `stations_seeded` flag in `meta`), so removing every station doesn't bring them back on restart. `buildApp` takes a fixed station list (tests) or the registry, which also enables `GET|POST /api/admin/stations`, `PATCH|DELETE /api/admin/stations/:id` (`stationAdmin.ts`); removing a station with a match is refused. `StationView` has the station's `name`. Web: `/admin/stations` (online indicator refreshed every 3 s, edit, remove, add); names on the station page, the matches page and the home page, which now lists the real stations.
- The dev server runs Node's type stripping, which can't handle TypeScript parameter properties; vitest compiles them fine, so only the browser check caught it. Turned on `erasableSyntaxOnly` in `tsconfig.base.json` so typecheck refuses such syntax from now on.

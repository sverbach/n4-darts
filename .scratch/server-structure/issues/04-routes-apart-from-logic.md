# Each component's routes in their own file

Status: done
Type: task
Blocked by: 01

Today most server modules hold their Fastify routes and their logic in one file: `tournaments.ts` (712 lines) has `createTournaments` and `registerTournaments`, `players.ts` has `matchPlayer` and `registerPlayers`. Split them, so the logic has no HTTP in it and the routes are a thin layer over it (`../spec.md`). No behaviour or API changes.

## Decisions

- **Naming.** `<component>Routes.ts` next to the logic: `players/playersRoutes.ts` exports `registerPlayers`, `tournaments/tournamentsRoutes.ts` exports `registerTournaments`, and so on. The logic file keeps its name.
- **Thin routes.** A route reads and validates the request, calls the logic, and maps the logic's errors to status codes. Anything else moves into the logic: e.g. the duplicate-name check in `registerPlayers` becomes a function the route calls.
- **Errors.** The logic throws its own error types (as `TournamentError` and `CommandError` already do); routes turn them into 400/404/409/502. No HTTP status codes in the logic, except where an error type already carries one (`TournamentError.status`): leave those, note them.
- **Which modules.** Every module with a `register…` function: `players`, `matches`, `tournaments`, `stats`, `stations` (`stationAdmin.ts`), `access` (`admin.ts`), and the routes `app.ts` registers itself (stations' commands, board menu, display, diagnostics, the tournament's view). The app-level routes go to the component they belong to, and `app.ts` is left wiring: create the components, register their routes.
- **Modules with only logic** (`ratings`, `estimate`, `scheduler`, `tournaments/plan/`, `board/gateway`) don't change.

## Acceptance

- No logic module imports `fastify` (checked by a grep, or a `noRestrictedImports` rule on `fastify` for the logic files if that's easy).
- `app.ts` only creates components and registers their routes.
- Route tests keep passing unchanged; logic that moved out of a route keeps its behaviour (existing tests cover the routes through `buildApp`).
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:** `docs/architecture/05-building-block-view.md` (5.2, white box server) describes the layering (routes over logic over `db.ts`) and the module table lists the route files.

## Comments

2026-10-31: Confirmed by the user as written.

2026-10-31: Built. Route files: `access/accessRoutes.ts`, `live/liveRoutes.ts`, `matches/matchesRoutes.ts`, `operations/operationsRoutes.ts`, `players/playersRoutes.ts`, `stations/stationsRoutes.ts` (formerly `stationAdmin.ts`, plus the station routes from `app.ts`), `stats/statsRoutes.ts`, `tournaments/tournamentsRoutes.ts`.
- **Logic:** `createPlayers(db)` and `createMatches(db, stations, guard)` are new; `createAccess(pin)` holds the PIN and token (cookies stay in the routes); `stationAdminView` moved into `stations.ts`; `streamView` moved from `live.ts` to `liveRoutes.ts`, so `live.ts` is only the change feed.
- **Errors:** new `PlayerError` and `MatchError` carry a reason (`invalid`, `taken`, `missing`, `in-use`, `refused`); the routes map them to 400/404/409. `TournamentError.status` and `StationConfigError.status` already carried a status and were left as they are. `CommandError` is mapped in the routes as before (409 for commands, 502 for the board).
- **Routes moved from `app.ts`:** stations (view, stream, commands, board), display, the tournament's view and stream (the composed view is still built in `app.ts` and handed in, since it spans three components), diagnostics. `app.ts` now creates components and registers routes; only the health check and serving the web app are its own.
- Putting a match on a station and ending it stay thin routes over `station.assign`/`station.command`, which already are the logic.
- **Enforced:** a `noRestrictedImports` override in `biome.json` bans `fastify` and `@fastify/*` in every server file but `*Routes.ts`, `app.ts` and tests. Proven: a Fastify import in `ratings.ts` fails, one in `statsRoutes.ts` passes.
- `diagnostics.view` still takes the request's IP and headers (to show proxy headers): a plain object, no Fastify import, so left.
- All 455 tests pass unchanged; all checks pass. The built server was smoke-tested against a simulated board: reads, writes, refusals (400/404/409), PIN login, board menu.
- Docs: 5.2 describes the layering and the lint rule, the module table lists the route files, the diagram's logic edges follow the code (`matches → live`, `matches → station`, `stationAdmin → live`, `live → diagnostics` gone), and the live-views observation in 5.2 and 11.2 follows.

# Each component's routes in their own file

Status: ready-for-agent
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

# Server folder structure

Status: confirmed (2026-10-31).

`packages/server/src` has 25 modules side by side (about 9,700 lines with tests), apart from `board/` and `tournament/`. This puts them into one folder per component, mirroring the clusters in `docs/architecture/05-building-block-view.md` (5.2), sorts the tests by kind, makes the linter keep the dependencies free of cycles, and separates routes from logic. No behaviour changes.

## Best practices it follows

From *Node.js Best Practices* (goldbergyoni, chapter 1) and Fastify's plugin model:

| Practice | Here |
|---|---|
| Structure by component, not by technical layer | This spec: a folder per cluster |
| Layer inside a component: routes over logic over data access | This spec for routes vs logic (ticket 04); data access later (see Out of scope) |
| Keep the app separate from starting the server | Already: `app.ts` builds it, `main.ts` starts it |
| Configuration read in one place | Already: only `main.ts` reads the environment |
| Unit tests next to the code | Already; this spec keeps it and gives the other kinds of tests their own folders |
| Components register their own routes (Fastify plugins) | Already: `registerPlayers`, `registerTournaments`… |

## Target

```
packages/server/src/
  main.ts, app.ts           start-up, wiring
  api.ts                    the contract with the web app (exported as @n4/server/api)
  db.ts                     storage for every component, for now
  board/                    gateway.ts
  stations/                 station.ts, stations.ts, stationAdmin.ts
  players/                  players.ts
  matches/                  matches.ts
  tournaments/              tournaments.ts, tournamentView.ts, estimate.ts
    plan/                   plan.ts, groups.ts, knockout.ts, types.ts (today's tournament/)
  scheduling/               scheduler.ts
  ratings/                  ratings.ts
  stats/                    stats.ts
  live/                     live.ts, display.ts
  access/                   admin.ts
  operations/               diagnostics.ts, backups.ts
  testing/
    seed.ts                 a realistic match history, for tests that need one
    integration/            tests that exercise several components together
    load/                   the load test
    e2e/                    the whole server on simulated boards, through a restart
```

## Decisions

- **One folder per cluster**, named after the cluster in 5.2, even when it holds one file (`players/`, `ratings/`). Ratings stays its own component on purpose (see the function overview in `docs/architecture/01-introduction-and-goals.md`).
- **`main.ts`, `app.ts`, `api.ts` and `db.ts` stay at the top.** `main.ts` is the Docker image's entry (`dist/main.js`), `api.ts` is exported as `@n4/server/api`, and `db.ts` is shared by every component until it's split.
- **File names stay.** `players/players.ts`, not `players/index.ts`: no barrels, and editor tabs stay readable. Ticket 04 adds `*Routes.ts` files next to the logic.
- **Tests by kind.**
  - **Unit and component tests stay next to their file**, also when they go through `buildApp` (e.g. `players.test.ts` → `players/`). A test belongs to the component it's about.
  - **`testing/integration/`**: tests about several components working together: `app.test.ts` (the wiring), `overrides.test.ts` (tournaments, scheduling, stations), `resultChanges.test.ts` (matches and tournaments), `withdrawals.test.ts` (tournaments and scheduling).
  - **`testing/load/`**: `load.test.ts`.
  - **`testing/e2e/`**: `tournament.e2e.test.ts`, the whole server on simulated boards. The browser end-to-end tests stay in `packages/e2e`.
  - **`testing/seed.ts`**: shared by the tests that need a history.
  - Vitest finds `*.test.ts` everywhere, so no config changes; `pnpm test` still runs all of it.
- **Dependencies stay one-way, enforced.** Server components depend on each other, unlike the web app's features, so there's no ban on importing another component. Instead Biome's `noImportCycles` (level `error`) runs on the whole repo; it passes today.
- **Routes apart from logic.** A component's Fastify routes go in their own file (`playersRoutes.ts` next to `players.ts`), so the logic has no HTTP in it. Routes stay thin: read the request, call the logic, map errors to status codes.

## Out of scope

- **Splitting `db.ts`** so each component owns its queries. The biggest remaining gain, but real refactoring, not a move: a separate spec after this one.
- Renaming modules, changing APIs, a router or DI framework.

## Tickets

1. `issues/01-component-folders.md`: move the modules and their unit tests into component folders.
2. `issues/02-tests-by-kind.md`: `testing/` with `integration/`, `load/`, `e2e/` and `seed.ts`.
3. `issues/03-no-import-cycles.md`: `noImportCycles` in `biome.json`.
4. `issues/04-routes-apart-from-logic.md`: each component's routes in their own file.

# Request input parsed with Zod at the routes

Status: ready-for-agent

Every request body, param and query string is parsed against a Zod schema in its routes file. The logic gets typed values and never sees `unknown`. Today each logic module checks its input by hand (`usableName(value: unknown)`, `preset(value: unknown)`, `(value as number) < 1`), and some routes declare a precise body type that nothing checks at runtime.

## Why (found 2026-11-04)

- **Station commands aren't checked.** `stationsRoutes.ts` declares `Body: StationCommand` and passes `request.body` straight to `station.command`. Three problems follow:
  - `inRule` and `outRule` are never checked (`station.ts`, `assign`), so `{"type":"quickMatch","settings":{"outRule":"banana"}}` is stored in the match's settings and every replay folds the log with it.
  - A missing `playerIds` throws a TypeError and answers 500.
  - An unknown `type` falls out of the `switch` without an error.
- **The tournament config isn't checked.** `mergeConfig` (`tournaments.ts`) casts and spreads `format`, `legs` and `x01` from the request. `configProblems` (`plan/plan.ts`) checks the numbers but not `elimination`, `bracketReset`, `inRule`, `outRule` or unknown keys. Those reach the stored config and, through `x01`, every tournament match's settings.
- **The checks are scattered.** About 60 `unknown`s and the casts that come with them sit across `lights.ts`, `players.ts`, `stations.ts` and `tournaments.ts`, each module with its own style and its own `"invalid"` error variant.

## Decisions (2026-11-04, open to change)

- **Zod 4**, pinned to an exact version like every other dependency, in `@n4/server` only. The engine stays dependency-free.
- **Schemas live in `api.ts`, and the request types are derived from them** (`export type X = z.infer<typeof X>`). The web app keeps importing types only (`import type`), so Zod isn't bundled into it, and the request types can't drift from what the server accepts.
- **Engine types get a matching schema in `api.ts`** (`Segment`, `InRule`, `OutRule`), checked against the engine type with `satisfies z.ZodType<…>`.
- **A small helper over the Fastify type provider.** Routes call `parse(Schema, request.body)`. A `ZodError` becomes a 400 in one error handler in `app.ts`, with the same `{ error: string }` shape as today. No `fastify-type-provider-zod`: one dependency fewer, and the routes stay readable.
- **Route generics stop declaring `Body`.** `request.body` is `unknown` until it's parsed; a declared type is a claim nothing checks.
- **Shape goes in the schema, domain rules stay in the logic.** The schema owns types, ranges and enums: "a whole number of at least 2", "preset 1–250", "known event". The logic keeps whatever needs state: "name already taken", "the match has already started", "3 players per group". Cleanups the logic does today (trimming a name, adding `http://` to an address) can move into the schema with `.transform`, or stay in the logic, whichever reads better per field.
- **User-facing messages stay friendly.** The admin pages show the server's `error` text. Fields that a form sends get a custom message, keeping today's wording ("a device needs a name"). For everything else the 400 names the field and Zod's message ("playerIds: expected array"). The message function is in ticket 01.
- **No migration.** Data already stored was sent by our own UI and is trusted on read. Only requests are parsed.

## Tickets

1. `01-zod-and-station-commands.md`: Zod, the `parse` helper and the 400 handler, and the station commands, which closes the `inRule`/`outRule` hole
2. `02-matches.md`: putting a match on a station, and corrections
3. `03-tournaments.md`: the tournament input and config, and the overrides
4. `04-players-stations-access-callouts.md`: the small bodies
5. `05-lights.md`: the largest set of hand-written checks
6. `06-enforce-and-document.md`: keeping `unknown` out of logic, ADR 0010, architecture docs

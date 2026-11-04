# Zod, the parse helper, and the station commands

Status: done
Type: task

The foundation, carried through one complete route: the station commands, which hold the worst hole (see the spec).

## What to do

- Add `zod` (4.x, exact version) to `@n4/server`.
- A `parse(schema, value)` helper for routes files. It returns the typed value or throws the `ZodError`.
- One error handler in `app.ts`, for both the room's app and `buildPublicApp`, turning a `ZodError` into `400 { error }`. The message comes from the first issue: the custom message if the schema has one, otherwise `<path>: <zod message>`. Other errors go on as today.
- In `api.ts`:
  - `Segment`, `InRule` and `OutRule` schemas, each with `satisfies z.ZodType<EngineType>`.
  - `MatchSettingsInput` as a schema. `startScore` is a whole number ≥ 2 and `legsToWin` a whole number ≥ 1, both with today's messages; `inRule` and `outRule` are enums. All are optional, and no other keys are allowed (`.strict()`).
  - `StationCommand` as a `z.discriminatedUnion("type", …)` covering every command. `playerIds` is a non-empty list of strings.
  - The exported types are derived with `z.infer`, so the web app's imports don't change.
- `stationsRoutes.ts`: the commands route and the board action route (`{ action }`) parse their bodies. Their generics no longer declare `Body`.
- `station.ts`: remove the checks the schema now does (the `startScore`/`legsToWin` checks in `assign`, `isSegment` in `correctDart` and `addDart`). Keep the state checks.
- Params: a shared `IdParams` schema (`{ id: z.coerce.number().int() }`) for the station routes. An id that isn't a number is a 400, an unknown one stays a 404.

## Acceptance

- Tests over HTTP in `stationsRoutes`'s tests: an unknown command type, a missing `playerIds`, `outRule: "banana"`, an extra key in `settings`, an invalid segment and a non-numeric id each get a 400 with a readable `error`, and nothing is stored. Valid commands work as before.
- The `quickMatch` with a bad rule that used to be stored is now refused (regression test).
- `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm e2e` pass; the web app's bundle doesn't contain Zod (check the built `dist/assets`).

## Comments

2026-11-04: Built.
- Zod 4.6.7 is in `@n4/server`.
- `src/parse.ts` has `parse(schema, value)`, `requestProblem(error)` and `IdParams`. A `fastify()` in `app.ts` builds both apps with one error handler: a parse failure becomes `400 { error }`, and every other error goes on to Fastify's own handler.
- Messages: a schema's own message is used as it is ("start score must be …", "not a valid segment", "action must be …"). Every other message is `<path>: <Zod's English message>`, which comes from a per-parse error map, so nothing global is configured.
- `api.ts`:
  - `SegmentInput` reuses the engine's `isSegment` and keeps only `number` and `multiplier`.
  - `MatchSettingsInput` uses `.exactOptional()` per field instead of `.partial()`, because `.partial()` adds `| undefined`, which breaks `Required<MatchSettingsInput>` in the web app under `exactOptionalPropertyTypes`.
  - The rule enums are objects that satisfy `{ [R in InRule]: R }`, so a rule added to the engine fails the typecheck until the schema has it.
  - `StationCommand` is a strict discriminated union, and `BoardAction` moved here from `station.ts`.
- The station routes parse their params and bodies; no generic declares `Body`. `station.ts` no longer checks segments.
- **Not done here:** `assign`'s `startScore`/`legsToWin` checks stay, because `POST /api/admin/matches` still passes its `settings` unparsed. Ticket 02 removes them.
- Found on the way: the engine's `isSegment` accepts a triple bull (`{ number: 25, multiplier: 3 }`) and a missed bull (`{ 25, 0 }`). That was already the case and is left alone.
- Tests in `station.test.ts` ("a command that doesn't fit"): unknown or missing type, missing or non-list players, unknown in and out rules, unknown settings, bad start score and legs, bad segments, extra segment keys stripped, non-numeric and unknown station ids, and the board action's message. The web bundle has no Zod (`ZodError` doesn't appear in `dist/assets`).

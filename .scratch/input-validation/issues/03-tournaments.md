# Tournaments: input, config, overrides

Status: ready-for-agent
Type: task
Blocked by: 01

## What to do

- In `api.ts`:
  - `TournamentConfigPatch`: each section (`format`, `legs`, `x01`) is optional and partial, with every field typed. `format.groups` and the `legs` fields are whole numbers ≥ 1; `advancePerGroup` is a whole number ≥ 1 or `null`; `elimination` is an enum; `bracketReset` is a boolean; `x01` uses 01's `startScore` and the `InRule`/`OutRule` schemas. No other keys are allowed.
  - `TournamentInput` (`name`, `playerIds`, `config`, `seedOrder`) as a schema, its type derived.
- `tournamentsRoutes.ts`: create and update parse `TournamentInput`. Withdraw, late, pause, hold, send back and play now parse their bodies (`playerId`, `paused`, `held`, `station`).
- `tournaments.ts`:
  - `mergeConfig` takes the parsed patch and no longer casts.
  - `checkPlayers` and the `String(input.name ?? "")` handling simplify to what the schema leaves.
  - The seed-order check keeps "exactly the entrants" and drops `Array.isArray`.
- `plan/plan.ts`: `configProblems` keeps only the rules that depend on the player count or on other fields (players per group, players advancing to the knockout). The type and range checks are now in the schema. Watch out: `configProblems` also reports problems on a draft for the admin page, so check that the draft view shows the same problems as before.

## Acceptance

- Tests over HTTP: an unknown `elimination`, `inRule: "banana"`, a string for `groups`, an extra key in `config` and `paused: "yes"` each get a 400, and the stored tournament doesn't change. The tournament tests in `testing/integration` still pass.
- All checks pass.

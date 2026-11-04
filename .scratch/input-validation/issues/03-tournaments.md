# Tournaments: input, config, overrides

Status: done
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

## Comments

2026-11-04: Built.
- `api.ts`:
  - `TournamentConfigPatch`: each section is strict and every field optional. `elimination` is an enum tied to `Elimination`. `x01` is `MatchSettingsInput.pick(startScore, inRule, outRule)`, so it shares 01's messages and refuses `legsToWin`. Each section's keys `satisfies` the matching type in `plan/types.ts`, so a misspelt key fails the typecheck.
  - `TournamentInput` moved here from `tournaments.ts`, along with `TournamentPlayerInput`, `StationPauseInput`, `MatchHoldInput`, `MatchPinInput` and `PlayNowInput`.
- `tournaments.ts`: `mergeConfig` takes the parsed patch without a cast. `checkPlayers` takes `string[]`. The name handling and the seed order lost their `String()`, `Array.isArray` and cast.
- `plan/plan.ts`: `configProblems` keeps only the rules that depend on the player count: players per group, players advancing, two in the knockout. Removed: groups ≥ 1, advancing ≥ 1, legs ≥ 1 and start score ≥ 2, which the schema covers now. None of the removed messages had a test, and the admin page only sends values from `<select>`s, so it can't hit a 400.
- **Behaviour change:** `paused`, `held` and `station` (pin) are now required. Before, a missing `paused`/`held` meant `true` and a missing pin station meant `null`. The web app and the tests always send them.
- Tests in `tournaments.test.ts` ("a tournament request that doesn't fit"):
  - configs with an unknown elimination, groups as text, 0 groups, a bracket reset as text, legs that aren't whole, an unknown in rule, `legsToWin` in `x01` and an unknown section each get a 400 on create and on update, and the draft's config doesn't change;
  - bad top-level fields get a 400;
  - every override route with a bad or missing body or id gets a 400.

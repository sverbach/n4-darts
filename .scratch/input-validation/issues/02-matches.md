# Matches: putting a match on a station, and corrections

Status: done
Type: task
Blocked by: 01

## What to do

- `matchesRoutes.ts`:
  - `POST /api/admin/matches` parses `{ station, playerIds, settings }` (the station's id as a whole number, `playerIds` as in 01, `settings` as `MatchSettingsInput`).
  - The correction route parses `{ dartId: string, segment: Segment }`.
  - Every `:id` param uses the shared schema. Match ids are UUIDs, so that schema is `z.string()`; no UUID check is needed, since an unknown id is a 404.
- Remove the hand-written checks that 01's schemas now cover: the `playerIds` check in the route, `isSegment` in the correction path, and the `startScore`/`legsToWin` checks in `station.ts`'s `assign`, which 01 left because this route was their last unparsed caller. Tournament matches reach `assign` with the config's `x01`, which 03 parses. `MatchError`'s `"invalid"` reason goes if nothing uses it anymore.

## Acceptance

- Tests over HTTP: a missing or wrong-typed field, a bad rule in `settings` and an invalid segment each get a 400, and nothing changes. Valid requests work as before.
- All checks pass.

## Comments

2026-11-04: Built.
- `api.ts` has `NewMatchInput` (`station`, `playerIds`, `settings`) and `CorrectionInput` (`dartId`, `segment`), both strict. `parse.ts` has `TextIdParams` for string ids (matches now, players in 04).
- `matchesRoutes.ts` parses every body and param, and no route declares a generic any more.
- `matches.correct(id, dartId: string, segment: Segment)` is typed: no `isSegment`, no casts.
- `MatchError` lost its `"invalid"` reason, and `STATUS` lost its 400.
- `station.ts`'s `assign` no longer checks `startScore`/`legsToWin`. Every caller that brings settings is now parsed. Tournament matches don't go through `assign` (`take`). Their config's `x01` is still unparsed until 03, but `configProblems` already checks the start score and the legs before a tournament can start.
- Tests in `matches.test.ts`: creating a match without a station, with a non-numeric station, an unknown out rule, a start score of 1, 0 legs or an unknown field gets a 400 and puts nothing on the station. A correction with an invalid segment, no segment, no dart or an unknown field gets a 400 and leaves the log as it was.

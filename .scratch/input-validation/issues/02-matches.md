# Matches: putting a match on a station, and corrections

Status: ready-for-agent
Type: task
Blocked by: 01

## What to do

- `matchesRoutes.ts`:
  - `POST /api/admin/matches` parses `{ station, playerIds, settings }` (the station's id as a whole number, `playerIds` as in 01, `settings` as `MatchSettingsInput`).
  - The correction route parses `{ dartId: string, segment: Segment }`.
  - Every `:id` param uses the shared schema. Match ids are UUIDs, so that schema is `z.string()`; no UUID check is needed, since an unknown id is a 404.
- Remove the hand-written checks that 01's schemas now cover (the `playerIds` check in the route, `isSegment` in the correction path). `MatchError`'s `"invalid"` reason goes if nothing uses it anymore.

## Acceptance

- Tests over HTTP: a missing or wrong-typed field, a bad rule in `settings` and an invalid segment each get a 400, and nothing changes. Valid requests work as before.
- All checks pass.

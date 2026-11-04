# Players, station config, access, callouts

Status: ready-for-agent
Type: task
Blocked by: 01

The small bodies, done together.

## What to do

- **Players** (`playersRoutes.ts`, `players.ts`):
  - Parse `{ name }` for both add routes and `{ name?, archived?, public? }` for the update, with booleans as booleans.
  - `add`, `update` and `setPhoto` take typed input.
  - Keep "name already taken" and the archive rules in the logic. The name cleanup (`cleanName`) may move into the schema as a `.transform`.
  - The photo upload stays a `Buffer` body; only its param is parsed.
- **Station config** (`stationsRoutes.ts`, `stations.ts`):
  - Parse `{ id, name, boardUrl }` for adding and `{ name?, boardUrl? }` for updating.
  - `add` and `update` take typed input.
  - `checkUrl` either becomes part of the schema or stays in the logic on a `string`.
- **Access** (`accessRoutes.ts`): parse `{ pin: string }` for both logins. A missing PIN is a 400; a wrong one keeps today's answer.
- **Callouts** (`calloutsRoutes.ts`):
  - Parse `{ id }` for the active pack and `{ name? }` for the upload's query string.
  - The `:id`/`:file` params are parsed too. Keep the existing check against `..` in a file name, wherever it lives today.
- **Query strings** elsewhere: `view` on `/api/stations/:id` (`"watch" | "station"`, defaulting to `"station"`) and `v` on the player photo (optional string).

## Acceptance

- Tests over HTTP for each route group: a wrong-typed field gets a 400 and changes nothing; the existing refusals ("name already taken", a wrong PIN) answer as before.
- No `unknown` parameters are left in `players.ts` or `stations.ts`.
- All checks pass.

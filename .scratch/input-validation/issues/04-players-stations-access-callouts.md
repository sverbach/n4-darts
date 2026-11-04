# Players, station config, access, callouts

Status: done
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

## Comments

2026-11-04: Built.
- **Players:**
  - `NewPlayerInput` and `PlayerChangesInput` in `api.ts`. The name cleanup (trim, collapse spaces, not empty) moved into the schema as a `.transform` + `.pipe`, with the same message ("a player needs a name").
  - `players.add(name: string)`, `update(id, PlayerChangesInput)` and `setPhoto(id, Buffer)` are typed. "Already taken" and "must be a JPEG" stay in the logic.
  - `archived` and `public` must be booleans now. Before, anything that wasn't `true` or `false` was coerced.
- **Station config:**
  - `NewStationInput` and `StationChangesInput`, with the station number and board address messages unchanged.
  - `checkUrl` stays in `stations.ts` on a `string`. It turns the address into its origin, which reads better there than as a transform. The default name (`Station n`) stays there too, since it needs the id.
  - A station number sent as text (`"3"`) is refused now. Before, `Number()` accepted it.
- **Access:** both logins parse `{ pin: string }`. A missing PIN is a 400 and skips the public site's wrong-password delay. Fine: that request can't succeed anyway.
- **Callouts:**
  - Choosing a pack parses `ActivePackInput`, with the old message.
  - The upload parses its query (`name`, default `""`) and its body.
  - File params are parsed. The `..` guard is `packs.file`'s `STORED` regex, untouched.
- **Shared:** `FileBody` in `parse.ts` (`z.instanceof(Buffer)`) for the photo and the pack. Route-only schemas (`LiveQuery`, `PhotoQuery`, `FileParams`, `UploadQuery`) live in their routes files, since the web app never needs their types.
- `?view=` on a station's live stream is `station` or `watch`. Anything else gets a 400 instead of counting as `station`.
- Tests: refusals and "nothing changed" checks for players (add on both routes, update, photo), logins, voice packs (choose, upload) and stations (add, update, a non-numeric id, an unknown live view).

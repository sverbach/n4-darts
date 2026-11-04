# Lights

Status: done
Type: task
Blocked by: 01

`lights.ts` has the most hand-written checks (`usableName`, `usableUrl`, `preset`, `events`), and they have the most messages the admin page shows.

## What to do

- In `api.ts`:
  - `LightDeviceInput` (`name`, `url`). The name is trimmed and not empty, with the message "a device needs a name". The address gets `http://` when it has none and loses any trailing `/`, as `usableUrl` does today, with its message.
  - `StationLightsInput`: the device id or `null`; the idle and playing presets, each 1–250 or `null`; and `events` as a partial record over `LIGHT_EVENTS`. Each event is `null` or `{ preset: 1–250, seconds: 1–MAX_SECONDS }`. Keep today's messages, including the event's name ("bust's preset must be …").
  - `LightTestInput` (`{ event }`, one of `LIGHT_EVENTS`).
- `lightsRoutes.ts`: drop the shared loose `Body` type; each route parses its own schema.
- `lights.ts`: `addDevice`, `updateDevice`, `saveStation` and `testEvent` take typed input. The four helpers go away. "No such device" and "no such station" stay in the logic.

## Acceptance

- `lights/lights.test.ts` passes. Where a test asserted a message, the message is unchanged.
- New tests over HTTP: an unknown event, a preset of 0 or 251, seconds that aren't whole and an extra key each get a 400.
- No `unknown` parameters are left in `lights.ts`.
- All checks pass.

## Comments

2026-11-04: Built.
- `api.ts`:
  - `NewLightDeviceInput` and `LightDeviceChangesInput`. The name is trimmed and not empty. The address cleanup (`http://` added, trailing `/` dropped, a hostname required) is a `.transform` that adds a custom issue.
  - `StationLightsInput`: `deviceId` is a whole number or `null`; the presets are 1–250 or `null`; `events` is a strict object with one key per `LightEvent`. Each event is `{ preset, seconds }` or `null`, and a transform drops the `null`s, so the logic gets `Partial<Record<LightEvent, EventLight>>`.
  - `LightTestInput`.
  - `LIGHT_EVENTS` is an object tied to `LightEvent` (moved here from `lights.ts`, where it was only used for checks), and `MAX_LIGHT_SECONDS`.
- Every message is the same as before, including the event's name ("bust's preset must be …", "s180 runs from 1 to 600 seconds", "no such event: nope", "events must be an object").
- `lights.ts`: `usableName`, `usableUrl`, `preset` and `events` are gone (about 50 lines), and so are the casts. `addDevice`, `updateDevice`, `saveStation` and `testEvent` are typed. "No such device", "no such station", "the station has no device" and "the event has no preset" stay.
- `lightsRoutes.ts`: the loose shared `Body` type is gone, and every route parses its params and body.
- Tests in `lights.test.ts` ("a lights request that doesn't fit"): devices (no name, a blank name, no address, a bad address, an unknown field) and the address cleanup; a station's lights (unknown event, events not an object, presets 0 and 251, seconds that aren't whole or too many, missing seconds, `deviceId` as text, an unknown field), each with an exact message and the lights left as they were; testing an unknown event and a non-numeric id.
- Not in scope: `wled.ts` still casts the WLED device's JSON answers (`/json/info`, `/presets.json`). That's input from a device rather than a request, so a candidate for a later ticket.

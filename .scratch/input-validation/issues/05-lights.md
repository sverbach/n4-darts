# Lights

Status: ready-for-agent
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

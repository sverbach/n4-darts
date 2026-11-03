# Lights configuration

Status: done
Type: task
Blocked by: 01

## What to do

- Database: devices (name, URL); per station: device, idle preset, playing preset; per station and event: preset and duration (s). Events: match start, leg won, game shot, 180, bust, high checkout.
- Admin API (behind the PIN): list and change all of it; `POST .../devices/:id/test` (info and presets), `POST .../stations/:id/test` with an event (starts it once).

## Acceptance

- API tests; settings survive a restart.

## Comments

2026-11-03: Built. Database (schema version 6): `light_devices` (id, name, URL) and `light_stations` (per station: device, idle preset, playing preset, and the events as JSON: preset and seconds each); deleting a station drops its row, deleting a device leaves its stations without one. Events: `matchStart`, `legWon`, `gameShot`, `s180`, `bust`, `highCheckout`. `lights/lights.ts` checks what comes in (a name, an address that gets `http://` if it has none, presets 1–250, 1–600 seconds, known events, an existing device and station). Admin API under `/api/admin/lights` (behind the PIN): `GET` (every device, every station with its lights, empty ones too), `POST/PATCH/DELETE devices`, `POST devices/:id/test` (name, version, presets; 502 with the reason when unreachable), `PUT stations/:id`, `POST stations/:id/test` with `{ event }` (starts that preset once; 03 makes it return to the base preset). The write wrapper in `db.ts` now passes return values through (a new device's id). Tests: `lights/lights.test.ts` (listing, devices, a station's lights and refusals, a restart, testing a device online and offline, testing an event, the PIN).

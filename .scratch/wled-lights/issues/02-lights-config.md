# Lights configuration

Status: needs-triage
Type: task
Blocked by: 01

## What to do

- Database: devices (name, URL); per station: device, idle preset, playing preset; per station and event: preset and duration (s). Events: match start, leg won, game shot, 180, bust, high checkout.
- Admin API (behind the PIN): list and change all of it; `POST .../devices/:id/test` (info and presets), `POST .../stations/:id/test` with an event (starts it once).

## Acceptance

- API tests; settings survive a restart.

# WLED lights for stations

Status: done

The room has WLED light strips with presets. Certain match events at a station should start a preset, configured in admin: which device, which station, which event starts which preset.

## Decisions (with the user, 2026-11-02)

- **WLED's JSON API directly**, on the LAN (no Home Assistant): `GET /json/info` to test a device, `GET /presets.json` to list its presets, `POST /json/state` with `{"ps": n}` to start one.
- **Events:** match moments: match start, leg won, game shot (match won), 180, bust, high checkout (100+).
- **After an event:** the event's preset runs for a duration set per event, then the station's base preset comes back.
- Decided here: each station has two base presets (idle: no match; playing: a match on), a device can serve several stations, and a station has at most one device.
- Lights never slow down play: calls are fire-and-forget with a short timeout, off the dart path; a device that's offline is logged in diagnostics, not shown as an error at the board.

## Tickets

1. `01-wled-client-and-fake.md`: a WLED client and a fake WLED device for dev and tests
2. `02-lights-config.md`: devices, stations, base presets and event presets stored and served to admin
3. `03-event-triggers.md`: the station's events start presets and return to the base preset
4. `04-lights-admin-tab.md`: Admin → Lights: devices with test connection and presets, per-station mapping, test buttons
5. `05-lights-docs.md`: architecture docs, README (fake WLED in dev:sim), ADR 0009
6. `06-real-lights-check.md`: the real strips on a darts evening (needs the user)

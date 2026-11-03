# Lights through WLED's JSON API, fire-and-forget

The room's light strips run WLED. The server talks to each controller directly over its local JSON API (`GET /json/info`, `GET /presets.json`, `POST /json/state` with `{"ps": n}`), with no Home Assistant or other hub in between: one less thing to run, and it works with the internet unplugged (ADR 0005). The organiser maps match moments to presets saved on the device; the light effects themselves stay WLED's.

Lights never hold up play. The show follows the change feed, after a dart has been handled; calls to a device aren't awaited and give up after 2 seconds. A device that's offline or slow is counted in diagnostics, never shown as an error at the board. WLED's API is unauthenticated, like the Board Manager's: anyone on the network can change the lights, which is accepted for a private room.

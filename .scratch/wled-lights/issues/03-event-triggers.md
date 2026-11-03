# Station events start presets

Status: ready-for-agent
Type: task
Blocked by: 01, 02

## What to do

- A lights module listens to each station's match events and maps them: match start (the match leaves "not started"), leg won, game shot (match won), 180 (a visit of 180), bust, high checkout (a checkout of 100+). If a station has a preset for the event, it starts it, and after the event's duration the station's base preset (playing while a match is on, idle otherwise); a newer event replaces a running one. The base preset also follows a match starting and closing.
- Fire-and-forget off the dart path; failures counted in diagnostics.

## Acceptance

- Tests with the fake WLED and the board simulator for each event and the return; the load test unchanged (no slower darts).

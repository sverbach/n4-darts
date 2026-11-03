# Station events start presets

Status: done
Type: task
Blocked by: 01, 02

## What to do

- A lights module listens to each station's match events and maps them: match start (the match leaves "not started"), leg won, game shot (match won), 180 (a visit of 180), bust, high checkout (a checkout of 100+). If a station has a preset for the event, it starts it, and after the event's duration the station's base preset (playing while a match is on, idle otherwise); a newer event replaces a running one. The base preset also follows a match starting and closing.
- Fire-and-forget off the dart path; failures counted in diagnostics.

## Acceptance

- Tests with the fake WLED and the board simulator for each event and the return; the load test unchanged (no slower darts).

## Comments

2026-11-03: Built. `lights/show.ts` listens to the change feed (already off the dart path: it runs a turn after the change settles) and compares each station's match with what it saw last: match start (it leaves "not started"), game shot (the match is won), leg won (a leg is won and the match isn't), and per visit a bust, a high checkout (100+) or a 180 (three darts, 180), each visit event once (keyed by its first dart). When a dart is several at once, the first one with a preset runs: game shot, high checkout, leg won, 180, bust, match start. The event's preset runs for its seconds, then the base comes back (playing while a match has started, idle otherwise); a newer event replaces a running one; the base follows a match starting, ending or being abandoned, and a change of the station's lights. Calls aren't awaited; every call and failure is counted per device in diagnostics (`DiagnosticsView.lights`, and a "Lights" section on the page), and an error inside the show is counted, never thrown. Admin's event test now hands back to the show, so the base returns after it. Tests (`lights/show.test.ts`, board simulator and fake WLED): idle → playing → idle; match start, bust, leg won, game shot with the return to playing; a 180 only on the third dart; a high checkout over a leg won; the test button; an offline device counted while play goes on. The load test passes unchanged.

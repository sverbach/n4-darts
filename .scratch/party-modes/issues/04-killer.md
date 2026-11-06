# Party modes: Killer

Status: done
Type: task
Blocked by: 01

See the spec's decisions.

## What to do

- Engine:
  - **Numbers:** a distinct random number from 1–20 per player, drawn when the match starts and stored in the event log (e.g. on `MatchStarted`), so a replay gives the same numbers.
  - **Lives:** the organiser's choice, default 3.
  - **Charging:** your own number adds 1, 2 or 3 marks (single, double, treble). At 3 marks you're a killer. Extra marks are dropped, and charge never goes down.
  - **As a killer:** another player's double takes one of their lives, and your own double takes one of yours. Singles, trebles and the bull do nothing. Before you're a killer, doubles do nothing.
  - At 0 lives a player is out, and darts at their number do nothing. The last player with lives wins on the spot. That includes a killer knocking themselves out and leaving one player.
- The lives option in the mode picker.
- Scoreboard: each player's number (big), charge (0–3), lives, a killer badge and an "out" state. The target board highlights the current player's own number while charging. As a killer, it highlights the doubles of opponents who are still in.

## Acceptance

- Engine tests: a distinct, stable draw on replay, charging with overflow dropped, doubles before being a killer doing nothing, a kill, an own double, darts at a player who's out, the last player standing winning on the spot, and corrections that un-kill or un-charge replaying correctly.
- Checked in the simulator with 2 and 8 players on the station and /watch.
- All checks pass.

## Comments

2026-11-06: Done.
- **Numbers:** when a Killer match starts, the station draws a distinct number from 1–20 per player (`drawKillerNumbers`) and stores it on `MatchStarted` (`numbers`). The engine refuses a Killer start without valid numbers.
- **Engine** (`killer.ts`): your own number charges you (1/2/3, capped at 3, never taken away). Once you're a killer, another player's double takes one of their lives, and your own double takes one of yours. Singles, trebles, the bull, and darts at a player who's out do nothing. A visit ends early when the thrower knocks themselves out. The last player with lives wins on the spot, and players who are out are skipped (`upNext` included). A dart's `score` is 1 when it did something, so the visit panel shows "Hits".
- **Setup:** Lives (1–9, default 3) in the Game picker. The server refuses 0 and 10.
- **Screens:** the player list shows each player's number big, then "Charge 1/3 · 3 lives", "Killer · 2 lives" or "Out", with players who are out dimmed. The target board lights your own number while you charge, and as a killer the double rings of every opponent still in. /display shows each player's lives.
- **Calls and lights:** the match shot only.
- **Tests:** engine (`killer.test.ts`: the draw, charging and overflow, doubles before and after becoming a killer, the own double, out players skipped and ignored, knocking yourself out, winning on the spot, a correction that takes a kill back), and the server (the draw stored and used, lives refused).
- **Visual suite:** "Killer on station 1" reads the drawn numbers from the API to throw. The numbers are random, so its shots cover the target board (Playwright `mask`, a new optional argument to `shoot`) and collapse numbers to "0". I checked an uncovered kiosk shot by hand: a killer sees exactly the opponents' double rings lit. The shots stayed the same across three fresh draws.
- typecheck, lint, 791 unit tests, build, e2e (41) and the visual suite (8) pass.

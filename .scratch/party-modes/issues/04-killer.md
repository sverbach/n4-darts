# Party modes: Killer

Status: ready-for-agent
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

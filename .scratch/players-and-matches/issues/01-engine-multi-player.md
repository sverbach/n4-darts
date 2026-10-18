# Engine: matches with 2–8 players

Status: ready-for-agent
Type: task

In `packages/engine`, test-first. Generalise X01 from exactly two players to 2–8.

- `PlayerIndex` becomes a plain index into the match's player order; `MatchState.players` is an array with one entry per player.
- `MatchStarted` carries the player count (or the order is passed in), so the fold knows how many players there are. Remove `firstPlayer`: the order itself says who starts leg 1.
- Turn order follows the player order; the leg starter moves one place along it every leg (two players: alternating, as today).
- A leg ends at the first checkout. The match is won by the first player to `legsToWin` legs.
- Add a `rulesVersion` to the settings (or alongside them) so old matches replay under the rules they were played with (ADR-0002 consequence). Start at 1.
- Keep existing tests passing in two-player form; add tests for 3 and 8 players, starter rotation across legs, and a checkout by a non-starter.

Adjust `packages/server` and `packages/web` only as far as needed to compile and keep their tests passing with two players.

## Acceptance

- Engine tests cover 2, 3 and 8 players, starter rotation, and a win by first to N legs.
- typecheck, lint, test and build pass.

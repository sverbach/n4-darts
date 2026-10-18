# Engine: matches with 2–8 players

Status: done
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

## Comments

**2026-10-18, done.** `MatchStarted { playerCount }` replaces `firstPlayer`: the order is the match's player list, player 0 starts leg 1, the starter moves one place each leg. `PlayerIndex` is a plain number, `MatchState.players` an array (empty before the match starts). `MIN_PLAYERS` / `MAX_PLAYERS` (2 / 8) and `RULES_VERSION` (1) are exported; `rulesVersion` is part of `X01Settings`, and `matchState` throws on a player count or rules version it doesn't know. The server's `startMatch` now takes names in throwing order (2–8) and always stamps the current rules version; the station page still has two name fields and reorders them by "throws first".
- Don't deploy this on its own over the existing database: a match still open from the skeleton has no `rulesVersion` and an old `MatchStarted`, so the station would throw on startup. Ticket 04 wipes the old tables.

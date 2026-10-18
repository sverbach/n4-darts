# X01 engine

Status: done
Type: task
Blocked by: 01

Pure function `state = fold(rules, events)` in `packages/engine`. Test-first.

- Settings: starting score (default 301), in rule (straight / double / master / bull…, default straight), out rule (straight / double / master, default straight), legs to win (one leg for now, but model it).
- Events: `LegStarted(firstPlayer)`, `DartDetected(segment)`, `DartCorrected(visitIndex, dartIndex, segment)`, `TakeoutFinished`, `VisitEndedManually`, `VisitUndone`.
- A dart scores `number * multiplier` (see `docs/board-manager-api.md`).
- After 3 darts, bust or checkout: state is "awaiting takeout"; further darts are ignored until takeout (ADR-0003).
- Bust: below zero, or a remainder the out rule can't finish (e.g. 1 with double out); the visit scores nothing.
- Expose: remaining per player, whose turn, current visit darts, phase (throwing / awaiting takeout / leg won), winner.

## Acceptance

- Tests cover: plain scoring, bust (below zero, and 1 left on double out), checkout on dart 1/2/3, darts after bust ignored, correction that turns a bust into a non-bust and vice versa, double-in not yet "in", alternating throw order.

## Comments

**2026-10-18, done.** Default start score changed to 301. One seam, agreed up front: `matchState(settings, events)` in `packages/engine/src/x01.ts`, 37 tests in `x01.test.ts`. Deviations from the ticket, agreed with the user:
- Event `MatchStarted(firstPlayer)` instead of `LegStarted`: the engine models the whole match (legs to win, starter alternates per leg).
- `DartThrown(dartId, segment)` / `DartCorrected(dartId, segment)`: corrections reference a dart id, not visit/dart indexes.
- In rules: straight / double / master / bull (outer bull or bullseye).
- `VisitUndone` drops the visit in progress if it has darts, otherwise the last finished visit (also across legs, un-winning a leg or match).
- Players are indexes 0 and 1; mapping to real players is the server's job. Events before `MatchStarted` are ignored.

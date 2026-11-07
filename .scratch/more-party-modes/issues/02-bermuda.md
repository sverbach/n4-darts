# More party modes: Bermuda

Status: done
Type: task

See the spec's decisions.

## What to do

- Engine (`bermuda.ts`, on `playRounds`):
  - **Options:** order, classic (default) or shuffled. Shuffled draws all 13 targets at the start and stores the order in the event log, like the random Golf course.
  - **Targets:** 12, 13, 14, any double, 15, 16, 17, any treble, 18, 19, 20, the outer bull (25 or 50 count), the bull (only 50).
  - **Scoring:** every hit scores its full value. A visit with no hits halves the score, rounded down, including a visit taken out with no darts.
  - **Win:** the highest score after 13 rounds. The tied leaders play sudden death at the bull (25s and 50s count), one visit each, repeated while level.
- Setup: the order in the Game picker. The server refuses other orders.
- Screens: the round's target big, the 13 targets in order (done, current, to come), the score per player, and a mark on anyone halved this round. "Bermuda · Round 4 of 13: any double", or "… · Sudden death at the bull". The target board highlights the target: the number, every double, every treble, or the bulls.
- Calls and lights: the match shot only.

## Acceptance

- Engine tests: hits score their value in each kind of round, halving rounds down (and 0 stays 0), an early takeout with no darts halves, a 25 doesn't count in the bull round, the shuffled order replays the same after a correction, the win after 13 rounds, and sudden death.
- Checked in the simulator with 2 and 8 players, classic and shuffled, on the station and /watch at 390 px.
- All checks pass.

## Comments

2026-11-08: Done.
- **Engine** (`bermuda.ts`): targets are 12–20, `"double"`, `"treble"`, 25 (the outer-bull round: 25 or 50 count) and 50 (the bull round: only 50). The type lives in `events.ts` as `BermudaTarget`, since a shuffled order is stored on `MatchStarted.targets` (and a type import the other way is a cycle). **The bullseye counts in the doubles round** (it's the double bull), for 50. Each player has a `total` and per round `{ scored, halved }`; a visit in progress shows its hits so far and can only halve once it's over (three darts or the takeout).
- **Sudden death** is at the outer bull (25s and 50s count) and **doesn't halve**: halving both leaders can't separate them, and a hit beats a miss either way.
- **Setup:** Order, "Classic" or "Shuffled", in the Game picker. The server refuses other orders.
- **Screens:** a panel with "Round 4 of 13", the target big ("Any double", "17", "Outer bull", "Bull"), and the 13 targets in a row (done dimmed, current in accent). On the station it's above the player list; on /watch above the board, like Random Checkout's (both now go through `ModePanel`). The cards show the total and this round's "+36" or "Halved". The target board lights the number, every double ring and the bull, every treble ring, or the bulls. The strip reads "Bermuda · Round 4 of 13: Any double" or "… · Sudden death at the bull". The game shot and /display show the total.
- **Calls and lights:** the match shot only.
- **Tests:** engine (`bermuda.test.ts`: the classic order, hits in each kind of round, the bullseye as a double, 25 vs 50 in the bull rounds, halving rounded down, 0 staying 0, an early takeout with no darts, hits so far in an open visit, the win, sudden death without halving, the shuffled order after a correction, refused orders), and the server (the shuffled draw at the start, classic by default, a refused order).
- **Visual suite:** "Bermuda on station 1", three players, classic order (nothing to mask). The baselines still need taking on the Mac (`pnpm --filter @n4/e2e visual --update-snapshots -g "Bermuda|Random Checkout"`); checked here on Windows screenshots.
- typecheck, lint, the unit tests (847 of 848; the diagnostics test that fails on this Windows machine regardless), build and e2e (43) pass.

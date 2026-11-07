# More party modes: Bermuda

Status: ready-for-agent
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

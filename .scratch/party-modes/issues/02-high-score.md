# Party modes: High Score

Status: ready-for-agent
Type: task
Blocked by: 01

See the spec's decisions.

## What to do

- Engine: N rounds (1–20, default 7). A visit scores the plain sum of its darts, with the bull as 25/50. The highest total wins.
- **Sudden death:** when the leaders are level after the last round, only they throw one more visit each, round after round, until one is ahead.
- Calls: the visit score as in X01 (including 180) and `matchshot` for the winner. Lights: match start, game shot and 180.
- The rounds option in the mode picker.
- Scoreboard: totals, the current round of N, and a "sudden death" marker. The target board highlights nothing in particular.

## Acceptance

- Engine tests: totals, the last round ending the game, a two-way and a three-way tie going to sudden death, and a tie in sudden death playing on.
- Server test: a 180 in High Score calls 180 and fires the 180 light, but counts in no stats.
- Checked in the simulator on the station and /watch.
- All checks pass.

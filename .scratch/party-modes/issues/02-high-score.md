# Party modes: High Score

Status: done
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

## Comments

2026-11-06: Done.
- **Engine** (`highScore.ts`): the totals, the round, `suddenDeath` and `contenders` (who's still in). A round ends after each contender's visit is over (three darts, or taken out early). After the last round the single leader wins on the spot, even before the takeout. If the leaders are level, only they play on, one visit each, and the totals keep adding up. `upNext` skips players who are out.
- **Calls:** visit scores as in X01, including 180. The deciding visit calls its score, then the match shot. **Lights:** 180 and the game shot (`scoresPoints(mode)` decides which modes have score calls and visit lights).
- **Setup:** the Game picker has a Rounds option (1–20, default 7). The server refuses 0 or 21.
- **Screens:** the cards show totals and "Last N". In sudden death they show "Sudden death" on the contenders and "Out" on the rest. The strip on the station and /watch reads "High Score · Round 3 of 7" or "High Score · Sudden death" (`liveLabel` in `lib/modes.ts`, which `lib/targets.ts` became). There's no target board in High Score. The game shot shows the winner's total. The live admin view shows each visit's score.
- **Tests:** engine (`highScore.test.ts`), the server (setup with rounds, refusals, a 180 that counts in no stats), light events, and calls.
- **Visual suite:** a new "High Score on station 1, into sudden death" test (station phone/kiosk, /watch, the win). No existing baseline changed.
- typecheck, lint, 761 unit tests, build, e2e (41) and the visual suite (6) pass.

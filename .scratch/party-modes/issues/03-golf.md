# Party modes: Golf

Status: ready-for-agent
Type: task
Blocked by: 01

See the spec's decisions.

## What to do

- Engine: 9 or 18 holes (default 9), and hole N's target is N. A dart at the hole's number scores treble 1, double 2, single 3; anything else scores 5. **The best dart of the visit counts.** A visit ended early keeps its best dart so far, and one with no darts scores 5. The lowest total wins.
- **Sudden death:** tied leaders play the next holes. After 9: 10, 11, …. After 18: 19, 20, the bull (bull 1, outer bull 2, anything else 5), then 1, 2, ….
- The holes option in the mode picker.
- Scoreboard: a scorecard (holes by players, totals), with the current hole highlighted and the visit's best dart so far shown. The target board highlights the hole's number (or the bull).

## Acceptance

- Engine tests: the best dart counting (e.g. T, then S, then miss scores 1), a visit ended early, an empty visit scoring 5, 9 and 18 holes, sudden death after 9, and sudden death after 18 going through 19, 20, the bull and back to 1.
- Checked in the simulator on the station and /watch, at 390 px with 18 holes and 8 players (the scorecard has to fit or scroll inside itself, not the page).
- All checks pass.

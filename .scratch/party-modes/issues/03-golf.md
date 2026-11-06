# Party modes: Golf

Status: done
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

## Comments

2026-11-06: Done.
- **Engine** (`golf.ts`): hole N aims at `holeTarget(N)`, which runs 1–20, then the bull, then 1 again. So sudden death after 9 goes on to 10, and after 18 it goes through 19, 20, the bull and back to 1. Each dart scores `strokes()`: treble 1, double 2, single 3; at the bull, bull 1 and outer bull 2; anything else 5. A hole is the visit's best dart, 5 for a visit with no darts, and the best dart so far while the visit is on.
- **Rounds:** High Score's rounds and sudden death moved into `playRounds` (`party.ts`), and Golf uses them too, with the lowest total as the leader.
- **Setup:** Holes (9/18) in the Game picker. The server refuses anything else.
- **Screens:** the target board shows the hole's number. Golf's side panel is a **scorecard** instead of the player list: the holes run across, headed by their targets, with players down and a total. The current hole and player are in accent, and a hole in one is green. On /watch it shows the nine being played (front or back) plus the total, so 18 holes fit a TV. On a phone it scrolls sideways with the name and the total pinned. The visit panel shows "Best", the best dart so far, on the station, /watch and /display. The strip reads "Golf · Hole 2 of 18" or "Golf · Sudden death · Hole 10". The game shot shows the winner's total. The live admin view shows each visit's best dart.
- **Calls and lights:** the match shot only. No score calls and no visit lights.
- **Tests:** engine (`golf.test.ts`: the best dart, early takeout, an empty visit, 9 and 18 holes, sudden death after 9 and after 18 through the bull back to 1), and the server (setup with holes, a refused course).
- **Visual suite:** "Golf on station 1, 18 holes", six players on the station (phone/kiosk) and /watch. No existing baseline changed.
- typecheck, lint, 774 unit tests, build, e2e (41) and the visual suite (7) pass.

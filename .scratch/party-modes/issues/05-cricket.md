# Party modes: Cricket

Status: done
Type: task
Blocked by: 01

See the spec's decisions.

## What to do

- Engine:
  - **Variant:** standard or cut-throat. Targets are 15–20 and the bull.
  - **Marks:** single 1, double 2, treble 3; outer bull 1, bull 2. Three marks close a number.
  - **Scoring:** marks past three on a number you've closed score its value while at least one opponent hasn't closed it. In standard you score the points. In cut-throat the points go to every opponent who hasn't closed it. Marks within one dart split: a treble on 2 marks closes the number and scores one hit.
  - **Win:** you've closed everything and you have the most points (fewest in cut-throat), with ties counting for you. You win on the spot.
  - **Cap of 20 rounds,** then: points, then the most marks, then sudden death at the bull (one visit each, the most bull marks wins, repeated while level).
- The variant option in the mode picker.
- Scoreboard: the classic grid (targets by players, marks as /, X, ⊗), points, the round of 20, and the variant. The target board highlights the numbers the current player hasn't closed, plus those they can still score on.

## Acceptance

- Engine tests: marks, a dart that splits between closing and scoring, no scoring once everyone's closed, cut-throat points going to the right opponents, a win on the spot (and none while behind on points), and the cap with each tie-break level.
- Checked in the simulator with 2 and 8 players, in both variants, on the station and /watch at 390 px.
- All checks pass.

## Comments

2026-11-06: Done.
- **Correction to the ticket:** a treble on 2 marks closes the number with one mark and **scores two**, not one (2 + 3 = 5, two past closing). That's what's built and tested.
- **Engine** (`cricket.ts`): marks per target (single 1, double 2, treble 3; outer bull 1, bull 2), and darts outside 15–20 and the bull count for nothing. The marks past three score while any opponent still has the number open: to the thrower in standard, to every open opponent in cut-throat. You win on the spot with everything closed and the most points (fewest in cut-throat), ties counting for you. After 20 rounds: the most points (fewest in cut-throat), then the most marks (capped at three per target). Players still level play sudden death at the bull, one visit each, most bull marks wins, repeated while level.
- **Rounds:** `playRounds` takes an optional `winner()`, so a mode can end mid-round. Cricket uses the 20-round cap and sudden death from there.
- **Setup:** Points, "Standard: most wins" or "Cut-throat: fewest wins", in the Game picker. The server refuses other variants.
- **Screens:** the panel beside the board is the classic grid (`CricketGrid`): targets down, players across, marks drawn as /, X and ⊗ (green once closed), points at the bottom, the thrower's column in accent, and numbers everyone has closed dimmed. The target board lights every number still open to someone, and only the bull in sudden death. The strip reads "Cricket · Round 2 of 20" or "… · Sudden death at the bull", with the variant named in cut-throat. The visit panel shows "Marks". The game shot shows the winner's points, and /display shows each player's points.
- **Calls and lights:** the match shot only.
- **Tests:** engine (`cricket.test.ts`: marks, non-targets, scoring, split darts, no scoring once all have closed, cut-throat, winning on the spot, no win while behind, the cap with each tie-break, sudden death at the bull, a correction), and the server (setup in cut-throat, a refused variant).
- **Visual suite:** "Cricket on station 1", three players on the station (phone, kiosk) and /watch (1080p, 720p, kiosk). The projector grid got compacter rows to fit beside the board.
- typecheck, lint, 806 unit tests, build, e2e (41) and the visual suite (9) pass.

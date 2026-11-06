# Party modes: Cricket

Status: ready-for-agent
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

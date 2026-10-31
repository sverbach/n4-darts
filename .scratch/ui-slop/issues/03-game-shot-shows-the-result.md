# Game shot shows the result

Status: done
Type: task
Blocked by: 02

Game shot is when the whole room looks up, but it shows only "GAME SHOT", the winner's avatar and "ANN WINS". The avatar's initials beside the name say the name twice, the rules strip stays, and the result is missing: a 1–0 and a 3–2 look the same (`station-game-shot-*`, `watch-game-shot-*`). Decided with the user: show the result.

## What to do

- On the station's and watch's game-shot screen (and the match-over view in `components/MatchOver.tsx`):
  - the final legs score (e.g. "3 – 2"), large;
  - the checkout that won it (e.g. "D20 · 40 OUT");
  - the winner's match 3-dart average.
- The rules strip is hidden on game shot (or shows the result instead of the rules).
- The winner's name appears once (the avatar in its brackets plus one name line).
- Values come from the match state the page already has; if the average isn't there, add it to the view the server pushes rather than computing it twice.

## Acceptance

- After a checkout, station and watch show legs score, checkout and the winner's average; nothing else repeats.
- Engine/server test for the values on a finished match (incl. a 1-leg and a multi-leg match).
- `docs/ui-pages.md` (station, watch) updated.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

2026-10-31: Built. Engine: `stateDartStats(state)` (what `dartStats` now uses) and `winningCheckout(state)`, with tests; the UI computes the average from the state it has, through the same function, so nothing is counted twice and the server view didn't change. Game shot shows the checkout ("41", "Checkout · D20") and the winner's 3-dart average; the legs score (winner's first, no names) when legs > 1, "n legs" with more than two players. The strip is hidden on game shot (station), the rules line on watch.

# More party modes: Random Checkout

Status: done
Type: task

See the spec's decisions.

## What to do

- Engine (`randomCheckout.ts`, on `playRounds` like the other modes):
  - **Options:** difficulty (Beginner 2–40 single out, Medium 41–100, Hard 101–170, Mixed 2–170, the last three double out; default Beginner) and rounds (1–20, default 10).
  - **The draw:** one number per round, shared by everyone, from the difficulty's range, only numbers `checkoutRoute(n, 3, outRule)` can finish. Stored in the event log, so a replay (and a correction) gives the same numbers. Sudden-death rounds draw too.
  - **A visit:** X01 from the round's number under the difficulty's out rule. It finishes (a point) or fails (a bust, or three darts without finishing). It ends on the finishing or busting dart.
  - **Win:** the most points after N rounds. The tied leaders play on, one shared number per round, until one is ahead after a round.
- Setup: difficulty and rounds in the Game picker. The server refuses other difficulties and rounds outside 1–20.
- Screens: the number big with the checkout hint (the existing hint component, under the difficulty's out rule, after each dart), "Random Checkout · Round 3 of 10" with the difficulty, points per player, and ✓/✗ for this round. The target board highlights the hint's next dart.
- Calls and lights: the match shot only.

## Acceptance

- Engine tests: only finishable numbers are drawn at each difficulty (no 169 with a double out), a single-out finish in Beginner and a refused one in Medium, a bust ends the visit, an early takeout fails it, points and the win after N rounds, sudden death with a fresh number, and a correction replaying the same draws.
- Checked in the simulator with 2 and 8 players, Beginner and Hard, on the station and /watch at 390 px.
- All checks pass.

## Comments

2026-11-07: Done.
- **Engine** (`randomCheckout.ts`): the station draws the numbers when the match starts and stores them on `MatchStarted.checkouts`: one per round plus 20 for sudden death (`SUDDEN_DEATH_DRAWS`), and sudden death starts the draw over if it runs past those. Each difficulty's pool is shuffled before a number repeats. A visit is X01 from the round's number under the difficulty's out rule (`isBust` is now exported from `x01.ts` for this); it ends on the finishing or busting dart, and a checkout is a point. Visits set `bust` and `checkout` like X01's. The state has the round's `target`, the thrower's `remaining`, and per player `points` and `results` per round (✓, ✗ or not yet).
- **Setup:** Difficulty ("Beginner: 2–40, single out", "Medium: 41–100", "Hard: 101–170", "Mixed: 2–170") and Rounds (1–20, default 10) in the Game picker. The server refuses other difficulties and rounds outside 1–20.
- **Screens:** beside the board on the station, a checkout panel (what the thrower has left, "Check out · from 87" once they've thrown, and the route), and the player list with points and "✓ Checked out" / "✗ Missed" for this round. On /watch the panel sits above the board, so the players keep the whole column. The target board lights the route's next dart. The strip reads "Random Checkout · Beginner · Round 3 of 10" or "… · Sudden death". The game shot shows the winner's points, and /display shows each player's points.
- **Calls and lights:** the match shot only (Random Checkout isn't a `scoresPoints` mode, so checkouts and busts within it don't call or light).
- **Tests:** engine (`randomCheckout.test.ts`: the pools, no 169 with a double out, no repeats before a pool runs out, refused draws, single out in Beginner and a refused single finish in Medium, the visit ending on a finish or bust, what's left mid-visit, early takeouts, the win after N rounds, sudden death on fresh numbers, the draw starting over, a correction), and the server (the draw at the start, a refused difficulty, too many rounds).
- **Visual suite:** "Random Checkout on station 1", three players, the drawn number masked. The baselines still need taking on the Mac (`pnpm --filter @n4/e2e visual --update-snapshots -g "Random Checkout"`); checked here on Windows screenshots at phone, kiosk, 1080p and 720p, and with six players.
- **Not fixed here:** on /watch, five or more players overflow the player list beside the board, in every party mode with a plain list (Around the Clock, Killer, Random Checkout).
- typecheck, lint, the unit tests (832 of 833: `diagnostics.test.ts` "sees a blocked event loop" fails on this Windows machine with or without these changes), build and e2e (43) pass.

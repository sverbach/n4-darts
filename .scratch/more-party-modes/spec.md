# More party modes: Random Checkout and Bermuda

Status: ready-for-agent

Two more party modes next to the five we have. Everything under "For every party mode" in `.scratch/party-modes/spec.md` applies to them as well: never in tournaments or stats, 2–8 players, persisted with their own rules version, shown only while live, corrections like in X01, a scoreboard and target board per mode, the match shot and confetti for the winner. The one exception is that Random Checkout shows a checkout hint.

## Decisions (2026-11-07)

### Random Checkout

Everyone tries to check out from a number the system draws. It's practice for finishing, dressed up as a game.

- **A shared number per round.** At the start of each round the system draws one checkout, and every player gets one visit at it. The draws are stored in the event log (like the Killer numbers), so a replay gives the same numbers.
- **One visit to finish it:** X01 rules from that number for three darts. A bust, or three darts without finishing, means the attempt failed. The visit ends as soon as it finishes or busts.
- **Difficulty** (organiser's choice, default Beginner) sets the range the numbers are drawn from and the out rule. Only numbers that can be finished in three darts under that out rule are drawn (with a double out, never 159, 162, 163, 165, 166, 168 or 169):
  - **Beginner:** 2–40, **single out** (any finishing dart counts)
  - **Medium:** 41–100, double out
  - **Hard:** 101–170, double out
  - **Mixed:** 2–170, double out
- **One point for each checkout.** After **N rounds** (organiser's choice, 1–20, default 10) the most points win. Ties go to sudden death: the tied leaders get a new shared number each round until one is ahead after a round.
- **The checkout hint is always shown,** at every difficulty. It's the existing route (`checkoutRoute`) under that difficulty's out rule, updated after each dart like in X01.
- **Calls and lights:** the match shot only. A checkout in a round has no call and no light.
- **Scoreboard:** the number big, with the hint, the round of N, the difficulty, points per player, and who has checked out this round (✓) or missed it (✗). The target board highlights the hint's next dart.

### Bermuda

Also called Bermuda Triangle. Thirteen rounds, each with a target, and a visit that misses halves your score.

- **Targets:** 12, 13, 14, any double, 15, 16, 17, any treble, 18, 19, 20, the outer bull, the bull.
- **Order** (organiser's choice): **classic** (the order above, the default) or **shuffled** (all 13 in a random order, drawn at the start and stored in the event log like the random Golf course).
- **Scoring:** every dart that hits the round's target scores its full value (a treble 12 is 36, a double 7 in the doubles round is 14). In the outer-bull round, a 25 or a 50 counts. In the bull round, only a 50 counts.
- **A visit with no hits halves your score,** rounded down. Taking the darts out early still counts as the visit, so a visit with no darts halves too.
- Everyone starts at 0. After round 13 the highest score wins. A tie goes to sudden death at the bull: the tied leaders get one visit each, the highest score (25s and 50s) wins, repeated while level.
- **Calls and lights:** the match shot only.
- **Scoreboard:** the round's target big, the 13 targets in order (done, current, to come), the score per player, and a mark on anyone halved this round. The target board highlights the round's target (every double, every treble, or the bull area in those rounds).

## Out of scope

- Points weighted by the checkout's value, a number per player, and racing for a shared number.
- An out rule switch separate from the difficulty.
- A start score for Bermuda.
- Calls or lights for a checkout within Random Checkout, a halving in Bermuda, or any new light events and recordings.

## Tickets

1. `01-random-checkout.md`
2. `02-bermuda.md`
3. `03-docs.md`: ADR 0012 addendum, glossary, UI-page docs
4. `04-real-board-check.md`: play both modes on a real board (human)

# Checkout hints on the station

Status: done
Type: task

When the player at the board can finish this visit, the station shows which field(s) to aim for next, e.g. `T20 · T10 · D20` at 130. Only in the desktop layout, which is the kiosk laptop next to the board. Phones don't get it.

## Decisions

- **Where.** `/station/n` at the desktop width (≥ 760 px, the existing breakpoint), next to the remaining score of the player at the board. Hidden below 760 px.
- **When.** Only while the visit is being thrown and the remaining score can be finished with the darts left in this visit, following the match's out rule. After each dart it updates for the new score and the darts left, e.g. 3 darts at 100, then 2 darts at 60 after a T20 is hit, then 1 dart at 40. Nothing is shown when it can't be finished this visit, after a bust, while waiting for takeout, or while a double-in player isn't in yet.
- **Out rules.**
  - **Straight:** any field can finish.
  - **Double:** the last dart has to be a double or the bullseye (50). Max 170.
  - **Master:** the last dart has to be a double, a treble or the bullseye. Max 180.
- **What "optimal" means.** One route per score, picked like this:
  1. Fewest darts.
  2. A good last field: D20, D16, D8, D18, D12, D10, D4, D2 and the other doubles, with the bullseye last.
  3. Setup darts on big singles rather than trebles where both work (e.g. 60 is `S20 · D20`, not `T20` then nothing), and no bull as a setup dart if it can be avoided.
  4. Common checkout tables are the reference. Scores where these rules give a different route than the tables are listed in the tests.
- **Where the logic lives.** A pure function in `packages/engine`, e.g. `checkoutRoute(remaining, dartsLeft, outRule)`, which returns the route or nothing. The web package imports it. Only the client uses it. The server doesn't send hints.
- **Display.** The route in a small line under the score, with the next field in a stronger colour. The design system's existing label and tile styles, no new components.

## Out of scope

- Hints on `/watch` and `/display`.
- Setup hints when no checkout is possible this visit, e.g. what to leave at 250.
- Routes that change depending on the player's favourite doubles.

## Acceptance

- Engine tests: every score from 2 to 170 for double out, and spot checks for straight and master out, with 1, 2 and 3 darts left; the impossible double-out finishes (169, 168, 166, 165, 163, 162, 159) give nothing.
- Checked in the browser against the simulator at 1440 px (the hint updates dart by dart) and at 390 px (no hint).

## Comments

2026-10-24: Proposal confirmed by the user as written.

2026-10-26: Built. `checkoutRoute()` in `packages/engine/src/checkout.ts`, shown in the station's player cards at ≥ 760 px.
- One addition to the rules: after fewest darts, setting up on a **double** is avoided like setting up on the bull. Without it the strict order gave e.g. 62 → `D11 D20` and 80 → `D20 D20`; with it they're `T10 D16` and `T16 D16`, as in the tables.
- Routes that still differ from the common tables are listed in `checkout.test.ts` (101 → `T17 Bull`, 99 → `T19 S2 D20`, 65 → `25 D20`, 61 → `T7 D20`, 123 → `T20 T9 D18`).
- Checked against the simulator at 1440 px (161: `T20 · T17 · Bull` → after T20 `T17 · Bull` → after S1 nothing; 80: `T16 · D16` → `S20 · D20` → `D20`; nothing for the other player or after the third dart) and at 390 px (hidden). The hint row is reserved on every card, so the scores stay level.

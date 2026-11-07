# Party modes

Status: ready-for-agent

Besides X01, a match can be played in one of five party modes: Around the Clock, Golf, High Score, Killer and Cricket. They're for fun on the evening: never in tournaments, and never in any stats.

## Decisions (2026-11-05)

### For every party mode

- **Never in tournaments.** Tournaments stay X01, so seeds, ratings and awards are untouched.
- **Started wherever an X01 match is started:** the new-match form in /admin and the quick match at the station. A mode picker comes first and shows only that mode's options.
- **One game per match.** No legs and no "first to N".
- **2–8 players** in every mode. They throw in the order they were picked, and nothing rotates.
- **A round** is one visit by each player in turn. A mode that ends "on the spot" ends after the winning dart, without finishing the round.
- **Persisted, never counted.** A party match uses the same `matches`, `match_players` and `match_events` tables as X01, with its mode and options in `settings`. That way it survives a server restart, and corrections replay like in X01 (ADR 0002). Old rows without a mode are X01. Each mode has its own rules version.
- **Shown only while live:** the station, /watch, /display and the live admin view. Once it's finished, a party match doesn't appear anywhere: not in stats, the leaderboard, ratings, profiles (results, recent matches, heatmap), match history, the admin match list or the public site.
- **Corrections, added darts and undoing a visit** work as in X01, at the station and in the live admin view.
- **There's no bust, in/out rule or checkout hint.**
- **Calls:** "Game shot, and the match" (`matchshot`) for the winner in every mode. Only High Score calls visit scores (as in X01, including 180). No other mode has score calls, and "No score" never plays.
- **Lights:** "match start" and "game shot" (the win) fire in every mode, and "180" fires in High Score. "Leg won", "bust" and "high out" never fire. There are no new light events.
- **Confetti** on the winner, as on an X01 game shot.
- **Scoreboard per mode** on the station, /watch and /display, plus a **target board**: the dartboard drawing from the profile heatmap, highlighting what the current player should hit. Where there is a target board it's the main element, and the players are a compact list beside it (below it on phones) (2026-11-06).
- **Ties in Golf and High Score** go to sudden death. Only the tied leaders play on, one extra visit (or hole) each, until one is ahead after a round.

### Around the Clock

- Targets 1, 2, … 20, then the bull. Any single, double or treble of the current target counts and moves you on **one** target. A visit can move on several times, one per dart.
- Either bull (25 or 50) finishes.
- **The first player to hit their last target wins on the spot.**

### Golf

- **9 or 18 holes** (organiser's choice, default 9). Hole N's target is N.
- Every dart at the hole's number scores: treble 1, double 2, single 3. Anything else is 5.
- **The best dart of the visit counts.** Taking the darts out early keeps the best dart so far, and a visit with no darts scores 5.
- The lowest total wins. Ties go to sudden death on the next holes: after 9 that's 10, 11, …; after 18 it's 19, 20, then the bull (bull 1, outer bull 2, anything else 5), then 1, 2, …

### High Score

- **N rounds** (organiser's choice, 1–20, default 7). A visit scores the plain sum of its darts, with the bull as 25/50.
- The highest total wins. A tie goes to sudden death, one visit each.

### Killer

- **Every player gets a distinct random number** (1–20) when the match starts, shown big on the scoreboard. The draw is stored in the event log, so a replay gives the same numbers.
- **Lives** (organiser's choice, default 3).
- **Charging:** hitting your own number adds marks (single 1, double 2, treble 3). At 3 marks you're a **killer**. Extra marks are dropped, and nobody can take charge away.
- **As a killer,** each double of another player's number takes one of their lives. Singles and trebles do nothing, and doubles do nothing before you're a killer.
- **A killer who hits their own double loses a life.**
- At 0 lives a player is out. Their number shows as out, and darts at it do nothing. **The last player with lives wins on the spot.**

### Cricket

- **Standard or cut-throat** (organiser's choice). Targets are 15–20 and the bull.
- **Marks:** single 1, double 2, treble 3; outer bull 1, bull 2. Three marks close a number.
- **Scoring:** marks past three on a number you've closed score its value while at least one opponent hasn't closed it. In standard you score the points. In cut-throat the points go to every opponent who hasn't closed it.
- **Win:** you've closed everything and you have the most points (fewest in cut-throat), with ties counting for you. You win on the spot.
- **Cap of 20 rounds.** After that the most points wins (fewest in cut-throat), then the most marks. If players are still level, they play sudden death at the bull: one visit each, and the most bull marks wins.

## Out of scope

- Party modes in tournaments, and any stats for them, even in their own section.
- Variants we didn't pick: last-dart Golf, no-score Cricket, Killer with numbers thrown by hand, treble kills.
- New light events (such as Killer "life lost") and new voice recordings.
- Players starting party games outside the existing match-creation paths.

## Tickets

1. `01-mode-foundation-around-the-clock.md`: modes in settings and the engine, kept out of every list and stat, the mode picker, the target board, and Around the Clock end to end
2. `02-high-score.md`
3. `03-golf.md`
4. `04-killer.md`
5. `05-cricket.md`
6. `06-docs.md`: ADR 0012, glossary, architecture and UI-page docs
7. `07-real-board-check.md`: play every mode on a real board (human)
8. `08-around-the-clock-skip-ahead.md`: skip-ahead as an option (added 2026-11-06)
9. `09-golf-random-course.md`: random holes, the default (added 2026-11-07)

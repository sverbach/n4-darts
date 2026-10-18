# Tournaments and the scheduler

Status: ready-for-agent

## Goal

The organiser runs a whole evening as one tournament. They pick the players and the format in `/admin`, check the groups and seeds, and press start. From then on the server generates the matches, puts each one on a free station as soon as both players are free, builds the knockout when the groups are done, and moves winners on until there's a champion. The organiser only steps in to fix things: swap or pin a match, pause a station, correct a result, handle a player who leaves.

This is build step 4 from `docs/architecture.md`. The `/display` projector view and long-term stats come in the next spec.

Read first: `docs/architecture.md` (especially "Decisions so far"), `docs/adr/`, `GLOSSARY.md`, `.scratch/players-and-matches/` (what exists now).

## Already there

- Players in SQLite, `/admin` behind a PIN, stations configured in `/admin`.
- Matches reference players, run at a station (set up, lineup, start, play, done), with a full event log, corrections and a stored winner that follows the log.
- `Station.assign()` puts a match on a free station; there's no queue.
- The engine plays X01 for 2–8 players; tournament matches use 2.

## Already decided (docs/architecture.md)

- **Shape**: always a group phase, then single or double elimination (default double).
- **Groups**: default one group, everyone plays everyone once. More groups are snake-seeded by rating. Win = 2 points. Ties: leg difference, head-to-head, then 3-dart average. With one group everyone advances by default; otherwise top N per group (configurable).
- **Knockout seeding**: group winners spread across the bracket, runners-up crossed (A1 vs B2), byes to the top seeds.
- **Double elimination**: grand final with bracket reset by default, configurable.
- **Legs per phase**: groups, winners bracket, losers bracket and final each have their own best-of. Group default: best of 1.
- **Scheduling**: a free station gets the next match whose players are both free, longest-rested first. The knockout starts when the group phase is complete. The organiser can override: swap, pin a match to a station, pause a station.
- **Rating / seeding**: 3-dart average over the last 10 matches; new players unseeded; the organiser can override.
- **Duration estimate** when creating a tournament: player count × legs per phase × average leg length, learned from history.
- **Withdrawals**: unplayed matches become walkovers (2 points, N–0 legs), played results stand, walkovers don't count for long-term stats. The roster can change freely until the first match is played.
- **Throwing order**: players settle it at the station (the lineup from the last spec).

## In scope (draft)

- **One active tournament at a time** (one evening); finished ones stay in history. Quick matches and `/admin` single matches still work alongside.
- **Tournament** in SQLite: name, players, format (groups, advancing, single/double elimination, bracket reset), legs per phase, X01 settings (start score, in/out). Tournament matches are ordinary matches linked to their tournament and their slot in it.
- **Creating a tournament** in `/admin`, on one page: name (defaults to today's date), players, format (number of groups, advancing per group, single/double elimination, bracket reset), legs per phase, start score and in/out rules. Below it a live preview: the seed list (↑/↓ to override), the resulting groups, the duration estimate. Saving makes a draft; "Start tournament" starts the scheduler. Until the first match is played, players and format can still change and the fixtures are regenerated; after that only withdrawals.
- **Group phase**: round-robin fixtures, live tables. At least 3 players per group. Ties: points, leg difference, head-to-head (a mini table of the tied players' mutual matches: points, then leg difference, applied again to whoever is still level), 3-dart average in this tournament's group matches, then the higher seed.
- **Knockout**: generated when the groups are done. Bracket size is the next power of two at or above the number advancing; the missing slots are byes for the top seeds. Seeds: all group winners (by points, leg difference, average), then all runners-up, and so on, in the usual positions (1 v 8, 4 v 5, …), swapped within a rank so players from the same group avoid each other in the first round where possible; with one group, seeds are the final positions. Double elimination: losers of the first winners round meet each other, later losers drop in placed to avoid rematches, the losers-bracket winner meets the winners-bracket winner in the grand final, plus one deciding match if bracket reset is on and the losers-bracket player wins. Legs: winners bracket "winners", losers bracket "losers", grand final and reset "final" (single elimination: the final). No third-place match.
- **Scheduler**: puts ready matches on free stations by the rules above, reacting whenever a station frees up, a match finishes, or the organiser changes something.
  - A finished tournament match frees its station when someone presses **Done**, or automatically 60 s after the checkout (until then the checkout can be undone at the station; afterwards it's a correction in `/admin`). Its players' rest starts when the match closes; "longest-rested first" picks the ready match whose less-rested player has waited longest.
  - Quick matches and `/admin` single matches may use a free station during the tournament; the scheduler treats that station and those players as busy. To keep a board for casual play, pause it.
  - Overrides in `/admin`: **pause** a station (no new matches; the current one carries on), **pin** a match to a station (it waits for that one), **hold** a match (skipped until released, e.g. a player is away), **send back** a match that's on a station but not started (back to the queue), **play now** (a chosen ready match onto a chosen free station, out of order).
- **Withdrawals and late arrivals**: a withdrawn player loses every remaining match by walkover (groups: 2 points, N–0 legs; knockout: each future match once the opponent is known, so in double elimination they also lose in the losers bracket); a match running at that moment is abandoned and becomes a walkover; played results stand. A late player can join while the group phase runs: they go into the smallest group and their matches against it are queued. No late arrivals once the knockout has started.
- **Result changes**: a correction in `/admin` to a finished tournament match must leave a winner, otherwise it's refused. Group tables recompute live; if the knockout exists and a correction changes who advances or the seeding, the knockout is rebuilt while no knockout match has started (matches waiting on a station are sent back), otherwise the correction is refused, naming the match in the way. In the knockout, a changed winner updates the next match (and the losers-bracket one) if it hasn't started, otherwise it's refused the same way. A correction that keeps the winner is always fine.
- **Rating** for seeding: 3-dart average (points ÷ darts × 3; busts count their darts for zero points, darts thrown after the visit was over don't count) over the player's last 10 completed matches of any kind, including quick and 3–8 player matches; abandoned matches and walkovers don't count. Fewer than 10 is fine; one completed match makes a player seeded. Unseeded players go below the seeded ones in a random order, drawn at creation, shown in the preview and changeable.
- **Tournament tab in `/admin`**: header (name, phase, matches played of total, expected finish), stations with a pause toggle, the queue with hold / pin / play now / send back, group tables (played, won, lost, legs for/against, difference, points, average) and fixtures with results, the bracket in columns per round (winners and losers), actions (withdraw a player, add a late player, end the tournament early). At the end: the champion and final placings (1, 2, 3, 4, then shared 5–6, 7–8, … by the round a player went out).
- **Station**: a tournament match in the lineup is labelled ("Group A · match 4", "Winners semi-final"). A free station shows the quick-match form with "No tournament match ready (waiting for players)" above it during a tournament; a paused one says it's paused for the tournament.
- **Duration estimate**: leg length defaults per start score (301 → 4 min, 501 → 6, 701 → 8), replaced by the real average once there are 5 recorded legs at that start score (from event timestamps). Per match: about 75% of the maximum legs × leg length + 1 min changeover; summed and divided by the number of stations; double elimination counted with the bracket reset. Shown as "about 2 h 30" when creating and as an expected end time during the evening, updated as matches finish.

## Out of scope

`/display` (projector), long-term stats pages and player profiles, design system styling, several tournaments at once, bull-off, sound caller.

## Done when

- The organiser creates a tournament for 7 players on a phone, with one group and double elimination, adjusts a seed, sees the duration estimate, and starts it; matches appear on both stations by themselves and can be played on the real boards.
- When the group phase is complete the knockout appears with the right seeds and byes, and the evening runs to a champion and final placings without the organiser assigning anything.
- Pause, pin, hold, send back and play now behave as described; a withdrawal turns the player's remaining matches into walkovers; a late player can join during the group phase.
- A correction that would change an already-used knockout result is refused with the blocking match named; one before that rebuilds what depends on it.
- All of the above is covered by automated tests: pure tests for groups, tie-breaks, brackets and the scheduler's choices, and integration tests against the simulator for a whole small tournament.

## Open questions

None open. Answers were folded into the sections above.

**Setup and seeding**
1. ~~One tournament at a time~~: yes; history kept; single matches alongside. (Round 1)
2. ~~Rating~~: last 10 completed matches of any kind, no abandoned or walkovers; unseeded go last in a random, changeable order. (Round 1)
3. ~~Creating~~: one page with live preview, draft, start; editable until the first match is played. (Round 1)

**Scheduler and stations**
4. ~~Freeing the station~~: on Done, or 60 s after the checkout. (Round 2)
5. ~~Single matches alongside~~: allowed on free stations; pause a station to keep it free. (Round 2)
6. ~~Overrides~~: pause, pin, hold, send back, play now. (Round 2)

**Brackets**
7. ~~Ties~~: mini table of mutual matches, tournament group average, then higher seed. (Round 3)
8. ~~Bracket layout~~: next power of two, byes to top seeds, winners then runners-up, crossed; standard double elimination. (Round 3)

**Changes during the evening**
9. ~~Result changes~~: must keep a winner; rebuild/update dependants while they haven't started, otherwise refuse and name the blocker. (Round 4)
10. ~~Withdrawals and late arrivals~~: walkovers for every remaining match; late joins only during the group phase. (Round 4)

**Views**
11. ~~Views~~: Tournament tab in `/admin`; station labels and a status line. (Round 5)
12. ~~Duration estimate~~: defaults per start score until 5 real legs exist; 75% of max legs + changeover; per station. (Round 5)

## Tickets

`issues/01`–`10`.

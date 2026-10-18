# Scheduler: a tournament plays itself

Status: done
Type: task
Blocked by: 04

- Queue: tournament matches whose players are both free (not in any open match, not withdrawn), not held, in phase order; within that, longest-rested first (the ready match whose less-rested player has waited longest since their last match closed).
- Whenever a station frees up, a match finishes, or anything changes: put the head of the queue on each free, unpaused station (`Station.assign`, settings from the tournament and the phase). Quick and `/admin` single matches may occupy free stations; their players count as busy.
- A won tournament match closes on Done, or automatically 60 s after the checkout (an undo within that time cancels it).
- When the last group match is closed: build the knockout (ticket 03) and continue. When the final (or reset) is won: tournament finished, placings stored, scheduler stops.
- Station: a tournament match is labelled in the lineup ("Group A · match 4", "Winners semi-final"); a free station shows "No tournament match ready (waiting for players)" above the quick-match form during a tournament.
- Restart-safe: the queue is derived from the database, never only in memory.

## Acceptance

- Integration test against two simulators: a 4-player tournament (one group, single elimination, best of 1, 101) played to a champion with nobody assigning anything; the server restarts once in the middle and carries on.
- Unit tests for queue order and rest times.

## Comments

**2026-10-18, done.** `tournaments.sync()` makes the database follow the plan: creates the matches that can be played (no station = queued, settings from the phase's legs, label from the plan), walkovers right away when a withdrawn player is in one, deletes queued matches the plan no longer wants (dropping them from a station if they're waiting there), loops until stable, and finishes the tournament with placings once there's a champion. `scheduler.ts`: on every run (station changes, tournament changes, and a 2 s tick) it syncs, then gives each free, unpaused station the first ready match (pinned to it first, then plan order, then longest-rested: the later of the two players' last close), sets station notices ("Paused for the tournament", "No tournament match ready (waiting for players)"), and closes a won tournament match 60 s after the checkout unless it's undone. Stations got `take`, `release`, `drop` and `setNotice`; `MatchView.label`, `StationView.notice`. Abandoning a started tournament match closes it as abandoned and the slot is queued again; a not-started one goes back to the queue. The scheduler is opt-in in `buildApp` (main turns it on). Players and format stay editable after the start until the first match is played (fixtures regenerate).
- Tests: scheduler unit tests on fake boards (distinct players, notices, next match on free-up, rest order, knockout to a champion, pause/hold/pin, auto-Done and undo), and `tournament.e2e.test.ts`: 4 players on two simulated boards to a champion through a server restart.
- Station page: tournament label above the lineup; notice above the quick-match form; no Cancel on a tournament lineup (it would only come back), and "End match" explains the match will be played again.

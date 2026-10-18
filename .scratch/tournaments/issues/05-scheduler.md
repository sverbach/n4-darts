# Scheduler: a tournament plays itself

Status: ready-for-agent
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

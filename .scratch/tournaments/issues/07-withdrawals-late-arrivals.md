# Withdrawals and late arrivals

Status: ready-for-agent
Type: task
Blocked by: 05

- Withdraw a player (Tournament tab, confirm): every remaining match becomes a walkover for the opponent (groups: 2 points, N–0 legs; knockout: as soon as the opponent is known, including the losers bracket); a match running at that moment is abandoned and turned into a walkover; played results stand. Walkovers are flagged so they don't count for ratings or averages.
- Add a late player while the group phase runs: into the smallest group, their fixtures against that group queued; refused once the knockout exists.

## Acceptance

- Tests: withdrawal in the group phase (table), in the winners bracket of double elimination (drops and loses again), during a running match; late arrival fixtures; refused in the knockout.

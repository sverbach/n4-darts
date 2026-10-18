# Withdrawals and late arrivals

Status: done
Type: task
Blocked by: 05

- Withdraw a player (Tournament tab, confirm): every remaining match becomes a walkover for the opponent (groups: 2 points, N–0 legs; knockout: as soon as the opponent is known, including the losers bracket); a match running at that moment is abandoned and turned into a walkover; played results stand. Walkovers are flagged so they don't count for ratings or averages.
- Add a late player while the group phase runs: into the smallest group, their fixtures against that group queued; refused once the knockout exists.

## Acceptance

- Tests: withdrawal in the group phase (table), in the winners bracket of double elimination (drops and loses again), during a running match; late arrival fixtures; refused in the knockout.

## Comments

**2026-10-18, done.** `POST /api/admin/tournament/withdraw` and `/late` (`{ playerId }`). Withdrawing marks the entrant; a match they're playing is abandoned, their other open matches are taken off stations / out of the queue, and `sync` recreates every one as a walkover (it already makes walkovers for withdrawn players, also for future knockout matches as soon as the opponent is known). Walkovers carry N–0 legs, count 2 points in groups, and count for neither group averages nor ratings. A late player joins the smallest group with the next seed; their fixtures are queued (group slots are keyed by the pair of players, so existing fixtures are untouched); refused once the knockout exists. Web: Players section on the running tournament (withdraw with confirm, "Late arrival…" picker during the group phase). Checked in a browser.

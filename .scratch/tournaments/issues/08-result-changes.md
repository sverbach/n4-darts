# Corrections that change tournament results

Status: done
Type: task
Blocked by: 05

Applies to `POST /api/admin/matches/:id/corrections` on tournament matches.

- Refused if the match would end up without a winner.
- Group match: tables recompute. If the knockout exists and the correction changes who advances or the seeding: rebuild the knockout while no knockout match has started (matches waiting on a station are sent back); otherwise refuse, naming the match in the way.
- Knockout match with a changed winner: update the next match (and the losers-bracket one) if they haven't started; otherwise refuse, naming them.
- A correction that keeps the winner is always accepted.

## Acceptance

- Tests for each case: accepted and rebuilt, accepted and updated, refused with the blocking match named, refused for leaving no winner.

## Comments

**2026-10-18, done.** `tournaments.correctionProblem(match, events)` runs before an admin correction is saved: for a finished, non-abandoned tournament match it refuses one that leaves no winner, refuses a winner change once the tournament is finished, and otherwise dry-runs the plan with the corrected result and refuses if any started or played match would get other players, naming it ("It would change Semi-final 1 (P1 vs P4), which has already started."). After the correction `tournaments.corrected()` syncs: queued or waiting knockout matches that no longer fit are replaced (sent back from stations), the knockout rebuilt. The match detail in `/admin` now shows the server's reason instead of "Correction failed". This also settles the "No winner (corrected)" case from players-and-matches ticket 06 for tournament matches.
- Tests write results straight into the database (no stations) so each case controls exactly what depends on what; the correction goes through the HTTP route.

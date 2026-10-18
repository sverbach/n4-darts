# Corrections that change tournament results

Status: ready-for-agent
Type: task
Blocked by: 05

Applies to `POST /api/admin/matches/:id/corrections` on tournament matches.

- Refused if the match would end up without a winner.
- Group match: tables recompute. If the knockout exists and the correction changes who advances or the seeding: rebuild the knockout while no knockout match has started (matches waiting on a station are sent back); otherwise refuse, naming the match in the way.
- Knockout match with a changed winner: update the next match (and the losers-bracket one) if they haven't started; otherwise refuse, naming them.
- A correction that keeps the winner is always accepted.

## Acceptance

- Tests for each case: accepted and rebuilt, accepted and updated, refused with the blocking match named, refused for leaving no winner.

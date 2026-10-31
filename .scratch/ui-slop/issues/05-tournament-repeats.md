# Progress, rounds, champion and awards said once

Status: ready-for-agent
Type: task

On `/display` and admin's tournament tab:

- "GROUP PHASE · 0 OF 6 MATCHES PLAYED" sits beside six progress squares that say the same (`features/display/DisplayPage.tsx:83`, `features/admin/tournament/TournamentRun.tsx:61`, `components/Progress.tsx`).
- Knockout: the column head "SEMI-FINAL" repeats as each card's header "SEMI-FINAL 1/2"; "FINAL" sits above a card headed "FINAL"; "SEMI-FINAL 2" shows in Up next and again in the bracket as "Queued".
- Up next labels every row "GROUP MATCH n", and the list reads 2, 4, 3, 5, 6 while station 1 shows match 1 as Next: looks like a bug to the room.
- Finished: the champion shows in the panel and again as "1 ANN" in the placings; admin marks rank three times (CHAMPION label, trophy, "1" badge; `TournamentRun.tsx:84-95`); a tie in the awards lists the same 4 names under three awards.

## What to do

- Progress: the squares plus the phase name ("GROUP PHASE"); the "n of m played" goes into the squares' accessible label only (it's already there).
- Bracket: the column head names the round; cards show only "1", "2" (or nothing for a final).
- Up next: no per-row "Group match" label in the group phase (the phase is in the header); find out why the order reads 2, 4, 3, 5, 6 next to "Next" on station 1. If it's the scheduler's real order and match 1 is already on a station, say so (e.g. station 1's match isn't in Up next because it's on a station). Fix the display, not the scheduler, unless it's a real bug.
- Finished: placings start below the champion (or the champion row is the panel); admin's champion card marks rank once.
- Awards: a tie of more than two shows "4 players" (names on the profile / in a smaller line), not a repeated list.

## Acceptance

- Each fact appears once on `/display` and admin tournament in every phase (`display-*`, `admin-tournament-*`).
- The Up-next order is explained in a Comment here and either correct or fixed.
- `docs/ui-pages.md` (display, admin tournament) updated.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

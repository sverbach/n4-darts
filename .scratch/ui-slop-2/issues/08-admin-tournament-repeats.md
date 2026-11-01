# The admin tournament page says each fact once

Status: ready-for-agent
Type: task

From critique run 3 (P1). On `/admin/tournament` while running: the station line names both players twice ("EVE VS FAY: EVE 101 · FAY 101", `TournamentRun.tsx` StationRow; the matches tab's station cards do the same); the Players list repeats the group table's rows; the collapsible "Matches (6)" repeats the queue.

## What to do

- Station lines: "EVE 101 · FAY 101" (names in Silkscreen capitals, scores in Geist Pixel); a match that hasn't started: "EVE VS FAY · waiting to start". Same on the matches tab.
- Players: Withdraw moves into the group table's rows (a ⋮ menu per row, as on the players tab); the late-arrival form stays, under the groups; the separate Players list goes. A withdrawn player is marked in the table.
- "Matches (n)" under each group shows played fixtures only, as "Results (n)" (the queue owns what's still to play).
- Decided here (the user can revisit in the final review): the page keeps the standings and the bracket rather than becoming a "decisions only" page.

## Acceptance

- No name, match or player appears twice on the running page except in the bracket's draw.
- Browser tests updated (withdraw from the row menu).

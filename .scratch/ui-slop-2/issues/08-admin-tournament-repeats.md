# The admin tournament page says each fact once

Status: done
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

2026-11-01: Built. Station lines name each player once ("EVE 101 · FAY 101"; "ANN VS DEE · waiting to start"; "ANN won"), names in Silkscreen and scores in Geist Pixel: the station view now carries `remaining` and `winner` beside its summary (`server/src/api.ts`, `tournamentView.ts`). The matches tab's station cards already named players once ("Ann 141 (1) · Bob 60 (0)"), so they stay. Withdraw is a ⋮ menu on each group-table row (a withdrawn player is struck through with "Out"); the separate Players list went; the late-arrival form sits under the Groups heading during the group phase. Each group's collapsible lists played fixtures only, as "Results (n)", and shows only once there are any. Stations and Queue now sit side by side (the Players column is gone). As decided in the ticket, the page keeps standings and bracket.

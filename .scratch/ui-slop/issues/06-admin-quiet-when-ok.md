# Admin is quiet when all is well

Status: done
Type: task

- "BOARD ONLINE" shows on the Tournament, Stations and Matches tabs for every station, so the organiser can't see which one needs attention (`components/BoardMenu.tsx:24`, `TournamentRun.tsx:313`, `MatchesAdmin.tsx:62`).
- Each queue card has HOLD, an "Any station" select and a "Play now on…" select, and "WAITING FOR PLAYERS" is repeated on four cards (`admin-tournament-groups-*`).
- Each player row has RENAME, ARCHIVE, DELETE and a "RATING" label (`admin-players-phone`).

## What to do

- Board status in admin: no pill while the board is online; the pill shows only for stopped / offline / server offline and for the board menu's action progress. The ⋮ board menu stays reachable. The station page itself keeps its pill (players need it).
- Queue: one station control per card (a select of "Any station" / station n, plus a Play now button when a station is free), and the cards grouped by status under one sub-heading each ("Waiting for players", "Ready").
- Player rows: actions behind a ⋮ menu like the board menu; "Rating" once as a column header, not per row.

## Acceptance

- With all boards online, no board pill on admin tabs; stopping a board shows its pill there.
- Queue cards have one station control; status shown once per group.
- Player actions work as before from the menu; browser tests updated.
- `docs/ui-pages.md` (admin) updated.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user. No bulk admin actions.

2026-10-31: Built. `BoardStatus` / `BoardMenu` take `quiet`: no pill while the board is online and detecting, used on Stations and Matches; the tournament's station rows show only Paused / Board offline. The station page keeps its pill. Queue grouped under Ready / Waiting for players / Held with counts (cards lost the status badge and the "Only X" badge, which the dropdown shows); one station dropdown plus a Play now button (kept-for station, else the first free one; disabled when none is free); on a phone the dropdown has its own line. Player rows: name, rating under one "Rating" heading, actions in a new `ActionMenu` (⋮), which shares its look with the board menu.

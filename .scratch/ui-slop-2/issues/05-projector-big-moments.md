# Game shot, champion and idle fill the projector

Status: ready-for-agent
Type: task

`watch-game-shot-1080p` is a small cluster in a black field (about 40 % empty above and below), with 16-mockup-px labels and no opponent or legs; `display-finished-1080p` leaves the bottom third empty and the award winners read "4 players"; `display-groups-1080p` ends its right column halfway; `display-no-tournament` leaves the bottom half empty. Table headers and labels on the projector are 13–16 mockup px, too small from the back of the room.

## What to do

- Projector labels at least 20 mockup px (table headers, "Checkout · D20", section headings).
- Game shot on /watch: the cluster scaled to fill the frame; the opponent and the legs ("Ann 3 – 1 Bob") under the winner.
- Finished and idle /display: rows and cards scale to fill the height (`Fit` with `grow` and a content-width inner, as the bracket does since ui-slop 12).
- Awards ties: a short tie stays "4 players", but show the names when there's room on the projector (ask the user if the list should come back).

## Acceptance

- None of the listed shots has an empty band over a quarter of the frame.
- No projector text under 20 mockup px except avatar initials.

## Comments

2026-11-01: Confirmed by the user ("go ahead with the ui-slop-2 tickets").

# New match and lineup don't restate themselves

Status: ready-for-agent
Type: task

- New match: the subtitle "Pick 2–8 players" restates the "0 / 8 PICKED" counter (`features/station/StationPage.tsx:138-140`, `components/PlayerPicker.tsx:45-46`).
- Lineup: the headline "ANN VS BOB" restates the list of players right below it (`StationPage.tsx:198-210`, `station-lineup-*`).

## What to do

- New match: keep the counter; the subtitle says something new, e.g. "You can change the order next." (or goes).
- Lineup: the headline says what to do ("Who throws first?" or similar, from the existing copy), the list names the players. With more than two players "A vs B vs C" goes too.

## Acceptance

- Neither screen says the same thing twice; copy follows `GLOSSARY.md`.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

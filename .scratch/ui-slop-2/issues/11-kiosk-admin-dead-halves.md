# Kiosk admin without dead halves

Status: ready-for-agent
Type: task
Blocked by: 08

From critique run 3 (P2): at 1440 the running tournament's right column is empty below the players, the bracket uses about half the width, a lone award card stretches full width under two half cards, the profile's Last matches sits at half width beside nothing.

## What to do

- Running tournament: Stations and Queue side by side (or the groups beside them), so neither column ends half-way; the bracket and group tables span the full width.
- Awards in admin: three equal cards on the kiosk.
- Profile: Last matches takes the full row when there's no tournaments list beside it.

## Acceptance

- No column on `admin-tournament-*-kiosk` or `profile-kiosk` ends more than a section short of its neighbour.

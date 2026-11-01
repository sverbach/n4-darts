# Kiosk admin without dead halves

Status: done
Type: task
Blocked by: 08

From critique run 3 (P2): at 1440 the running tournament's right column is empty below the players, the bracket uses about half the width, a lone award card stretches full width under two half cards, the profile's Last matches sits at half width beside nothing.

## What to do

- Running tournament: Stations and Queue side by side (or the groups beside them), so neither column ends half-way; the bracket and group tables span the full width.
- Awards in admin: three equal cards on the kiosk.
- Profile: Last matches takes the full row when there's no tournaments list beside it.

## Acceptance

- No column on `admin-tournament-*-kiosk` or `profile-kiosk` ends more than a section short of its neighbour.

2026-11-01: Built. The running tournament is a grid on the kiosk: Stations top left, Queue on the right spanning both rows, and under the stations the Groups during the group phase or the Knockout bracket after it (the group tables then sit full width at the foot). On a phone the order stays Stations, Queue, the rest. Bracket rounds grow to fill their row on the kiosk (at least 260 px each). Admin awards: three equal cards on the kiosk (two to a row with an odd last one full width on a phone). Profile: Last matches takes the full row when there's no tournaments list beside it. Left as is: in the knockout the Queue column is short simply because only a match or two is left to queue.

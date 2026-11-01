# Brackets and tables usable at 390 px

Status: needs-triage
Type: task

`admin-tournament-finished-phone` clips the bracket's final column ("AN…", "CID…") and the groups table loses AVG at the edge; `admin-tournament-groups-phone` cuts AVG. The scroll edges from ui-slop 10 are there but too faint to notice.

## What to do

- Bracket below the kiosk breakpoint: rounds stacked vertically (a round heading, its cards), no sideways scroll.
- Group tables on a phone: keep #, Player, P, W, L, Pts; Legs, +/− and Avg only from the kiosk width (or a visible "Swipe for more" like /players: pick one pattern for every wide table and use it everywhere).
- The scroll edge, where it stays, strong enough to see (check it on a real phone).

## Acceptance

- No clipped names or columns in any `admin-*-phone` shot.

# Brackets and tables usable at 390 px

Status: done
Type: task

`admin-tournament-finished-phone` clips the bracket's final column ("AN…", "CID…") and the groups table loses AVG at the edge; `admin-tournament-groups-phone` cuts AVG. The scroll edges from ui-slop 10 are there but too faint to notice.

## What to do

- Bracket below the kiosk breakpoint: rounds stacked vertically (a round heading, its cards), no sideways scroll.
- Group tables on a phone: keep #, Player, P, W, L, Pts; Legs, +/− and Avg only from the kiosk width (or a visible "Swipe for more" like /players: pick one pattern for every wide table and use it everywhere).
- The scroll edge, where it stays, strong enough to see (check it on a real phone).

## Acceptance

- No clipped names or columns in any `admin-*-phone` shot.

## Comments

2026-11-01: Confirmed by the user ("go ahead with the ui-slop-2 tickets").

2026-11-01: Built. One pattern for wide lists on phones: they don't scroll, they keep what matters. Admin's bracket rounds stack one under the other below the kiosk width (side by side and scrolling from there); admin's group tables keep #, Player, P, W, L and Pts on a phone (Legs, +/− and Avg from the kiosk width); /players keeps #, Player, Rating, M and HC on a phone, and its "Swipe table for more" hint went. The scroll edge (still on the admin tab strip and the kiosk-width bracket) is stronger: 24px at 40%. Diagnostics' tables keep scrolling (a technical page with long rows).

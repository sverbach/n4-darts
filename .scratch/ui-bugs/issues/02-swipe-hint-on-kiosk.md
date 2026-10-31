# "Swipe table for more" shows on wide screens

Status: done
Type: bug

The leaderboard (`features/stats/StatsPages.tsx`) shows "Swipe table for more" under the table at every width. It's meant for phones, where the table scrolls sideways; on the kiosk and wider the whole table fits and there's nothing to swipe. The old sheets let it through on wide screens, and the Tailwind migration kept it as is (with a comment in the markup).

## What to do

- Hide the hint from the `kiosk` breakpoint up (`kiosk:hidden`) and drop the comment that explains the bug.

## Acceptance

- The hint shows on a phone (390 px) and not on the kiosk (1440 px).
- The visual suite passes; only `players-kiosk` is retaken (and any other screenshot that shows the hint at kiosk width), listed in the comments.
- All checks pass (types, lint, tests, load test, browser tests, build).

## Comments

2026-10-31: Confirmed by the user.

2026-10-31: Fixed with `kiosk:hidden`. Retaken: `players-kiosk` only.

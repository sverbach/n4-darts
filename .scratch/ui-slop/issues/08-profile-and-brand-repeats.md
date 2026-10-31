# Profile, players and Home without repeats

Status: ready-for-agent
Type: task

`features/stats/StatsPages.tsx`, `features/home/HomePage.tsx` (`profile-*`, `players-*`, `home-*`):

- Profile: "1 MATCH" in the header, then "MATCHES WON 1 OF 1", "LEGS WON 1 OF 1"; Rating, 3-dart avg, first 9, the chart tooltip and the last match all read 60.6 (rating equals the average under 10 matches); the "CHECKOUTS" heading over a "HIGHEST / CHECKOUT" label; "TIMES" as sub-label three times under Scoring (`StatsPages.tsx:245-247`); the chart tooltip repeats the x-axis date.
- Brand: players and profile have "← N4-DARTS" plus the logo; Home has the logo hero plus an "N4-DARTS" footer and a "X01 · TOURNAMENTS" tagline.
- Station numbering: "01 STATION 1" on Home (`HomePage.tsx:28-30`), "1. STATION 1" in admin stations; the add-station placeholder says "Station 4" with two stations.

## What to do

- Profile: say a value once. While a player has fewer than 10 matches, the rating tile says "= 3-dart avg until 10 matches" (or is hidden); the header's match count stays, the tiles show what's new (won %); sub-labels only where they add something; tile labels don't repeat their section heading; tooltip shows the value only.
- Brand once per page: the back link reads "← Home" (or just the logo links home).
- Stations: name only ("STATION 1"), no number prefix; the placeholder suggests the next free number.

## Acceptance

- No value or label twice on profile, players and Home.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

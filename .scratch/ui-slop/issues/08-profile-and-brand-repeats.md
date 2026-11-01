# Profile, players and Home without repeats

Status: done
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

2026-11-01: Built. Profile: rank moved from a label above the name into the line below it ("Rank #1 · 1 match · since Nov 2026"; the label above the heading was the pattern the detector flagged); the 3-dart avg tile shows only from 11 matches on (before, it equals the rating, whose sub-label then reads "All matches"); Matches won's sub-label is the percentage only; Best placing went (it's in the tournaments list), so every group has three cards; Scoring's "Times" and Highest's "Checkout" sub-labels went; the chart's tag shows the value only (the date is on the axis) and the axis is in capitals. Also from 14 for this page: no accent tiles (the rating stays first, in Phosphor Paper), sub-labels in Readout Grey instead of Dead Pixel, Won/Lost in words in full colour and grey, the tournaments placing no longer violet. Stats header back link reads "← Home". Admin stations show the name only, and the add form's placeholder is the next free number. Home's footer (brand and tagline) went; "Display (projector)" is "Projector".

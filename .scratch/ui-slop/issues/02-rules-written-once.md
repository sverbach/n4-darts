# The match rules written once, one way

Status: ready-for-agent
Type: task

The rules appear as "101 · SINGLE OUT / FIRST TO 1 LEG" in the station's settings strip, again as "101, first to 1 leg." in the lineup subtitle (`features/station/StationPage.tsx:208-210`), and as "101 · FIRST TO 1 LEG" on watch, which drops the out rule (`station-lineup-kiosk`, `watch-visit-1080p`).

## What to do

- One formatter for a match's rules (start score, in rule if not straight, out rule, legs), used by the station strip, watch, `/display` station cards and admin wherever rules are shown. Same order and separators everywhere.
- The lineup subtitle loses the rules (the strip above already shows them); it keeps "Top of the list throws first."
- Watch shows the out rule.
- On game shot the strip gives way to the result (ticket 03).

## Acceptance

- Every screen that shows a match's rules uses the formatter; a unit test covers it (straight in / double out / master, 2 players "best of", more players "first to").
- No screen shows the rules twice.
- See `../spec.md` "For every ticket".

## Comments

2026-10-31: Confirmed by the user.

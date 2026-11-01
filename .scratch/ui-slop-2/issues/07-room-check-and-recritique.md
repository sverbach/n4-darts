# The real kiosk and projector, then a re-critique

Status: ready-for-agent
Type: task
Blocked by: 01, 02, 03, 04, 05, 06, 08, 09, 10, 11, 12

Carried over from ui-slop 16.

## What to do

- Check the station on the real kiosk laptop from 2–3 m, `/display` and `/watch` on the real projector from the back of the room, admin on a phone. Note what reads badly.
- Re-run `/impeccable critique` on `packages/web/src` and note the score (27/40 twice so far).

## Acceptance

- The room check is noted here (needs the user).
- The re-critique shows no P1 issues.

## Comments

2026-11-01: Confirmed by the user ("go ahead with the ui-slop-2 tickets").

2026-11-01: Re-critique (run 3, `.impeccable/critique/2026-11-01T10-10-03Z__packages-web-src.md`): 27/40 again, now with 2 P1s. One was a regression from 04 (the scroll edge showed where nothing scrolls, because its cover was narrower than the edge): fixed in the same session (the cover is solid over the edge's full 24px). Still open: the admin tournament page repeats facts (station line names twice, knockout matches in Stations, bracket and Queue, Players list beside the group table, Matches (6) beside the queue). P2s: the champion screen has no peak; one thing under several words or fonts ("FREE"/"Free"/badge, "HC"/"HIGH OUT"/"HIGHEST"); kiosk admin leaves dead halves. Detector: only false positives; browser: no off-scale spacing or overflow.

Not done: the room check (needs the user), and the acceptance "no P1 issues" (one left).

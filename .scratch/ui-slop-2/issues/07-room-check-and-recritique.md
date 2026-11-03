# The real kiosk and projector, then a re-critique

Status: done
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

2026-11-01: User's review: the projector looks good. Two findings, fixed:
- Home's "Free" pill sat under the station name like a box inside the tile and made the free tiles taller. Now the small pill (admin's size) sits on the right beside the arrow, where the board status goes, and a free tile is one line.
- The station's visit panel changed height at takeout and the first dart (a regression from 12, which removed the empty "Total" and with it the 48px number that set the header's height), and at a bust (the frame went from 1px to 3px). Bust and the total now share one grid cell with only one visible, so the header keeps the taller one's height; the bust's thicker frame is an outline inside the border, which takes no space. Regression test in `station.spec.ts` measures the panel before the first dart, after one dart, at "Remove darts", after takeout and on a bust: red against the old code (218 → 260 px at the first dart), green now.
- While fixing this, Biome's auto-fix ran on the file while a misplaced comment had left it unparseable and rewrote its class templates (`${DART}` → `$DART`, which also wrapped the Add tile's text). The file was restored from git and the changes re-applied; no other file was affected.

2026-11-02: Room check done by the user on the real kiosk, projector and phone: looks good.

2026-11-02: Re-critique run 4 (`.impeccable/critique/2026-11-02T22-23-42Z__packages-web-src.md`): 29/40, no P0 or P1. Open P2s: /watch score overflows its card at 3 digits; "Next player" styled as the main CTA while "Remove darts" is small; station small text (13-18px) and D1-D3 labels; profile chart labels clipped on phones. P3: projector under-filled when idle. Detector: 4 false positives. Done.

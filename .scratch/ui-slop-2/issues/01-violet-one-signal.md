# Violet only for state

Status: done
Type: task

Violet still labels things: station names (`features/display/DisplayPage.tsx:359`, station and watch headers), the "vs" (`DisplayPage.tsx:373`, `features/watch/WatchPage.tsx:85`), rank numbers 1–3 (`DisplayPage.tsx:239`, `features/stats/StatsPages.tsx:122`), the Rating and Pts columns (display, stats, `features/admin/tournament/TournamentRun.tsx:203`, `.points` in `app.css`), award values (`components/Awards.tsx`), match labels (`match-label`), Home's arrows (`features/home/HomePage.tsx:12`), the admin avatar badge (`features/admin/players/PlayersAdmin.tsx:163`), the profile avatar frame, the lineup's 01/02. On the idle projector the thrower's violet score sits next to a violet rating column and violet ranks, so the turn doesn't stand out. DESIGN.md allows some of these, which contradicts its own One Signal Rule.

## What to do

- Violet stays for: the thrower's score (and card frame), selected/pressed states, primary buttons and CTAs, focus rings, played progress squares, the brackets on game shot and the champion, game shot's title.
- Everything else listed goes to Phosphor Paper or Readout Grey; emphasis by weight or size (the ranking column bold, station names in Phosphor, labels grey).
- The profile avatar: the octagon in plain brackets or no frame (the square frame with a corner nub is a fourth silhouette outside DESIGN.md's three).
- DESIGN.md: Colors and the One Signal Rule list exactly the state uses above; remove "match labels" and "points in tables"; the sidecar refreshed.

## Acceptance

- On every screenshot, violet appears only on a state from the list.
- A `grep` for `text-accent` / `bg-accent` / `border-accent` lists only those uses (noted in a Comment).

## Comments

2026-11-01: Confirmed by the user ("go ahead with the ui-slop-2 tickets").

2026-11-01: Built. Violet left on: station names (station and watch headers, display cards), the "vs" (display, watch), leaderboard ranks 1–3 (display, /players), Rating and Pts columns and their headers (display, /players, admin group tables, `.points`), award values, match labels (`match-label` is grey now), Up next labels, Home's arrows, the admin avatar badge, the profile avatar's frame (the octagon stands alone now), the lineup's 01/02 and the draft's seed numbers, the draft's pick count, game shot's winning legs, the bracket card's winner row (bold now, the loser grey), the admin and projector champion card frames and "Champion" label (the admin champion's avatar gets the violet brackets, as on the projector), corrected darts in match detail (Phosphor frame), history row arrows, the profile chart's line, dots and tag, and the heatmap board's rings. Watch's line under the total is violet only for "Remove darts".

What stays violet (the `grep` for accent classes): the thrower's score and card frame (station, watch, display), selected/pressed controls (picker chips' numbers, S/D/T, the current segment, the current admin tab, an open ⋮ menu, the card being edited, the photo crop), primary buttons and CTAs, focus, "Remove darts", a live bracket card and its status, the next-dart cursor on /watch, played progress squares, "Game shot", the brackets, hover on links and the Add tile, accent status pills (a board action running). DESIGN.md's Mecha Violet and One Signal Rule list exactly these.

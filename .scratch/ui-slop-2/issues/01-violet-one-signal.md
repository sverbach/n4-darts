# Violet only for state

Status: needs-triage
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

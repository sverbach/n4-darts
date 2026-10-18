# Create a match in /admin and assign it to a station

Status: done
Type: task
Blocked by: 04

- `/admin` matches page: pick 2–8 active players, settings (start score, in/out rule, legs; "best of N" wording for two players, "first to N" otherwise), and a station.
- Assigning to a station that already has a match (assigned or running) is refused. No queue.
- The station picks it up live and shows the start flow from ticket 04.
- `/admin` shows each station's current match and can abandon it.

## Acceptance

- Test: create and assign via admin API, station view shows it; second assignment to the same station refused; admin abandon closes it.

## Comments

**2026-10-18, done.** `matches.ts`: `POST /api/admin/matches` (`{ station, playerIds, settings }` → the station's `assign()`; 404 unknown station, 409 busy or invalid players, 400 malformed) and `POST /api/admin/stations/:id/abandon`. Web: `/admin/matches` lists every station (board status, current match with scores, or "Free"; cancel/end button) and refreshes every 3 s; the new-match form offers only free stations. Player picker and settings moved to `MatchSetup.tsx`, shared with the station's quick match; the legs setting reads "Best of 3" for two players and "First to 2 legs" otherwise, also on the lineup. Checked in a browser: created a 501 double-out best-of-3 on station 2, it appeared live there, started, showed in the overview, ended from admin.

# `/display`: the tournament on the projector

Status: done
Type: task
Blocked by: 01

- New route `/display` using `/api/display/live`; reconnects by itself (the station page's pattern).
- Running tournament: left third Now playing (a card per station: label, names, legs, remaining scores, who's throwing highlighted, current visit's darts) and Up next (3–5 matches); right the group tables during the group phase, the bracket in the knockout.
- Finished: the champion large and the placings (awards follow in ticket 08), until a new tournament is created.
- No tournament: the station cards (the leaderboard follows in ticket 09).
- Fills a 16:9 screen without scrolling at 1280×720 and 1920×1080: scale everything to fit; large type readable from across the room. Plain styling (design system still shelved).
- Tapping a station card opens `/watch/n` (ticket 04; until then it may link to a 404).

## Acceptance

- Checked in a browser at 1280×720 and 1920×1080 with the simulator: groups with 7 players, the knockout (double elimination), the finished state, the idle state; scores update as darts are thrown.

## Comments

**2026-10-20, done.** `DisplayPage.tsx` on `/display` (linked from the home page), fed by `/api/display/live` through a new shared `useLive` hook (`useLive.ts`). Type is sized from the screen (`font-size: min(1.25vw, 2.22vh)`, everything in `em`), so 720p and 1080p look alike; each panel sits in a `Fit` box that scales its content down if it would overflow, so nothing scrolls. Running: Now playing cards (station, label, names, legs, remaining, the thrower highlighted, the current visit's darts and total; "Next: A vs B" for a match waiting to start) and Up next; right side the group tables, or in the knockout the bracket in two rows (winners and final on top, losers below), reusing the admin `MatchCard`. Finished: the champion large and the placings. Idle: the station cards, larger.
- Checked in a browser at 1280×720 and 1920×1080 with two simulated boards: a 3-player quick match while idle, a 7-player double-elimination tournament through the groups (a dart showing up live), the knockout and the finish; no page scroll at either size.

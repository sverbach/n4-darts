# `/display`: the tournament on the projector

Status: ready-for-agent
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

# Matches reference players; quick match at the station

Status: ready-for-agent
Type: task
Blocked by: 01, 03

Fresh schema: drop the skeleton's `matches` / `match_events` tables (test data, no migration).

- A match stores its player ids in throwing order, the X01 settings and `rulesVersion`, the station, and how it ended: winner, or `abandoned`, plus closed at.
- Matches can be created *assigned* to a station without being started: the station shows the players ("Next: A vs B" or the list).
- Station start flow: reorder the players (drag or up/down) or tap "shuffle", then **Start**. Starting appends `MatchStarted` with the final order.
- Quick match at the station: pick 2–8 players from the active player list, add a new player inline, choose settings (start score, in/out, first to N legs), then the start flow above.
- Station scoreboard handles up to 8 players (remaining score, legs won, current player highlighted). Plain styling.
- When a match is won, record the winner on the match; the station shows the result and offers to close it, freeing the station.
- Abandon from the station: closes the match with `abandoned`, no winner.
- `DELETE /api/admin/players/:id` refuses (409) a player who has matches: archive instead (left over from ticket 03).

## Acceptance

- Integration tests against the simulator: a 4-player first-to-2 quick match played to the end, starter rotating each leg; abandon mid-leg; restart mid-match resumes it.

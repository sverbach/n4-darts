# Matches reference players; quick match at the station

Status: done
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

## Comments

**2026-10-18, done.** Schema versioned with `pragma user_version` (now 1): a version-0 database loses `matches` / `match_events`, keeps `players`. Matches reference players through `match_players(match_id, position, player_id)`; `matches` has `winner` (player id), `abandoned`, `closed_at`; foreign keys on. Station: `assign()` (for ticket 05's admin route too) and commands `quickMatch`, `setOrder` (only before the start, must be the same players), `startMatch` (resets the board, appends `MatchStarted { playerCount }`), `closeMatch` (only once won), `abandonMatch` (started → closed as abandoned; never started → deleted, so cancelled setups leave no history). The recorded winner follows the log after every event, so an undo or correction takes a win back. Validation: 2–8 distinct, existing, non-archived players; start score ≥ 2; legs ≥ 1. `MatchView.players` is `{ id, name }[]` (names looked up live, so renames show). Public `POST /api/players` for adding at the station; `DELETE /api/admin/players/:id` refuses a player with matches.
- Fixed on the way: the board gateway kept reporting events after `close()`, which hit a closed database on shutdown (and in tests).
- Web: quick match picks players in tap order (numbered chips) with inline add; lineup with ↑/↓, Shuffle, Start, Cancel; scoreboard tiles shrink for 3–8 players; win screen "Done" closes, "End match" abandons. Checked in a browser at phone width with a 4-player first-to-2 match.

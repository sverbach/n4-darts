# Tournament tab: overview and overrides

Status: done
Type: task
Blocked by: 05

- Running tournament in the Tournament tab: header (name, phase, matches played of total, expected end time, updated as matches finish), stations with what's on them and a pause toggle, the queue, group tables (played, won, lost, legs for/against, difference, points, average) with fixtures and results, the bracket in columns per round (winners and losers), and at the end the champion and placings. Refreshes live (polling is fine).
- Overrides (API + UI): pause/unpause a station; pin a match to a station; hold/release a match; send back a match that's on a station but not started; play now (a ready match onto a free station). "End tournament early" (confirm): open matches abandoned, scheduler stops.
- A paused station says so on its own page.

## Acceptance

- Tests for each override and its effect on what the scheduler does next.
- Checked in a browser at phone width.

## Comments

**2026-10-18, done.** `GET /api/admin/tournament` now carries `progress` once started (`tournamentView.ts`): phase, played of total, expected end (remaining matches × expected minutes ÷ unpaused stations), stations (paused, match label, summary), the queue in scheduler order (`queueOf`, shared with the scheduler), group tables with fixtures and results, the knockout in columns (winners, losers, final; each side shown as soon as it's known), placings, and `endedEarly`. A finished tournament stays on the Tournament tab until "New tournament". Overrides: `POST /api/admin/tournament/stations/:id/pause`, `.../matches/:id/hold`, `/pin`, `/send-back`, `/play-now`, and `POST /api/admin/tournament/end`.
- Semantics chosen where the spec left room: holding a match that waits on a station takes it off too; a sent-back match isn't handed straight back to the station it came from (until it goes elsewhere or that station gets another match), otherwise the scheduler would return it at once; "play now" onto a station whose match hasn't started sends that match back first; ending early abandons open matches and leaves no placings.
- Web: `TournamentRun.tsx` (refreshes every 3 s). Checked in a browser at phone width: a 5-player tournament from groups through the knockout to placings, pausing and resuming a station.

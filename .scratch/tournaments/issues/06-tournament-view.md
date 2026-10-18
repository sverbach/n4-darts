# Tournament tab: overview and overrides

Status: ready-for-agent
Type: task
Blocked by: 05

- Running tournament in the Tournament tab: header (name, phase, matches played of total, expected end time, updated as matches finish), stations with what's on them and a pause toggle, the queue, group tables (played, won, lost, legs for/against, difference, points, average) with fixtures and results, the bracket in columns per round (winners and losers), and at the end the champion and placings. Refreshes live (polling is fine).
- Overrides (API + UI): pause/unpause a station; pin a match to a station; hold/release a match; send back a match that's on a station but not started; play now (a ready match onto a free station). "End tournament early" (confirm): open matches abandoned, scheduler stops.
- A paused station says so on its own page.

## Acceptance

- Tests for each override and its effect on what the scheduler does next.
- Checked in a browser at phone width.

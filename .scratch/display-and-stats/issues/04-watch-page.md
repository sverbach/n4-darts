# `/watch/n`: a station on the projector

Status: ready-for-agent
Type: task
Blocked by: 02

- New route `/watch/n` using the station's live stream: the scoreboard as on `/station/n` without any controls (no lineup, start, corrections, undo, Done, quick-match form), enlarged for a projector.
- A free station: its name and "Free"; during a tournament the match waiting there ("Next: A vs B").
- Links: the station cards on `/display` open it; the home page lists a watch link per station.
- Reuse the station page's scoreboard parts rather than copying them.

## Acceptance

- Checked in a browser at 1280×720: a quick match and a tournament match played on the simulator, mirrored live; nothing on the page can change the match.

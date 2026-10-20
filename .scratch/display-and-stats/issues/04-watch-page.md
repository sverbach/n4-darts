# `/watch/n`: a station on the projector

Status: done
Type: task
Blocked by: 02

- New route `/watch/n` using the station's live stream: the scoreboard as on `/station/n` without any controls (no lineup, start, corrections, undo, Done, quick-match form), enlarged for a projector.
- A free station: its name and "Free"; during a tournament the match waiting there ("Next: A vs B").
- Links: the station cards on `/display` open it; the home page lists a watch link per station.
- Reuse the station page's scoreboard parts rather than copying them.

## Acceptance

- Checked in a browser at 1280×720: a quick match and a tournament match played on the simulator, mirrored live; nothing on the page can change the match.

## Comments

**2026-10-20, done.** `WatchPage.tsx` on `/watch/n`, on the station's live stream. The station page's scoreboard and "Game shot" screen are now shared components (`Scoreboard`, `MatchOver` in `StationPage.tsx`); without `onDart` the darts are plain text, so the watch page has nothing to press. A free station shows its notice (e.g. paused for the tournament) or "Free"; a match waiting to start "Next: A vs B"; the tournament label sits in the header. Sized from the screen like `/display`. The home page lists a Watch link per station; `/display`'s station cards link here.
- Checked in a browser at 1280×720: free, a best-of-3 quick match with darts coming in (no buttons, inputs or selects on the page), a tournament match waiting and then won; a `/display` card opens `/watch/1`. The station page's dart correction still opens the picker.

# Admin pages on live updates

Status: done
Type: task
Blocked by: 01

- The Tournament tab (`TournamentRun.tsx`, and the draft editor where it reloads) uses `/api/admin/tournament/live` instead of refreshing every 3 s; actions still use the existing POST routes and the pushed view replaces local reloads.
- The match detail in History uses `/api/admin/matches/:id/live` instead of refreshing every 3 s.
- A shared hook for SSE subscriptions (connect, reconnect with backoff, close on unmount), also used by the station page and `/display` where it simplifies them.
- If the PIN cookie is missing or expired, the page falls back to the PIN prompt as today.

## Acceptance

- No `setInterval` polling left in the web app.
- Checked in a browser: an override on one phone shows up on a second one at once; a dart thrown shows up in the open match detail.

## Comments

**2026-10-20, done.** The Tournament tab, the match detail in History, the Stations tab and the Matches tab's station overview all follow live streams through `useLive`; the station page's `useStation` uses it too. Actions just send their request and show its error; the fresh view arrives through the stream. Added `GET /api/stations/live` (public, the station list) and `GET /api/admin/stations/live` (the Stations tab), since those two tabs also refreshed every 3 s. A stream that answers 401 (PIN cookie gone) shows "Couldn't load …" as the old fetch did. No `setInterval` left in the web app.
- Checked in a browser at phone width: a pause on one phone showed on a second one 40 ms later; the Matches tab and the match detail followed darts from the simulator; a finished match opened from History.

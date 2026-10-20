# Admin pages on live updates

Status: ready-for-agent
Type: task
Blocked by: 01

- The Tournament tab (`TournamentRun.tsx`, and the draft editor where it reloads) uses `/api/admin/tournament/live` instead of refreshing every 3 s; actions still use the existing POST routes and the pushed view replaces local reloads.
- The match detail in History uses `/api/admin/matches/:id/live` instead of refreshing every 3 s.
- A shared hook for SSE subscriptions (connect, reconnect with backoff, close on unmount), also used by the station page and `/display` where it simplifies them.
- If the PIN cookie is missing or expired, the page falls back to the PIN prompt as today.

## Acceptance

- No `setInterval` polling left in the web app.
- Checked in a browser: an override on one phone shows up on a second one at once; a dart thrown shows up in the open match detail.

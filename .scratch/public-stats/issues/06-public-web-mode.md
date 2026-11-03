# The web app in public mode

Status: ready-for-agent
Type: task
Blocked by: 01, 02, 04, 05

## What to do

- The app learns it's public from the server (`GET /api/public/session`: public or not, logged in or not).
- Public mode: routes only for /players, /players/:id, /tournaments, /tournaments/:id, /matches/:id and the login; anything else goes to /players. No links to Home, stations, the projector or admin; the logo leads to /players.
- `noindex` for search engines.

## Acceptance

- Browser test against the public process: the login, then a profile → a tournament → a match; no request to a non-public route; no link to admin or a station on any public page.

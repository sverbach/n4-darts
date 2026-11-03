# The web app in public mode

Status: done
Type: task
Blocked by: 01, 02, 04, 05

## What to do

- The app learns it's public from the server (`GET /api/public/session`: public or not, logged in or not).
- Public mode: routes only for /players, /players/:id, /tournaments, /tournaments/:id, /matches/:id and the login; anything else goes to /players. No links to Home, stations, the projector or admin; the logo leads to /players.
- `noindex` for search engines.

## Acceptance

- Browser test against the public process: the login, then a profile → a tournament → a match; no request to a non-public route; no link to admin or a station on any public page.

## Comments

2026-11-03: Built. The app asks `GET /api/public/session` (`features/public/PublicGate.tsx`, from 02): on the public site it shows only /players, /players/:id, /tournaments, /tournaments/:id and /matches/:id (anything else redirects to /players), with the login until logged in. A `PublicSite` context (`lib/publicSite.ts`) drops the links into the room: the logo leads to /players, and /players has no "← Home". The public server sends `X-Robots-Tag: noindex, nofollow` on every answer (nginx adds it again in 07). Tests: `App.test.tsx` (routes on both), `publicApp.test.ts` (the header), and `e2e/tests/public.spec.ts` against a real public process (`e2e/src/start.ts` starts one on the same database once the room's server is up): a tournament played in the room, then the login (wrong, then right), /players → a profile → the tournament → a match, no link into the room on any of them, /station/1 redirects, and every API request is a public route.

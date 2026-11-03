# A shared password for the public site

Status: done
Type: task
Blocked by: 01

## What to do

- `N4_PUBLIC_PIN`: every public route but the login answers 401 without a session; `POST /api/public/login` with the PIN sets a session cookie (as the admin PIN does: long-lived, httpOnly, secure behind TLS). Without `N4_PUBLIC_PIN` the public process refuses to start.
- The public web app shows a login page (one field, like admin's PIN screen) and remembers the session.
- Wrong attempts are slowed down (a short delay, and nginx rate limit in 07).

## Acceptance

- Server tests: 401 without a session, a session after the right PIN, refused with the wrong one, refused to start without a PIN.

## Comments

2026-11-03: Built. `N4_PUBLIC_PIN` is required: `buildPublicApp` takes it, and `main.ts` exits with a message without it. `registerPublicAccess` (`access/accessRoutes.ts`): `POST /api/public/login` sets `n4_public` (HttpOnly, SameSite=Lax, 30 days, Secure when nginx says `X-Forwarded-Proto: https`), `/api/public/logout`, `GET /api/public/session` ({ public, authenticated }); every other `/api` route answers 401 without the cookie. The token is the PIN's HMAC with its own scope, so admin's cookie doesn't open the public site. A wrong PIN waits 1 s before its answer. The room's server answers the session with { public: false } (`registerRoomSession`). Web: `features/public/PublicGate.tsx` asks for the session and shows the room's pages, the login (one field, like admin's PIN screen, "Enter the group's password"), or the public pages; the browser keeps the cookie. App.tsx splits into the room's routes and the public ones (06 continues from there). Tests: `publicApp.test.ts` (401 without a session, login right/wrong, Secure behind TLS, admin token refused, start refused without a PIN by running main.ts, the room's session), `App.test.tsx` (routes on both).

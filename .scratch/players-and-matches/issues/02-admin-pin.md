# /admin shell behind the PIN

Status: done
Type: task

- `ADMIN_PIN` env var (add to `docker-compose.yml` as `N4_ADMIN_PIN`).
- `/admin` page in `packages/web`: asks for the PIN once, then shows an empty admin shell (navigation for players, stations, matches). Plain styling, mobile friendly.
- Server: `POST /api/admin/login` checks the PIN and sets an httpOnly cookie valid for 30 days. Every `/api/admin/*` route (except login) refuses without it.
- No `ADMIN_PIN` set: admin routes are open and the server logs a warning at startup.
- Station routes stay unprotected (ADR-0004).

## Acceptance

- Tests: admin API refuses without the cookie, accepts with it, wrong PIN rejected, open when no PIN is configured.

## Comments

**2026-10-18, done.** `admin.ts`: `GET /api/admin/session` (`{ pinRequired, authenticated }`), `POST /api/admin/login` / `logout`; an `onRequest` hook refuses every other `/api/admin/*` route without the cookie, so tickets 03/05/07 just add routes under that prefix. The cookie (`n4_admin`, HttpOnly, SameSite=Lax, 30 days) is an HMAC derived from the PIN, so a device stays logged in across restarts and is logged out when the PIN changes; no secret to store. `ADMIN_PIN` env (compose: `N4_ADMIN_PIN`); unset → open, with a startup warning. Web: `/admin` → players, `/admin/players|stations|matches` with a PIN screen, nav and log out; sections are placeholders for the next tickets. Checked in a browser at phone width: wrong PIN, unlock, stays unlocked across a page load, log out.

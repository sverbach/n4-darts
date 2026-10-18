# /admin shell behind the PIN

Status: ready-for-agent
Type: task

- `ADMIN_PIN` env var (add to `docker-compose.yml` as `N4_ADMIN_PIN`).
- `/admin` page in `packages/web`: asks for the PIN once, then shows an empty admin shell (navigation for players, stations, matches). Plain styling, mobile friendly.
- Server: `POST /api/admin/login` checks the PIN and sets an httpOnly cookie valid for 30 days. Every `/api/admin/*` route (except login) refuses without it.
- No `ADMIN_PIN` set: admin routes are open and the server logs a warning at startup.
- Station routes stay unprotected (ADR-0004).

## Acceptance

- Tests: admin API refuses without the cookie, accepts with it, wrong PIN rejected, open when no PIN is configured.

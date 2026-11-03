# Public read-only stats

Status: ready-for-agent

Players want their stats, last matches and tournaments from outside the room's LAN. Nothing may be created or changed from outside: no players, matches, tournaments, corrections, stations.

## Decisions (with the user, 2026-11-01/02)

- **A read-only mode of the same app** (not nginx alone, not a static export). The server started with `N4_PUBLIC=1` registers only public read routes and runs nothing else (no board gateway, scheduler, backups); it opens the database read-only. The web app in public mode shows only the public pages. nginx in front is a second layer (TLS, rate limit), not the protection itself.
- **Where:** a second process on the home server, next to the room's server, reading the same SQLite database (WAL allows the reader), behind nginx with TLS. The room's server stays on the LAN only.
- **What's public:** the leaderboard and profiles (as /players today), player photos, past tournaments (new pages: placings, awards, groups, bracket) and match details (new page: legs and visits, read-only).
- **Who's public:** everyone, with an opt-out per player in admin. An opted-out player shows as "Player" with neutral initials in others' tables and matches, without photo or profile.
- **Access:** one shared password for the group. Decided here: in the app (`N4_PUBLIC_PIN`, a session cookie like the admin PIN), not nginx basic auth, so it works without proxy setup and phones stay logged in.
- **Not public:** anything live (streams), stations, the projector, admin, match history lists beyond a player's own.

## Architecture

New ADR 0008 (public read-only mode): amends ADR 0004 (no logins: the public site has one shared password) and keeps ADR 0005 (the room needs no internet; the public process only serves reads).

## Tickets

1. `01-read-only-server.md`: `N4_PUBLIC=1`: only public read routes, read-only database, nothing else running
2. `02-public-password.md`: `N4_PUBLIC_PIN`: a shared password with a session, and its login page
3. `03-player-opt-out.md`: a "public" switch per player; hidden players redacted in every public answer
4. `04-tournament-pages.md`: past tournaments: a list and a page per tournament (API and web, LAN too)
5. `05-match-page.md`: a match's detail page, read-only (API and web, LAN too)
6. `06-public-web-mode.md`: the web app in public mode: only public pages and links
7. `07-deploy-public.md`: docker compose service, nginx example (TLS, rate limit, noindex), README, ADR 0008

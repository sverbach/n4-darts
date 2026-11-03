# The public site on the home server, behind nginx

Status: ready-for-human
Type: task
Blocked by: 07

The containers were tried on a Mac (OrbStack, 2026-11-03): both start from the `public` profile, the read-only mount works, room changes show up publicly at once (also across a restart of the room's server), the password, the 404s for admin routes and `X-Robots-Tag` are as they should be. What's left needs the real server, a domain and nginx.

## What to do

1. **Pull and start** on the home server, next to `docker-compose.yml`:
   ```sh
   docker compose pull
   N4_PUBLIC_PIN=<the group's password> docker compose --profile public up -d
   docker compose --profile public ps   # both Up
   curl -s localhost:3001/api/health    # {"ok":true}
   ```
   Put `N4_PUBLIC_PIN` in the `.env` next to the compose file so a later `up -d` keeps it.
2. **DNS and router:** a name for the site (e.g. `stats.<your domain>`) pointing at the home connection; forward 80 and 443 to the server. Port 3000 (the room's server) must **not** be forwarded.
3. **Certificate:** e.g. `certbot certonly --nginx -d stats.<your domain>` (or however your other sites get theirs).
4. **nginx:** copy `docs/nginx-public.conf` into `sites-available`, replace `stats.example.org` and the certificate paths, enable it, then `nginx -t` and reload. If `limit_req_zone` clashes with another site's zone names, rename them.
5. **Check from outside** (a phone on mobile data, not the home wifi):
   - `https://stats.<your domain>` shows the login; a wrong password says "Wrong password", the right one opens /players.
   - A profile, a tournament and a match open; no link leads to Home, a station, the projector or admin.
   - `/admin` and `/station/1` land on /players.
   - Close and reopen the browser: still logged in.
   - `curl -sI https://stats.<your domain>/ | grep -i robots` shows `noindex`.
   - `curl -s -o /dev/null -w '%{http_code}' https://stats.<your domain>/api/admin/players` is 401 (404 once logged in), never 200.
   - Six wrong logins in a minute: the sixth or so answers 429.
6. **Hiding:** hide someone in `/admin` → Players; reload the public leaderboard: they're "Player", with no link.
7. **Backups:** a backup still appears in `/data/backups` the next day (the public container never writes; the room's server does).

## Acceptance

- Each step above done, or noted here with what went wrong.

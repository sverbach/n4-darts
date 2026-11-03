# Deploying the public site

Status: done
Type: task
Blocked by: 01, 02, 06

## What to do

- `docker-compose.yml`: a second service `n4-public` from the same image with `N4_PUBLIC=1` and `N4_PUBLIC_PIN`, the data volume mounted read-only, on its own port.
- An nginx example config (`docs/`): TLS, only the public service proxied, rate limit on login and API, `X-Robots-Tag: noindex`.
- README: running the public site; ADR 0008 and the architecture docs (deployment view, building blocks, context).

## Comments

2026-11-03: Done. `docker-compose.yml`: `n4-public` from the same image under the `public` profile (`N4_PUBLIC_PIN=… docker compose --profile public up -d`), `N4_PUBLIC=1`, the `n4-data` volume mounted `:ro`, published on `127.0.0.1:${N4_PUBLIC_PORT:-3001}` only, after `n4-darts`. Checked that SQLite reads with no write access to the database, `-wal` and `-shm` files (read-only dir) and still sees the room's new writes. `docs/nginx-public.conf`: HTTP→HTTPS, TLS, only the public container proxied, `X-Forwarded-Proto` (makes the cookie Secure), rate limits on the login (5/min) and the API (10/s), `X-Robots-Tag: noindex`. README: "The public site". ADR 0008; architecture: requirements STATS-08 to 10, context (the HTTPS channel), building blocks (the public site, `hidden.ts`, `past.ts`, `results.ts`, `features/public`, the shared components), deployment (the container, its variables, nginx), Q-12, risks, access. `docker compose --profile public config` passes. Not run: the containers (the Docker daemon wasn't running) and `nginx -t` (no nginx here).

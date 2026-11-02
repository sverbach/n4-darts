# Deploying the public site

Status: needs-triage
Type: task
Blocked by: 01, 02, 06

## What to do

- `docker-compose.yml`: a second service `n4-public` from the same image with `N4_PUBLIC=1` and `N4_PUBLIC_PIN`, the data volume mounted read-only, on its own port.
- An nginx example config (`docs/`): TLS, only the public service proxied, rate limit on login and API, `X-Robots-Tag: noindex`.
- README: running the public site; ADR 0008 and the architecture docs (deployment view, building blocks, context).

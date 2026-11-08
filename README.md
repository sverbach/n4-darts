# n4-darts

Dart evenings for a room of Autodarts boards, fully offline. The boards detect the darts; n4-darts runs the games, the tournament, the projector and the stats. It runs on the local network, with no internet and no accounts.

> **Requires Autodarts Board Manager 2.0.2.** Board Manager 2.1.0 changed its API (how a dart looks, the event names) and isn't supported: the board shows as online, but no darts arrive. Check a board with `curl http://<board>:3180/api/version`.

## Features

- **Stations** (`/station/n`): one screen per board, on the kiosk laptop or a phone. Pick the players, the game and the throwing order. While playing: a scoreboard, checkout routes, correcting a misdetected dart, adding a missed one, and undo. The board menu (⋮) starts, stops, calibrates and resets the board.
- **Games:** X01 (301/501/701, in and out rules, first to N legs) and the party games Around the Clock, Golf, High Score, Killer, Cricket, Random Checkout and Bermuda. Party games are for fun: never in tournaments, never in the stats.
- **Tournaments** (`/admin` → Tournament): groups, then single or double elimination, seeded by rating. Once started, the server puts each match on a free station by itself. The organiser can pause a station, hold or move a match, withdraw a player, or take a late arrival.
- **Projector:** `/display` follows the evening (live scores, groups, bracket, champion and awards, or the leaderboard), and `/watch/n` shows one station's scoreboard.
- **Stats** (`/players`, `/tournaments`): rating, averages, checkout %, 180s, best leg and a heatmap per player, plus every past tournament and match. X01 matches only.
- **Caller:** a voice calls the scores, "No score" and "Game shot". It's switched on per device, and voice packs in [darts-caller](https://github.com/lbormann/darts-caller)'s format can be uploaded in `/admin` → Sound.
- **Lights:** WLED presets for idle, playing and moments like match start, game shot, a 100+ visit, 180 and bust (`/admin` → Lights).
- **Public site:** a read-only copy of the stats for players outside the room, behind one group password.
- **Admin** (`/admin`, optionally behind a PIN): players with photos, stations, matches, diagnostics. The database is backed up daily.

## Running on the server

Every green push to `main` publishes `ghcr.io/sverbach/n4-darts:latest`. Next to `docker-compose.yml`:

```sh
docker compose pull && docker compose up -d
```

Then open `http://<server>:3000/station/1` on each station laptop, `/display` on the projector and `/admin` on the organiser's phone.

| Variable          | What it does                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `N4_STATIONS`     | Seeds the boards on the very first start, e.g. `1=http://192.168.1.139:3180,2=http://…`. After that they're managed in `/admin` → Stations. |
| `N4_ADMIN_PIN`    | Locks `/admin`. Without it, `/admin` is open.                                                    |
| `N4_PORT`         | Port of the app (default 3000).                                                                  |
| `N4_PUBLIC_PIN`   | The group password for the public site.                                                          |
| `N4_PUBLIC_PORT`  | Port of the public site, on `127.0.0.1` only (default 3001).                                     |
| `COMPOSE_PROFILES`| Set to `public` to also start the public site (same as `--profile public`; use this in Portainer). |

Data lives in the `n4-data` volume.

**Public site** (ADR 0008): a second container (`n4-public`) from the same image reads the room's database read-only. Start it with `N4_PUBLIC_PIN=… docker compose --profile public up -d`, or set `COMPOSE_PROFILES=public`. It listens on `127.0.0.1` only, for nginx on the same host to serve with TLS (`docs/nginx-public.conf`). It waits for the room's server to create the database first. `/admin` → Players → **Hide from public site** shows a player there as "Player".

**Reverse proxy:** the room's server is meant for the local network only. If a proxy sits in front of it anyway, it must forward WebSockets, because the live views run over them (ADR 0011). In nginx: `proxy_http_version 1.1` plus the `Upgrade` and `Connection` headers.

**Backups:** once a day the database is copied to `/data/backups` in the volume, and the newest 30 are kept. They're on the same disk, so copy one elsewhere now and then. To restore one:

```sh
docker compose stop
docker compose run --rm --no-deps --entrypoint sh n4-darts -c \
  'cd /data && rm -f n4-darts.db-wal n4-darts.db-shm && cp backups/n4-darts-2026-10-20-2315.db n4-darts.db'
docker compose up -d
```

## Development

Requires Node 22+ and pnpm 12. If pnpm 12 isn't installed, put `npx -y pnpm@12.14.0` in front of every `pnpm` command.

```sh
pnpm install
pnpm dev:sim     # the app on :5173 with two fake boards (:3180, :3181) and a fake WLED strip (:3190)
pnpm dev         # the same without fakes; real boards with STATIONS=1=http://192.168.1.139:3180
pnpm test        # unit and integration tests
pnpm lint && pnpm typecheck
pnpm build && pnpm start   # production build on :3000
pnpm build && pnpm e2e     # browser tests (Playwright), the same as CI
pnpm --filter @n4/e2e visual   # screenshot comparison, by hand (macOS baseline); add --update-snapshots
pnpm db:reset    # clear the dev database (server stopped)
```

With `pnpm dev:sim`, open <http://localhost:5173/station/1> next to the fake board at <http://localhost:3180/>. Click the board to throw (or type `T20`, `D16`, `BULL`), and press **Takeout** to end the visit. Options go in front of the command, e.g. `ADMIN_PIN=1234 pnpm dev:sim` or `PORT=3100 pnpm dev:sim`.

| Path              | What                                                          |
| ----------------- | ------------------------------------------------------------- |
| `packages/engine` | The game rules, X01 and party modes; pure, shared with the UI |
| `packages/server` | Node server: board gateway, matches, tournaments, stats, API  |
| `packages/web`    | React app                                                     |
| `packages/e2e`    | Browser and visual tests                                      |
| `tools/board-sim` | Fake Board Manager (2.0.2 API, `docs/board-manager-api.md`)   |
| `tools/wled-sim`  | Fake WLED controller                                          |
| `tools/callouts`  | The built-in caller voice and the voice-pack importer         |

More: [`docs/architecture/`](docs/architecture/README.md) (arc42), `docs/adr/` (decisions), `GLOSSARY.md`, `docs/ui-pages.md`.

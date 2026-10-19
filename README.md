# n4-darts
offline dart platform using Autodarts scoring capabilities

See `docs/architecture.md` for the design and `docs/adr/` for the key decisions.

## Layout

| Path              | What                                                       |
| ----------------- | ---------------------------------------------------------- |
| `packages/engine` | Pure game rules (X01), no dependencies, shared with the UI |
| `packages/server` | Node server: board gateway, matches, tournaments, API      |
| `packages/web`    | React app: `/station/n`, `/admin`, `/display`              |
| `tools/board-sim` | Fake Autodarts Board Manager for development and tests     |

## Run it locally

Play the whole thing on your laptop with two fake boards instead of real ones.

```sh
pnpm install
pnpm dev:sim
```

This starts four things side by side. Ctrl-C stops all of them.

| Page                               | What it is                                                         |
| ---------------------------------- | ------------------------------------------------------------------ |
| <http://localhost:5173/>           | The app, with links to the stations and admin                      |
| <http://localhost:5173/station/1>  | Station 1: start a match, scoreboard, correct darts                |
| <http://localhost:5173/station/2>  | Station 2                                                          |
| <http://localhost:5173/admin>      | Admin: tonight's tournament, players, stations, matches, history   |
| <http://localhost:3180/>           | Fake board for station 1: click the dartboard to throw             |
| <http://localhost:3181/>           | Fake board for station 2                                           |

The app runs on the Vite dev server (:5173), which reloads on every code change and forwards `/api` to the n4-darts server (:3000).

**Playing a leg:** open `/station/1` and a fake board side by side. On the station, pick two or more players (add them right there, or in `/admin`), set the order and press **Start**. Click the board three times, then press **Takeout** on the fake board to end the visit, as a player pulling their darts would. On the fake board you can also:

- tap a listed dart, then a spot on the board, to change it (as if Autodarts corrected itself)
- type a dart like `T20`, `D16`, `BULL` and press enter
- press **Reset** (as if someone pressed reset on the station laptop), **Stop** / **Start**, or **Go offline** to see how the station copes

**Options**, set in front of the command:

```sh
ADMIN_PIN=1234 pnpm dev:sim   # lock /admin behind a PIN (open without one)
PORT=3100 pnpm dev:sim        # server on another port, e.g. when Docker already uses 3000
```

The dev database is `packages/server/data/n4-darts.db`; delete it to start over.

If pnpm 12 isn't installed, put `npx -y pnpm@12.14.0` in front of every `pnpm` command, e.g. `npx -y pnpm@12.14.0 dev:sim`.

### Without the simulator (real boards)

```sh
STATIONS=1=http://192.168.1.139:3180 pnpm dev   # dev mode: app on :5173, server on :3000
pnpm build && pnpm start                        # production mode: everything on :3000
```

`STATIONS` (number = Board Manager address, comma-separated) only seeds the stations on a fresh database; after that it's ignored and you change board addresses in `/admin` → Stations. `pnpm dev` shares its database with `pnpm dev:sim`, so if you've used the simulator, station 1 still points at `localhost:3180`: change it in `/admin`, or delete `packages/server/data/n4-darts.db*` to start over. `pnpm start` keeps its own database in `data/` at the repo root (`DATA_DIR` to change it).

### With Docker

```sh
docker build -t n4-darts .
docker run --rm -p 3000:3000 -v n4-data:/data \
  -e STATIONS=1=http://192.168.1.139:3180 -e ADMIN_PIN=1234 n4-darts
```

Then open <http://localhost:3000>. To run the published image instead, use `ghcr.io/sverbach/n4-darts:latest` in place of `n4-darts`.

## Running a tournament

Everything happens in `/admin` → **Tournament**, on the organiser's phone.

1. **Set it up.** Pick tonight's players and press **Create draft**. Choose the format (groups, how many advance, single or double elimination), the legs per phase and the game (start score, in/out). The draft shows the seeds (by recent 3-dart average; new players last in a random order, ↑/↓ to change), the groups, and how long it'll take. Players and format can still change after starting, until the first match is played.
2. **Start it.** From now on the server runs the evening: it puts the next match on every free station as soon as both players are free (round by round, longest-rested first), builds the knockout when the groups are done, and moves winners (and, in double elimination, losers) on until there's a champion. Players walk up, set who throws first, press **Start** and play. After the checkout, **Done** frees the station; if nobody presses it, that happens by itself after a minute.
3. **Step in when needed.** The Tournament tab shows the stations, the queue, the group tables and the bracket, and refreshes by itself.
   - **Pause** a station to keep it out of the tournament (e.g. for casual throws); its current match carries on.
   - **Hold** a match while a player is away; it's skipped until you release it.
   - **Send back** a match that's waiting on a station but hasn't started; **Play now on…** puts a chosen match on a station out of order; a match can also be kept for **only** one station.
   - **Withdraw** a player who leaves: their remaining matches become walkovers. A **late arrival** can still join during the group phase.
   - Fix a misdetected dart from **Matches → History**. A correction that would change a result a later match already depends on is refused, with that match named.
4. **The end.** The champion and the final placings stay on the tab until you start the next tournament. **End tournament early** stops everything without a champion.

**Try it locally:** run `pnpm dev:sim`, add a few players in `/admin`, create and start a tournament, then play the matches that appear on `/station/1` and `/station/2` by clicking the two fake boards (<http://localhost:3180/>, <http://localhost:3181/>). Set every phase to best of 1 for a quick test evening; typing darts on the fake board (`T20`, enter, three times) is faster than clicking.

## Development

Requires Node 22+ and pnpm 12 (`npm i -g pnpm@12`, or prefix the commands with `npx pnpm@12`).

```sh
pnpm install
pnpm test        # all tests, run against TypeScript sources
pnpm lint        # biome
pnpm typecheck
pnpm sim         # fake board on :3180 (station 1's default board)
pnpm dev         # server on :3000 + web dev server (proxies /api to :3000)
pnpm dev:sim     # the same plus two fake boards on :3180/:3181 wired to stations 1 and 2
pnpm build && pnpm start   # production build, served on :3000
```

### Board simulator

A fake Autodarts Board Manager (same API as the real one, see `docs/board-manager-api.md`). Each fake board serves a control page at its own address, e.g. <http://localhost:3180/>. Click the dartboard to throw, tap a listed dart and then the board to revise it, and use the buttons for takeout, bounce-out, an outside reset (as if pressed on the laptop), stop/start and offline.

For a full session without a real board, see [Run it locally](#run-it-locally).

```sh
pnpm sim --port 3180                       # one board; --boards 2 for 3180 and 3181. Or by hand:
curl -X POST localhost:3180/sim/dart -d '{"name":"T20"}'   # S20 SO20 D20 T20 25 BULL M17 BOUNCE
curl -X POST localhost:3180/sim/takeout
pnpm sim --replay prototypes/recordings/2026-10-18-board1.txt --speed 10
```

## Running on the server

Every push to `main` that passes CI publishes `ghcr.io/sverbach/n4-darts:latest` (and a tag per commit SHA). On the server, next to `docker-compose.yml`:

```sh
docker compose pull && docker compose up -d   # latest published image
docker compose up -d --build                  # or build from the checkout instead
```

Serves on port 3000 (override with `N4_PORT=8080`). Data lives in the `n4-data` volume.
Stations are managed in `/admin` (Stations tab). On the very first start they're seeded from `N4_STATIONS`, e.g. `N4_STATIONS=1=http://192.168.1.139:3180,2=http://192.168.1.140:3180`; after that the variable is ignored. Lock `/admin` with `N4_ADMIN_PIN=1234`.

Open `http://<server>:3000/station/1` on the station laptop (and on any phone that should control it).

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
| <http://localhost:5173/admin>      | Admin: players, stations, matches (still empty, being built now)   |
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

```sh
docker compose up -d --build
```

Serves on port 3000 (override with `N4_PORT=8080`). Data lives in the `n4-data` volume.
Stations are set with `N4_STATIONS`, e.g. `N4_STATIONS=1=http://192.168.1.139:3180,2=http://192.168.1.140:3180`.

Open `http://<server>:3000/station/1` on the station laptop (and on any phone that should control it).

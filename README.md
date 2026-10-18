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

## Development

Requires Node 22+ and pnpm 12 (`npm i -g pnpm@12`, or prefix the commands with `npx pnpm@12`).

```sh
pnpm install
pnpm test        # all tests, run against TypeScript sources
pnpm lint        # biome
pnpm typecheck
pnpm dev         # server on :3000 + web dev server (proxies /api to :3000)
pnpm build && pnpm start   # production build, served on :3000
```

### Board simulator

A fake Autodarts Board Manager (same API as the real one, see `docs/board-manager-api.md`):

```sh
pnpm sim -- --port 3180                       # then throw darts by hand:
curl -X POST localhost:3180/sim/dart -d '{"name":"T20"}'   # S20 SO20 D20 T20 25 BULL M17 BOUNCE
curl -X POST localhost:3180/sim/takeout
pnpm sim -- --replay prototypes/recordings/2026-10-18-board1.txt --speed 10
```

## Running on the server

```sh
docker compose up -d --build
```

Serves on port 3000 (override with `N4_PORT=8080`). Data lives in the `n4-data` volume.

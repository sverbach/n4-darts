# Live views over WebSockets

Status: ready-for-agent
Type: task

Swap the transport under every live view in one go. `streamView` and `followStream` are shared, so the server and client switch together, and the tests that read streams move with them. Read the spec's decisions first.

## What to do

### Server

- Add `@fastify/websocket` (exact version, supports Fastify 5) to `@n4/server`, and register it in the room's app only. The public app has no live routes.
- `live/liveRoutes.ts`: replace `openEventStream` with a socket-based equivalent. It sends one message per view (the JSON text) and runs `onClose` when the socket closes. Ping every 25 s, and terminate a socket that didn't answer the previous ping. Drop the SSE headers and the `: keep-alive` comment.
- `streamView` keeps its signature apart from what it takes instead of `reply`. The routes still pass `subscribe`, `view` and `{ kind, label }`.
- Every `/live` route becomes a WebSocket route on the same URL: display, stations (list, one station, admin list), players (public, admin), matches (history, detail), tournament (admin), lights, and diagnostics (`operationsRoutes.ts`, which uses the low-level helper directly).
- **Refusals:** a live route that can't stream closes the socket with `4000 + status` and the error text as the reason. This covers an unknown station or match (4404), a param or query that doesn't parse (4400), and `/api/admin/matches/live` without a feed (4404). One helper does this, so routes don't each pick codes. Route errors on a socket don't reach `app.ts`'s error handler, so the helper maps them itself: a `parse` failure becomes 4400 with `requestProblem(error)` (`parse.ts`) as the reason, the same text the 400 has today. Live routes keep parsing their params and query with `parse` (ADR 0010).
- **Admin guard** (`access/accessRoutes.ts`): for an upgrade request to `/api/admin/*/live` without a valid cookie, the guard doesn't reply 401. The socket then closes with 4401 "admin PIN required". Keep the check in the guard, for example by marking the request there and having the socket helper close a marked request, so no route needs its own check. Plain HTTP requests get 401 as before.

### Client

- `lib/liveStream.ts`: `followStream` opens a `WebSocket` (`ws:` or `wss:` from `location.protocol`, the same host, the same path).
  - A message → `onConnected(true)`, then `onView(JSON.parse(data))`.
  - Open → `onConnected(true)`.
  - A close with a code from 4000 to 4999 → `onFailed()`, no retry.
  - Any other close → `onConnected(false)`, then reconnect after 500 ms, doubling up to 5 s, reset when a connection opens.
  - The returned stop function closes the socket and cancels a pending reconnect.
  - Remove the `pagehide`/`pageshow` handling. Keep the injectable environment (a socket constructor and timers) so the tests stay fast and need no fake browser.
- `lib/useLive.ts`: keep the API. Update the doc comments ("EventSource keeps retrying" → reconnects).
- `vite.config.ts`: `ws: true` on the `/api` proxy.
- `biome.json`: `noRestrictedGlobals` refuses `WebSocket` outside `lib/`, like `EventSource` and `fetch`. Drop `EventSource` if nothing uses it any more.

### Tests

- `live/live.test.ts`: read streams over a WebSocket (`injectWS` from `@fastify/websocket`, or the `ws` client against a listening app, whichever reads better). Replace the SSE header test with: a refused admin stream closes with 4401 and the reason, an unknown station closes with 4404, and a bad id closes with 4400.
- The other server tests that open `/live` (`station.test.ts`, `stations.test.ts`, `diagnostics.test.ts`, `overrides.test.ts`) move the same way.
- `testing/load/load.test.ts`: its stream reader reads a socket. The thresholds stay as they are. If the numbers move, record by how much in the comments here.
- `lib/liveStream.test.ts`: replace the back/forward cache tests with:
  - a dropped connection reconnects, with growing delays capped at 5 s, reset after an open;
  - a 4xxx close calls `onFailed` and never reconnects;
  - stopping cancels a pending reconnect.
- e2e: `navigation.spec.ts` ("old streams close") must still pass, since it reads the streams list from diagnostics. Run the whole e2e suite, which includes latency.

## Acceptance

- No `text/event-stream`, `EventSource`, `X-Accel-Buffering` or `pagehide` left in `packages/` (`git grep`).
- Every live page works as before in `pnpm dev` and in the built app, including `/admin` without the PIN, which shows its error and doesn't spin.
- Restarting the server while a station page is open: the page shows disconnected, then catches up by itself within about 5 s.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm e2e` pass.

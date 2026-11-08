# Live views over WebSockets

Status: done

Every live view (`/api/*/live`) moves from Server-Sent Events to a WebSocket. Only the transport changes. The server still pushes the whole view on connect and again whenever it changes, the change feed and every route's `subscribe`/`view` pair stay as they are, and every `useLive` call site stays the same. Changes still go out as HTTP requests.

## Why (2026-11-04)

Twice, SSE over HTTP/1.1 slowed the whole app down:

- **Behind a proxy** (`live-behind-proxy/01`): nginx buffered and gzipped `text/event-stream`, so darts showed up 5–30 s late. Fixed with `X-Accel-Buffering: no` and `Cache-Control: no-cache, no-transform`.
- **The six-connection limit** (`ui-bugs/03`): pages kept in the back/forward cache held their streams open. The browser's six HTTP/1.1 connections per host ran out, and the next page load waited up to a minute. Fixed by closing streams on `pagehide`. Still open by decision: six or more live tabs stall the next page.

Both come from long-lived HTTP/1.1 responses. HTTP/2 would lift the connection limit, but browsers only speak it over TLS, and the room's server runs plain HTTP on the LAN. A WebSocket is a tunnel after the upgrade: a proxy can't buffer or compress it, and browsers don't count it against the six HTTP connections. That removes the whole class, including the known gap, instead of working around each case. Nothing else is planned right now, so this is done to make the app more robust ahead of time, not to fix a current bug.

## Decisions (2026-11-04, open to change)

- **`@fastify/websocket`** on the server, at an exact version that supports Fastify 5. No library on the client: the browser's `WebSocket` and a small reconnect loop in `followStream`. `reconnecting-websocket` is unmaintained, `partysocket` is more than we need, and ADR 0007 keeps client dependencies few.
- **One socket per view, server → client only.** The URLs stay (`/api/stations/1/live`, …). No multiplexing over one shared socket and no subscription protocol: per-view sockets are a drop-in replacement, and the connection limit no longer applies. Messages from the client are ignored.
- **Refusals close with `4000 + HTTP status`, and the close reason is the error text.** A rejected upgrade shows up in the browser only as a generic error with close code 1006, the same as a server that's down, so the client couldn't tell "admin PIN required" from "server restarting" and would retry forever. Instead the server accepts the upgrade and closes straight away: 4401 for the admin guard, 4404 for an unknown station or match, 4400 for a param that doesn't parse. On the client a close code from 4000 to 4999 is final (`failed`, no retry). Anything else is a dropped connection (`connected: false`, then retry).
- **The admin guard stays the one place that decides.** For an upgrade request, the guard doesn't answer 401 itself. It lets the request reach the socket handler, which closes it with 4401. However it's built, there's still one check, and no route can forget it.
- **Reconnect with backoff:** start at 500 ms, double each time up to 5 s, and reset once a connection opens. The server sends the whole view on connect, so nothing needs to be replayed.
- **The server pings every 25 s and drops a socket that hasn't answered the previous ping.** This is still under nginx's default `proxy_read_timeout` (60 s, which applies to WebSockets too), and it clears out kiosks that left the Wi-Fi without closing. Diagnostics then sees the stream as closed.
- **The `pagehide`/`pageshow` handling goes.** A page with an open WebSocket is either left out of the back/forward cache or has its socket closed by the browser. Either way the reconnect loop covers coming back. Going back can then reload the page instead of restoring it instantly. That's accepted (2026-11-04).
- **Proxies must forward WebSocket upgrades.** OPS-04 ("without special proxy configuration") changes to "with WebSockets allowed". On the room's proxy that's the WebSocket toggle in nginx UI, which the operator handles. The public site has no live views (`buildPublicApp`), so `docs/nginx-public.conf` is unaffected.
- **The Vite dev proxy forwards WebSockets** (`ws: true` on `/api`).
- **Diagnostics keeps counting streams** (`diagnostics.openStream`) with the same kinds and labels. The upgrade request has the headers it needs.

## Tickets

1. `01-websocket-transport.md`: the server and client transport, refusals, reconnect, ping, and the tests and load test that read streams
2. `02-real-browsers-and-proxy.md`: check it in Brave, on a kiosk, and behind the room's proxy (human)
3. `03-adr-and-docs.md`: the ADR, README, architecture docs and glossary

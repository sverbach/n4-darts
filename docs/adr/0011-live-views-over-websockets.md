# Live views over WebSockets

Every live view (`/api/*/live`) is a WebSocket. The server sends the whole view as soon as the socket opens, and again whenever the view changes. Nothing is sent from the client: changes still go out as HTTP requests (`request()` / `call()`) and come back through the socket. There's one socket per view, on the same URL the view had before, so nothing needs a subscription protocol. `liveView` / `liveRoute` (`live/liveRoutes.ts`) serve them, and `followStream` (`lib/liveStream.ts`, used by `useLive`) follows them.

The live views used to be Server-Sent Events, and the long-lived HTTP/1.1 responses they need slowed the whole app down twice:
- **Behind nginx,** the proxy buffered and gzipped `text/event-stream`, so darts showed up 5–30 s late (`.scratch/live-behind-proxy`). Headers fixed it, but only for proxies that honour them.
- **Pages kept in the back/forward cache** held their streams open and used up the browser's six connections per host. The next page load then waited up to a minute (`.scratch/ui-bugs/issues/03-stale-streams-stall-pages.md`). Closing streams on `pagehide` fixed it, but six live tabs still stalled the next page.

HTTP/2 would lift the connection limit, but browsers only speak it over TLS, and the room's server is plain HTTP on the LAN. A WebSocket is a tunnel once it's upgraded: a proxy can't buffer or compress it, and it doesn't count against the six HTTP connections. That removes the whole class of problem instead of working around each case. `@fastify/websocket` serves the sockets. The client needs no library: the browser's `WebSocket` and a reconnect loop of about 30 lines.

## Consequences

- **Refusals are close codes.** When a socket is refused, the browser doesn't see the HTTP status of the upgrade. Its close looks the same as a server that's down. So a live route that can't stream accepts the socket and closes it with `4000 + the HTTP status` and the error text as the reason:
  - 4401: the admin guard (`refuseLive`);
  - 4404: an unknown station or match;
  - 4400: a param that doesn't parse.
- **The client retries.** A close code from 4000 to 4999 is final: `useLive` reports `failed` and stops. Any other close is a dropped connection: it reports `connected: false` and reconnects after 500 ms, doubling up to 5 s. The server sends the whole view on connect, so nothing needs replaying.
- **The server pings every 25 s** and terminates a socket that missed the previous pong. That stays under nginx's default 60 s `proxy_read_timeout`, and it closes sockets of kiosks that dropped off the Wi-Fi.
- **A reverse proxy must forward WebSocket upgrades** (in nginx: `proxy_http_version 1.1` and the `Upgrade`/`Connection` headers). Without that, live updates stop altogether instead of arriving late. Nothing else needs configuring. The public site has no live views, so its proxy isn't affected.
- **The back/forward cache restores live pages less often.** Browsers either keep pages with an open socket out of it or close the socket. Going back may reload the page, and the reconnect loop covers the rest. That's accepted.
- **The routes are declared once the plugin has loaded** (`enableLive(app).after(…)` in `app.ts`), because the plugin turns routes into socket routes as they're added.
- **Tests follow views with Node's own `WebSocket`** (`testing/liveClient.ts`).

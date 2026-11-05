# ADR and docs for live views over WebSockets

Status: done
Type: task
Blocked by: 01

## What to do

- **ADR:** `docs/adr/0011-live-views-over-websockets.md`. Cover why we're leaving SSE (the two incidents and the HTTP/1.1 root cause, and why HTTP/2 isn't an option on the LAN), one socket per view, the `4000 + status` close codes, and the trade-off: proxies must allow WebSockets, and the back/forward cache restores pages less often. Add it to `docs/architecture/09-architecture-decisions.md`.
- **ADR 0007:** "pushed over Server-Sent Events" → over a WebSocket.
- **README, "Behind a reverse proxy":** the proxy must forward WebSocket upgrades on `/api/*/live` (in nginx: `proxy_http_version 1.1` and the `Upgrade`/`Connection` headers, or nginx UI's WebSocket toggle). Remove the buffering and compression advice and `X-Accel-Buffering`. Keep the warning not to expose the room's server to the internet.
- **Architecture docs:** replace SSE with WebSocket in:
  - `01-introduction-and-goals.md`: OPS-04 becomes "Live updates keep working behind a reverse proxy that forwards WebSockets; nothing else needs configuring (no buffering or compression settings).", with the reference `spec: live-websockets` (agreed 2026-11-04);
  - `03-context-and-scope.md`: the diagram and the interface table, where the row's OPS-04 sentence follows the new wording;
  - `04-solution-strategy.md`;
  - `05-building-block-view.md`: the diagram, the web row, `live/`, and the `useLive` paragraph;
  - `06-runtime-view.md`: the three sequence diagrams;
  - `07-deployment-view.md`: the diagram and the reverse-proxy bullet;
  - `08-crosscutting-concepts.md`: the live paragraph and the `noRestrictedGlobals` bullet (`WebSocket` instead of `EventSource`);
  - `09-architecture-decisions.md`.
- **Glossary:** `docs/architecture/12-glossary.md` replaces the SSE entry with WebSocket. Check `GLOSSARY.md` for "stream" or "SSE".

## Acceptance

- `git grep -nE "SSE|Server-Sent|EventSource|X-Accel"` finds nothing in `README.md`, `docs/` or `GLOSSARY.md`, apart from the ADR's history and the old tickets in `.scratch/`.
- Mermaid diagrams still render.

## Comments

2026-11-05: Done.
- **ADR 0011** is written and added to the list in section 9, next to a "Live views over WebSockets" entry. The old "Live updates" line there now says it was SSE then.
- **README:** the proxy has to forward WebSockets (nginx settings, or nginx UI's toggle).
- **OPS-04** has the agreed wording.
- **Changed from SSE to WebSocket:**
  - sections 3, 4, 5, 6, 7 and 8, including the diagram labels;
  - `noRestrictedGlobals` in section 8;
  - the `followStream` passage in section 8, which now describes reconnects and close codes instead of the back/forward cache;
  - `streamView` → `liveView` in section 5;
  - the glossary's abbreviation table.
- `GLOSSARY.md` has no transport terms.
- `git grep` finds SSE only in section 9's history lines.

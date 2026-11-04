# ADR and docs for live views over WebSockets

Status: ready-for-agent
Type: task
Blocked by: 01

## What to do

- **ADR:** `docs/adr/00NN-live-views-over-websockets.md`, with the next free number. `input-validation/06` also plans to add an ADR as 0010, so whichever lands first takes 0010. Cover why we're leaving SSE (the two incidents and the HTTP/1.1 root cause, and why HTTP/2 isn't an option on the LAN), one socket per view, the `4000 + status` close codes, and the trade-off: proxies must allow WebSockets, and the back/forward cache restores pages less often. Add it to `docs/architecture/09-architecture-decisions.md`.
- **ADR 0007:** "pushed over Server-Sent Events" → over a WebSocket.
- **README, "Behind a reverse proxy":** the proxy must forward WebSocket upgrades on `/api/*/live` (in nginx: `proxy_http_version 1.1` and the `Upgrade`/`Connection` headers, or nginx UI's WebSocket toggle). Remove the buffering and compression advice and `X-Accel-Buffering`. Keep the warning not to expose the room's server to the internet.
- **Architecture docs:** replace SSE with WebSocket in:
  - `01-introduction-and-goals.md`: OPS-04 becomes "behind a reverse proxy that allows WebSockets", and the ticket reference becomes this feature;
  - `03-context-and-scope.md`: the diagram and the interface table;
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
